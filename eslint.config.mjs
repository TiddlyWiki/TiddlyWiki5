//@ts-check
/// <reference path="./eslint.unicorn.d.ts" />
/// <reference path="./eslint.eslint.d.ts" />
/// <reference path="./eslint.typescript.d.ts" />

import { defineConfig } from "eslint/config";
import eslint from '@eslint/js';
import globals from "globals";
import { fileURLToPath } from "node:url";
import unicorn from 'eslint-plugin-unicorn';
import typescript from "@typescript-eslint/eslint-plugin";
import esx from "eslint-plugin-es-x";
// import stylistic from '@stylistic/eslint-plugin'

// const stylisticConfig = stylistic.configs.customize({
//   // the following options are the default values
//   indent: "tab",
//   quotes: 'double',
//   semi: false,
//   jsx: true,
//   pluginName: "stylistic",
// });

export default defineConfig(
  {
    basePath: fileURLToPath(new URL(".", import.meta.url)),
    ignores: [
      // Ignore "third party" code whose style we will not change.
      "boot/sjcl.js",
      "core/modules/utils/base64-utf8/base64-utf8.module.js",
      "core/modules/utils/base64-utf8/base64-utf8.module.min.js",
      "core/modules/utils/diff-match-patch/diff_match_patch.js",
      "core/modules/utils/diff-match-patch/diff_match_patch_uncompressed.js",
      "core/modules/utils/dom/csscolorparser.js",
      "editions/tiddlywiki-surveys/great-interview-project-2010/**",
      "editions/test/**",
      "plugins/tiddlywiki/*/files/**",
      "eslint.config.js",
      "eslint.config.mjs",
      "playwright.config.js",
      "*.min.*.js",
      "*.min.js",
      "boot/sjcl.js",
    ],
    languageOptions: {
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "commonjs",
      },
      globals: {
        ...globals.browser,
        ...globals.commonjs,
        ...globals.node,
        $tw: "writable", // temporary
      },
    },
    plugins: {
      esx,
      eslint,
      typescript,
      unicorn,
    },
    extends: [
      "eslint/recommended",
      "typescript/recommended",
      "esx/restrict-to-es2017",
    ],

    rules: true ? {} : {
      // ...eslint.configs.recommended.rules,
      // some basic stuff that's part of tiddlywiki style
      "no-useless-escape": "off",
      "no-unused-vars": "off",
      "no-redeclare": "off",
      "no-empty": "off",
      "no-control-regex": "off",
      // turn off some typescript-eslint rules
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/prefer-for-of": "off",
      "@typescript-eslint/no-dynamic-delete": "off",
      "@typescript-eslint/no-this-alias": "off",
      // don't use global self
      "no-restricted-globals": ["error", "self"],
      // prefer template strings
      "prefer-template": "error",
      "template-curly-spacing": ["error", "never"],
      // extra rules beyond recommended
      "prefer-arrow-callback": "error",
      "prefer-const": "error",
      "no-var": "error",
      "one-var": ["error", "never"],
      "block-scoped-var": "warn",
      "no-inner-declarations": ["error"],
      "no-shadow": "error",
      "no-unassigned-vars": "error",
      "no-unneeded-ternary": "error",
      "no-useless-rename": "error",
      "object-shorthand": ["error", "always"],
      "operator-assignment": ["error", "always"],
      "prefer-destructuring": ["error", { "array": true, "object": true }, { "enforceForRenamedProperties": false }],
      "prefer-rest-params": "error",
      "prefer-spread": "error",
      "prefer-exponentiation-operator": "error",
      "prefer-object-has-own": "error",
      "prefer-object-spread": "off",

      "valid-typeof": "error",
      // cherry picked from unicorn otherwise it aggressively updates to newer versions
      "unicorn/empty-brace-spaces": "error",
      "unicorn/switch-case-braces": ["error"],
      "unicorn/no-this-assignment": "off",
      "unicorn/prefer-array-find": "error",
      "unicorn/prefer-includes": "error",
      "unicorn/prefer-modern-math-apis": "error",
      "unicorn/prefer-set-has": "error",
      "unicorn/prefer-spread": "error",
      "unicorn/prefer-string-raw": "error",
      // necessary formatting
      "indent": ["error", "tab", { outerIIFEBody: 0, SwitchCase: 1, }],

      "space-before-function-paren": ["error", "never"],
      "comma-spacing": ["error", { "before": false, "after": false }],
      "keyword-spacing": ["error", {
        before: true,
        after: false,
        overrides: {
          case: { after: true, },
          do: { after: true, },
          else: { after: true, },
          return: { after: true, },
          throw: { after: true, },
          try: { after: true, },
        },
      }],
      "arrow-spacing": ["error", { after: true, before: true, }],
      "brace-style": ["error", "1tbs", { "allowSingleLine": true }],
      "comma-dangle": ["error", "always-multiline"],
      "comma-style": ["error", "last"],
      "eol-last": ["error", "always"],

      "es-x/no-hashbang": "off",
    },
  },
);
