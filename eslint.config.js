import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig([
  {
    ignores: ["dist", "coverage", "node_modules"],
  },
  {
    files: ["**/*.{js,ts}"],
    extends: [js.configs.recommended, tseslint.configs.recommended],
  },
  {
    files: ["packages/chart/src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": "off",
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@xelstack/chart",
              message:
                "Do not self-import @xelstack/chart inside package source. Import internal modules via @/* or ./* instead.",
            },
          ],
          patterns: [
            {
              group: ["@xelstack/chart/*"],
              message:
                "Do not self-import @xelstack/chart subpaths inside package source. Keep package internals independent from the public entry.",
            },
          ],
        },
      ],
    },
  },
]);
