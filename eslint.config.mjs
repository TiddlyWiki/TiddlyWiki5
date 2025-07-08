//@ts-check
import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import globals from "globals";
import { fileURLToPath } from "node:url";

export default defineConfig({
  basePath: fileURLToPath(new URL(".", import.meta.url)),
  ignores: [
    // Ignore "third party" code whose style we will not change.
    "boot/sjcl.js",
    "core/modules/utils/base64-utf8/base64-utf8.module.js",
    "core/modules/utils/base64-utf8/base64-utf8.module.min.js",
    "core/modules/utils/diff-match-patch/diff_match_patch.js",
    "core/modules/utils/diff-match-patch/diff_match_patch_uncompressed.js",
    "core/modules/utils/dom/csscolorparser.js",
    "plugins/tiddlywiki/*/files/**",
    "eslint.config.js",
    "playwright.config.js",
    "eslint.config.mjs",

    "**/*.min.js",
    "editions/tiddlywiki-surveys/great-interview-project-2010/**",
    "editions/test/**",
  ],
  plugins: {
    js,
  },
  extends: [
    "js/recommended",
  ],
  languageOptions: {
    parserOptions: {
      ecmaVersion: 2017,
      sourceType: "commonjs",
    },
    globals: {
      ...globals.browser,
      ...globals.commonjs,
      ...globals.node,
      $tw: "writable", // temporary
    },

  },
  rules: {
    "no-useless-escape": "off",
    "no-unused-vars": "off",
    "no-redeclare": "off",
    "no-empty": "off",
    "no-restricted-globals": ["error", "self"],
  },
});
