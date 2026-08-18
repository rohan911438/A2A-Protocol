# Escrow contract: build & deployment notes

## Building the wasm

`cargo build --target wasm32-unknown-unknown --release` alone is **not
enough** to produce a wasm Soroban's host will accept. Modern Rust/LLVM
toolchains link a `wasm32-unknown-unknown` binary whose element segments
use an encoding Soroban's host wasm parser rejects:

```
HostError: Error(WasmVm, InvalidAction)
"reference-types not enabled: zero byte expected"
```

This is a **linker-level** encoding choice - `-C target-feature=-reference-types`
and `-C target-cpu=mvp` do not fix it, because they control instruction
selection, not the element-segment format the bundled `lld` still emits.
The actual fix is to re-normalize the linked wasm with
[Binaryen](https://github.com/WebAssembly/binaryen)'s `wasm-opt`:

```bash
cargo build --target wasm32-unknown-unknown --release
wasm-opt target/wasm32-unknown-unknown/release/a2a_escrow.wasm -mvp \
  -o target/wasm32-unknown-unknown/release/a2a_escrow.mvp.wasm
```

Deploy the `.mvp.wasm` file, not the raw cargo output. `smart_contract/deploy_testnet.py`
does this automatically (set `WASM_OPT=/path/to/wasm-opt` if it isn't on `PATH`).

This also explains prior failures on `stellar-cli`-based build platforms
that only build from source with plain `cargo build` and don't run an
MVP-normalization pass - the resulting wasm fails the same way.

## Verified testnet deployment (2026-08-18)

Deployed and exercised end-to-end via `deploy_testnet.py` (real create_deal
+ batched release_milestones cycle, seller balance confirmed on-chain):

- **Contract**: `CBCG25INND2P3BVBBRT44XJHSGDKAMUNEAVWUMI7J2TCIBMJVBNIZ2NU`
- **Token** (native XLM SAC, testnet): `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`

Set these in the backend environment to enable `CONTRACT_MODE=onchain`:

```
ESCROW_CONTRACT_ID=CBCG25INND2P3BVBBRT44XJHSGDKAMUNEAVWUMI7J2TCIBMJVBNIZ2NU
ESCROW_TOKEN_ID=CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC
```

The deploying admin key was a throwaway testnet keypair; it has no special
fund-moving power in the contract (see `initialize()` in `lib.rs`) and
isn't needed for the app to run against this deployment.

## Remaining work

`backend/routes/contract.py` still needs to be wired to
`backend/services/contract_service.py` behind a `CONTRACT_MODE=onchain`
flag - `contract_service.py` exists and its transaction-building logic was
verified against this live deployment, but the routes still default to the
legacy (non-contract-invoking) path.
