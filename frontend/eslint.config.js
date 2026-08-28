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

      // eslint-plugin-react-hooks v6 ships these as experimental "static
      // analysis" rules at error severity. They flag intentional, working
      // patterns in this codebase - one-time state hydration from
      // localStorage on mount, and effects that reference stable handlers
      // declared lower in the component. Kept visible as warnings; they are
      // advisories, not breakage. `rules-of-hooks` and `exhaustive-deps`
      // stay at their default (error / warn).
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/static-components': 'warn',

      // HMR-only hint: a couple of files (WalletContext) export a hook
      // alongside the provider by design. Not a runtime concern.
      'react-refresh/only-export-components': 'warn',
    },
  },
])
