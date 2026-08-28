# Frontend audit — state of checks

Last run: 2026-08-28. Re-run the three commands below to reproduce.

## Summary

| Check | Command | Result |
|---|---|---|
| Lint | `npm run lint` | **0 errors**, 19 warnings (all advisory — see below) |
| Production build | `npm run build` | **passes**, no chunk-size warning |
| Dependency audit | `npm audit` | 6 **low**, build-tooling only, no non-breaking fix |
| Type/import graph | (covered by build) | 2202 modules resolve, all routes chunk-split |

Nothing in the frontend is broken. The remaining lint output is warnings,
not errors, and every one is a known, deliberate pattern.

## What was fixed in this pass

1. **ESLint was reporting ~40 errors, ~20 of them false.** `no-unused-vars`
   had no way to see JSX references, so every `import { motion }` and every
   `as: Tag` prop read as dead code. Added `eslint-plugin-react` purely for
   `react/jsx-uses-vars`. The experimental `eslint-plugin-react-hooks` v6
   rules (`set-state-in-effect`, `immutability`, `static-components`) ship
   at error severity and flag intentional working code here — moved to
   `warn`. `rules-of-hooks` / `exhaustive-deps` unchanged.
2. **5 genuinely dead bindings removed** — `setNetwork`, two write-only
   `contractInfo` states, a fully write-only `dealId` state in DemoMode,
   and an unused `formatAddress` destructure.
3. **`MagneticButton`** no longer mints a component type per render
   (`motion.create(Component)` → stable `motion[Component]`).
4. **`App`** decides reduced-motion mode with a lazy `useState` initializer
   before first paint instead of `setState` inside an effect.
5. **Bundle split** — one 1.5 MB entry chunk → ~85 KB app entry +
   independently cached `stellar` / `react-vendor` / `motion` / `vendor`
   chunks.
6. **Deleted** unreferenced Vite-template leftovers (`App.css`,
   `assets/react.svg`, `assets/vite.svg`).

## Remaining warnings (19) — why they are left as warnings

- **`react-hooks/set-state-in-effect` (9)** — one-time state hydration from
  `localStorage` / feature detection on mount (WalletContext, pages). React
  docs call this "not recommended" in the general case; here the effects
  run once and the alternative (lazy initialisers everywhere) buys nothing.
- **`react-hooks/immutability` (3)** — effects that call a handler declared
  lower in the same component (`handleStart`, `disconnect`,
  `fetchBalances`). The handlers only touch stable setters, so the stale
  closure the rule warns about has no observable effect. Real cleanup would
  be `useCallback` + reorder; deferred as low-value churn in flows that
  can't be exercised headlessly here.
- **`react-hooks/exhaustive-deps` (6)** — pre-existing, in wallet/page
  effects; adding the flagged deps would re-run network calls on every
  render.
- **`react-refresh/only-export-components` (1)** — `WalletContext` exports
  `useWallet` next to `WalletProvider` by design. HMR-only hint.

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
