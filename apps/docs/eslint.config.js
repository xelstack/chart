import { createTypeScriptConfig, createAstroConfig, tseslint } from '../../eslint.base.js';

export default [
  ...createTypeScriptConfig({
    tsconfigRootDir: import.meta.dirname,
    project: './tsconfig.json',
  }),
  ...createAstroConfig(),
  {
    files: ['**/*.astro/*.ts', '**/*.astro/*.js'],
    ...tseslint.configs.disableTypeChecked,
    rules: {
      ...tseslint.configs.disableTypeChecked.rules,
      '@typescript-eslint/ban-ts-comment': 'off',
    },
  },
  { ignores: ['dist/', '.astro/', 'node_modules/', '*.js'] },
];
