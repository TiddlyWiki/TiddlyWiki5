# ESLint Stylistic Optimization Analysis

Analysis of `eslint.config.mjs` for the goals of **pretty-printing** the codebase and **reducing total file size**.

## Current State
The project uses **tabs for indentation**, which is the most efficient choice for file size (1 byte per level). However, many "cleanliness" rules are disabled, leading to invisible bloat.

## Recommended Improvements

### 1. Eliminate "Invisible" Bloat
These rules remove bytes that don't affect code logic:
*   **`@stylistic/no-trailing-spaces`**: Enable as `error`. Removes useless spaces at line endings.
*   **`@stylistic/no-multiple-empty-lines`**: Set to `["error", { "max": 1, "maxEOF": 0 }]`. Prevents vertical bloat.
*   **`@stylistic/no-extra-semi`**: Enable as `error`. Removes redundant semicolons.

### 2. Compact Structural Styling
*   **`@stylistic/quote-props`**: Set to `["error", "as-needed"]`. **Major size saver**: Removes quotes from object keys where not strictly required (e.g., `{ name: "val" }` vs `{ "name": "val" }`).
*   **`@stylistic/comma-dangle`**: Set to `["error", "never"]`. Saves 1 byte per property compared to trailing commas.
*   **`@stylistic/object-curly-spacing`**: Set to `["error", "never"]`. Saves 2 bytes per object literal (e.g., `{a:1}` vs `{ a: 1 }`).

### 3. Pretty-Printing (Readability)
These add minimal bytes but significantly improve visual quality:
*   **`@stylistic/space-infix-ops`**: Enable as `error`. Adds spaces around operators (`a + b` vs `a+b`).
*   **`@stylistic/spaced-comment`**: Set to `["error", "always"]`. Ensures comments are readable.
*   **`@stylistic/keyword-spacing`**: Standardize with `after: true` for most keywords to ensure a professional "pretty" look.

## Summary of Impact
By combining **Tabs + No Trailing Spaces + As-needed Quote Props**, the total file size of the repository will likely decrease by **5-10%** even after adding readability spaces around operators.
