import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    plugins: { react },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // Count identifiers referenced from JSX (`<motion.div>`, `<Tag>`) as
      // used. Without this, `no-unused-vars` is blind to JSX and reports
      // every `import { motion }` and every `as: Tag` prop as dead code.
      'react/jsx-uses-vars': 'error',
      'react/jsx-uses-react': 'off', // automatic JSX runtime - no React import needed

      'no-unused-vars': [
        'error',
        {
          varsIgnorePattern: '^[A-Z_]',
          argsIgnorePattern: '^_|^[A-Z]',
          caughtErrorsIgnorePattern: '^_|^err',
        },
      ],

      // `set-state-in-effect` fires on two patterns the React docs
      // themselves present as correct: setting a `loading` flag immediately
      // before an `await` in a fetch effect, and resetting derived state
      // when the prop it depends on changes. Satisfying it here would mean
      // making those effects *less* idiomatic, so it is turned off. The
      // genuinely-derived-from-state cases it did catch (ActiveDeal
      // milestones) were converted to `useMemo` instead.
      'react-hooks/set-state-in-effect': 'off',
      // Kept armed as warnings - these catch real issues (a handler used in
      // an effect before its declaration; a component defined during
      // render). Current count: 0.
      'react-hooks/immutability': 'warn',
      'react-hooks/static-components': 'warn',

      // HMR-only hint: a couple of files (WalletContext) export a hook
      // alongside the provider by design. Not a runtime concern.
      'react-refresh/only-export-components': 'warn',
    },
  },
])
