/** @type {import("prettier").Config} */
const config = {
  semi: true,
  tabWidth: 2,
  useTabs: false,
  plugins: ["@ianvs/prettier-plugin-sort-imports"],
  importOrder: [
    "<BUILTIN_MODULES>",
    "<THIRD_PARTY_MODULES>",
    "",
    "^@/",
    "",
    "^[.]",
  ],
  importOrderTypeScriptVersion: "6.0.3",
  importOrderCaseSensitive: false,
  importOrderSafeSideEffects: [],
};

export default config;
