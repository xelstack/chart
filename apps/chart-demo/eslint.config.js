import { createTypeScriptConfig } from '../../eslint.base.js';

export default [
  ...createTypeScriptConfig({
    tsconfigRootDir: import.meta.dirname,
    project: './tsconfig.json',
  }),
  { ignores: ['dist/', 'node_modules/', '*.js'] },
];
