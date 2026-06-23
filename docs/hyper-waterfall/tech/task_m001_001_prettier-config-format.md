# Prettier Config File Format

## Finding

Prettier supports JSON, JavaScript ESM, JavaScript CommonJS, TypeScript, YAML, and TOML config files.

For this repository, `prettier.config.js` is the best initial fit because the root `package.json` uses `"type": "module"`.

## Evidence

- Prettier official documentation lists `prettier.config.js` and `prettier.config.cjs` as supported config file names.
- Prettier official documentation says `.js` config uses `export default` or `module.exports` depending on the `type` value in `package.json`.
- TanStack Query uses root `"type": "module"` and `prettier.config.js` with `export default`.
- Vue Core uses `.prettierrc`.
- Rollup uses `.prettierrc.json`.

## Decision

Use:

```text
prettier.config.js
```

with:

```js
/** @type {import("prettier").Config} */
const config = {
  semi: true,
  tabWidth: 2,
  useTabs: false,
};

export default config;
```

Do not use `prettier.config.cjs` unless a future tool requires CommonJS config loading.

## Revisit When

- Prettier config needs CommonJS-only plugin loading.
- The root package stops using `"type": "module"`.
- Tooling fails to load ESM Prettier config.
