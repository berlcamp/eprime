import js from '@eslint/js'
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import react from 'eslint-plugin-react'
import neostandard from 'neostandard'
import tseslint from 'typescript-eslint'

/**
 * Flat config, replacing the .eslintrc.js that `next lint` used before Next 16.
 * The rule overrides in the last block are ported verbatim from that file.
 */
export default [
  {
    // The pre-Next-16 setup did not report these; the repo has ~169 inline
    // exhaustive-deps disables that are unused now that the rule is off.
    linterOptions: { reportUnusedDisableDirectives: 'off' }
  },
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'next-env.d.ts',
      'types/supabase.ts'
    ]
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  react.configs.flat.recommended,
  ...neostandard({ ts: true, noStyle: true }),
  ...nextCoreWebVitals,

  // Type-aware linting only for TypeScript sources. The repo's .js files
  // (next.config, tailwind.config, postcss.config, GlobalRedux/provider)
  // are not in the tsconfig project, so type-checked rules cannot run there.
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      }
    }
  },
  {
    settings: {
      react: { version: 'detect' }
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error'],
      '@typescript-eslint/no-explicit-any': 'off',
      'react/prop-types': 0,
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@typescript-eslint/promise-function-async': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'multiline-ternary': 'off',
      '@typescript-eslint/quotes': 'off',
      '@typescript-eslint/semi': 'off',
      '@typescript-eslint/comma-dangle': 'off',
      '@typescript-eslint/member-delimiter-style': 'off',
      '@typescript-eslint/indent': 'off',
      '@typescript-eslint/space-before-function-paren': ['off'],
      '@typescript-eslint/no-confusing-void-expression': 'off',
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/consistent-type-assertions': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      'no-empty-function': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      'no-unneeded-ternary': 'off',
      '@typescript-eslint/naming-convention': 'off',
      'react/no-unescaped-entities': 'off',
      'react/display-name': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      curly: 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
      '@typescript-eslint/no-misused-promises': [
        2,
        { checksVoidReturn: { attributes: false } }
      ],
      // neostandard's noStyle drops the whole @stylistic layer; these two were
      // enforced by the old standard-with-typescript setup and caught real issues.
      'eol-last': ['error', 'always'],
      'no-trailing-spaces': 'error',

      // `void somePromise()` is used deliberately throughout to mark a floating
      // promise as intentional; standard-with-typescript allowed this too.
      'no-void': ['error', { allowAsStatement: true }],
      // Supabase columns are snake_case and flow straight into identifiers.
      camelcase: 'off',
      // Not enforced by the pre-Next-16 config; left off to keep this migration
      // behaviour-neutral rather than introducing a new style sweep.
      'react/self-closing-comp': 'off',
      'react/jsx-boolean-value': 'off',
      'react/jsx-handler-names': 'off',

      // New in Next 16 (eslint-plugin-react-hooks v6). These flag real patterns
      // worth fixing, but they are pre-existing and out of scope for the upgrade,
      // so they surface as warnings instead of blocking.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/incompatible-library': 'warn'
    }
  },

  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    ...tseslint.configs.disableTypeChecked
  },
  {
    // CommonJS config files at the repo root legitimately use require().
    files: ['*.config.js', 'postcss.config.js', 'tailwind.config.js'],
    rules: { '@typescript-eslint/no-require-imports': 'off' }
  }
]
