## Summary

Fixes #9471: Multi-valued variables (MVVs) introduced in #8972 lose their multi-valued nature when passed as procedure/function parameters through `$transclude` because `<<var>>` resolves to the first value only (for backwards compatibility).

There has been a lot of discussion about these issues. Working through them has reversed my opinion on some points. In particular, it introduces the `((var))` syntax as the MVV counterpart to `<<var>>`, mirroring the existing relationship in filter operands where `<var>` returns a single value and `(var)` returns all values.

## New syntax

* `((var))` as widget attribute: Passes all values of the MVV to the procedure/function parameter
* `((var))` as inline wikitext: Displays all MVV values joined with `, ` (default separator)
* `((var\|\|sep))` as inline wikitext: Displays all MVV values joined with custom separator
* `(((filter)))` as inline wikitext: Displays filter results joined with `, ` (default separator)
* `(((filter\|\|sep)))` as inline wikitext: Displays filter results joined with custom separator
* `((var))` as parameter default: e.g. `\procedure show(items:((defaults)))` — default value is the MVV
