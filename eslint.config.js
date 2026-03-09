import eslint from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import security from 'eslint-plugin-security';
import prettier from 'eslint-config-prettier';

export default [
  // Global ignores
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/.turbo/**',
      '**/target/**',
      '**/*.js',
      '**/*.mjs',
      '**/*.cjs',
      'website/**',
      'docs/**',
      'infra/**',
      'monitoring/**',
      'tools/**',
      'apps/**',
      'eslint.config.js',
    ],
  },

  // Base recommended config
  eslint.configs.recommended,

  // TypeScript files config
  {
    files: ['packages/*/src/**/*.ts', 'packages/*/src/**/*.tsx', 'packages/shared/*/src/**/*.ts', 'packages/shared/*/src/**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      security,
    },
    rules: {
      // Disable base rules that conflict with TS
      'no-unused-vars': 'off',
      'no-undef': 'off',
      'no-redeclare': 'off',

      // TypeScript rules
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-require-imports': 'error',

      // Security rules
      'security/detect-object-injection': 'warn',
      'security/detect-non-literal-fs-filename': 'error',
      'security/detect-non-literal-regexp': 'warn',
      'security/detect-non-literal-require': 'error',
      'security/detect-unsafe-regex': 'error',
      'security/detect-buffer-noassert': 'error',
      'security/detect-child-process': 'error',
      'security/detect-disable-mustache-escape': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-no-csrf-before-method-override': 'error',
      'security/detect-pseudoRandomBytes': 'error',
      'security/detect-possible-timing-attacks': 'error',
      'security/detect-new-buffer': 'error',
    },
  },

  // Prettier must be last
  prettier,
];