import { createTypeScriptConfig, createTestOverride } from '../../eslint.base.js';

export default [
  ...createTypeScriptConfig({
    tsconfigRootDir: import.meta.dirname,
    project: './tsconfig.json',
  }),
  createTestOverride({
    tsconfigRootDir: import.meta.dirname,
    testTsconfig: './tsconfig.test.json',
    files: ['tests/**/*.ts'],
  }),
  { ignores: ['dist/', 'node_modules/', '*.js'] },
];
