import { createTypeScriptConfig } from '../../eslint.base.js';

export default [
  ...createTypeScriptConfig({
    tsconfigRootDir: import.meta.dirname,
    project: './tsconfig.json',
  }),
  {
    files: ['tests/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
    },
  },
  { ignores: ['node_modules/', 'playwright-report/', 'test-results/', '*.js'] },
];
