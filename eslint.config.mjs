import {defineConfig, globalIgnores} from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import prettierRecommended from 'eslint-plugin-prettier/recommended'

const eslintConfig = defineConfig([
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts'
  ]),
  ...nextTs,
  ...nextVitals,
  prettierRecommended,
  {
    rules: {
      'linebreak-style': ['error', 'unix'],
      'no-console': 'off',
      'react/no-unescaped-entities': 0,
      'react/self-closing-comp': 1,
      radix: 1,
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      camelcase: 'off',
      '@next/next/no-img-element': ['warn'],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_'
        }
      ]
    }
  }
])

export default eslintConfig
