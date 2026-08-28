# Frontend audit — state of checks

Last run: 2026-08-28. Re-run the three commands below to reproduce.

## Summary

| Check | Command | Result |
|---|---|---|
| Lint | `npm run lint` | **0 problems** (0 errors, 0 warnings), exit 0 |
| Production build | `npm run build` | **passes**, no chunk-size warning |
| Dependency audit | `npm audit` | 6 **low**, build-tooling only, no non-breaking fix |
| Type/import graph | (covered by build) | ~2200 modules resolve, all routes chunk-split |
| Dev server smoke | `npm run dev` + curl | boots, HTTP 200, core modules transform clean |

Nothing in the frontend is broken and the lint gate is fully clean.

## What was fixed

1. **ESLint reported ~40 errors, ~20 of them false.** `no-unused-vars` had
   no way to see JSX references, so every `import { motion }` and every
   `as: Tag` prop read as dead code. Added `eslint-plugin-react` purely for
   `react/jsx-uses-vars`.
2. **`react-hooks` v7 rules calibrated.** `set-state-in-effect` is turned
   **off** — it fires on two patterns the React docs present as correct
   (`setLoading(true)` before an `await`; resetting derived state when its
   input prop changes). `immutability` / `static-components` stay armed as
   warnings (current count 0). `rules-of-hooks` / `exhaustive-deps`
   unchanged.
3. **Genuinely dead bindings removed** — `setNetwork`, two write-only
   `contractInfo` states, a write-only `dealId` state, an unused
   `formatAddress` destructure.
4. **`WalletContext` refactor** — `fetchBalances` / `connect` / `disconnect`
   are now `useCallback`, wallet identity hydrates from `localStorage` in
   lazy `useState` initialisers instead of an effect, `isStellarAccount`
   hoisted to module scope. Cleared 3 `immutability` + several
   `exhaustive-deps` warnings.
5. **`NegotiationRoom`** — `resolveDealId` / `handleStart` moved above their
   effects and wrapped in `useCallback`; the auto-start effect now lists
   its real deps. **`Dashboard`** — `loadDeals` is `useCallback`.
   **`ActiveDeal`** — `milestones` was mirrored from `dealRecord` via an
   effect; now a `useMemo` (pure projection).
6. **`MagneticButton`** no longer mints a component type per render
   (`motion.create(Component)` → stable `motion[Component]`).
7. **`App`** decides reduced-motion mode with a lazy `useState` initializer
   before first paint instead of `setState` inside an effect.
8. **Bundle split** — one 1.5 MB entry chunk → ~85 KB app entry +
   independently cached `stellar` / `react-vendor` / `motion` / `vendor`.
9. **Deleted** unreferenced Vite-template leftovers (`App.css`,
   `assets/react.svg`, `assets/vite.svg`).

## `npm audit` — 6 low, no action

All six chain through the build-time polyfill:

```
vite-plugin-node-polyfills → node-stdlib-browser → crypto-browserify
  → browserify-sign / create-ecdh → elliptic  (GHSA-848j-6mx2-7j84, low)
```

`npm audit fix` has no non-breaking fix; `--force` downgrades
`vite-plugin-node-polyfills` to 0.2.0 (breaking). This is dev/build
tooling, not shipped runtime code, and the advisory is low severity — left
as-is deliberately.

## Known non-blocking build notice

`vite-plugin-node-polyfills` prints a one-line deprecation notice
(`esbuild` option → prefer `oxc`) under Vite 8. It originates inside the
plugin, not this repo's config, and the build completes normally.
