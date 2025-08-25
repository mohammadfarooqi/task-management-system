import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      'no-case-declarations': 'warn',
    },
  },
  {
    ignores: ['**/*.html', '**/*.css', '**/*.scss'],
  },
];
