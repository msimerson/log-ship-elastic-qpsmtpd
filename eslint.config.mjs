import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
      ecmaVersion: 2024,
      sourceType: "commonjs",
    },
    rules: {
      "curly": ["warn", "multi-line"],
      "dot-notation": "error",
      "eqeqeq": "error",
      "no-unused-vars": ["error", {
        "vars": "all",
        "args": "none",
        "varsIgnorePattern": "^_$"
      }],
      "no-use-before-define": ["error", "nofunc"],
      "radix": "error",
      "strict": ["error", "global"]
    }
  },
  {
    files: ["eslint.config.mjs"],
    languageOptions: {
      sourceType: "module",
    }
  }
];
