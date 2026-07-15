import {defineConfig, globalIgnores} from 'eslint/config'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import prettierRecommended from 'eslint-plugin-prettier/recommended'
import tailwind from 'eslint-plugin-tailwindcss'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const eslintConfig = defineConfig([
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    '.claude/**', // Claude Code worktrees/settings — not project source
    '.vercel/**',
    'next-env.d.ts',
    'src/components/ui/**' // Ignore shadcn/ui components
  ]),
  ...nextTs,
  ...nextVitals,
  prettierRecommended,
  // eslint-plugin-tailwindcss v4 exposes a single flat-config object at
  // `configs.recommended` (the v3 `configs['flat/recommended']` array is gone)
  tailwind.configs.recommended,
  {
    // Match the file globs eslint-config-next registers its plugins for, so the
    // rule overrides below never apply to a file where a plugin is missing
    files: ['**/*.{js,jsx,mjs,ts,tsx,mts,cts}'],
    // The tailwindcss recommended config above only registers the plugin for
    // its own `files` globs; re-register it here (same instance, so this is
    // allowed) to cover every file this object applies to
    plugins: {
      tailwindcss: tailwind
    },
    settings: {
      // eslint-plugin-tailwindcss v4 resolves the theme from the Tailwind v4
      // CSS entry point (not the legacy JS config)
      tailwindcss: {
        cssConfigPath: path.join(__dirname, './src/app/globals.css')
      }
    },
    rules: {
      camelcase: 'off',
      radix: 'warn',
      'linebreak-style': ['error', 'unix'],
      'no-console': 'off',
      'prettier/prettier': 'warn',
      'react/no-unescaped-entities': 'off',
      'react/self-closing-comp': 'warn',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-unused-expressions': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        }
      ],
      '@next/next/no-img-element': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      // prettier-plugin-tailwindcss owns class ordering; the v4 eslint rule
      // disagrees with it, so keep it off to avoid churn
      'tailwindcss/classnames-order': 'off',
      'tailwindcss/enforces-shorthand': 'warn',
      'tailwindcss/no-custom-classname': [
        'warn',
        {
          whitelist: [
            // All shadcn/ui CSS-variable color tokens: any utility prefix +
            // optional sub-variant + optional opacity modifier (e.g. bg-primary/10)
            '(bg|text|border|border-[tblrxy]|ring|from|to|via|fill|stroke|shadow|divide|outline|decoration)-(background|foreground|card|popover|primary|secondary|muted|accent|destructive|input|border|ring|sidebar)([a-z-]*)?(/\\d+)?'
          ]
        }
      ]
    }
  }
])

export default eslintConfig
