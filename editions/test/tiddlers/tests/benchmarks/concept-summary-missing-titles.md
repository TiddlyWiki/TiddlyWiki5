# TiddlyWiki Performance Optimization — getMissingTitles

This document captures the context for the `getMissingTitles` optimization in `core/modules/wiki.js`.

---

## 1. The Optimization

### Change: Replace `forEachTiddler()` with `each()` and `indexOf` dedup with hashmap

**Before:**
```javascript
exports.getMissingTitles = function() {
    var self = this,
        missing = [];
    this.forEachTiddler(function(title, tiddler) {
        var links = self.getTiddlerLinks(title);
        $tw.utils.each(links, function(link) {
            if((!self.tiddlerExists(link) && !self.isShadowTiddler(link)) && missing.indexOf(link) === -1) {
                missing.push(link);
            }
        });
    });
    return missing;
};
```

**After:**
```javascript
exports.getMissingTitles = function() {
    var self = this,
        missing = Object.create(null);
    this.each(function(tiddler, title) {
        var links = self.getTiddlerLinks(title);
        $tw.utils.each(links, function(link) {
            if(!self.tiddlerExists(link) && !self.isShadowTiddler(link)) {
                missing[link] = true;
            }
        });
    });
    return Object.keys(missing);
};
```

---

## 2. Why `each()` is preferred over `forEachTiddler()`

### Performance: `forEachTiddler()` sorts on every call

`forEachTiddler()` (`core/modules/wiki.js`, line ~488) calls `this.getTiddlers(options)` internally, which:

1. Collects all non-system tiddler titles
2. **Sorts them alphabetically** via `sortTiddlers()` — O(n log n)
3. Returns a new array

This sort happens on **every call** to `getMissingTitles`. For a wiki with 10,000 tiddlers, that's an expensive sort each time — completely wasted work since missing-title scanning doesn't need any particular order.

`each()` (`boot/boot.js`, line ~1284) simply iterates the internal tiddler hash directly via `getTiddlerTitles()`. No sorting, no filtering, no new array allocation.

### Correctness: `forEachTiddler()` skips system tiddlers

`forEachTiddler()` excludes system tiddlers (`$:/...` prefix) by default. This means links originating from system tiddlers were not scanned — if a system tiddler links to a non-existent tiddler, it would not appear in the missing list.

Using `each()` includes system tiddlers as link sources, making the result more complete and consistent.

### Summary

| Aspect | `forEachTiddler()` | `each()` |
|---|---|---|
| Sorting | Sorts alphabetically every call — O(n log n) | No sort — direct iteration |
| System tiddlers | Excluded by default | Included |
| Callback signature | `function(title, tiddler)` | `function(tiddler, title)` |

Note the **swapped callback parameter order**: `each()` passes `(tiddler, title)` while `forEachTiddler()` passes `(title, tiddler)`.

---

## 3. Why hashmap dedup replaces `indexOf`

The old code used `missing.indexOf(link) === -1` to check for duplicates before pushing to the array. While the missing list is typically small (~259 elements in a 10k wiki), the hashmap approach with `Object.create(null)` provides:

- **O(1) deduplication** instead of O(n) `indexOf` scans
- **Simpler code** — no need for the combined boolean condition; the hashmap naturally deduplicates by overwriting
- **`Object.keys(missing)`** at the end converts the hashmap back to an array

This is the same pattern used in the `getOrphanTitles` optimization.

---

## 4. Initial Prediction vs Actual Results

The `getOrphanTitles` concept summary predicted a modest ~1.2-1.4x speedup for `getMissingTitles` because the missing list is typically small. However, the actual benchmark showed a much larger speedup because the `each()` vs `forEachTiddler()` swap contributes significantly — the unnecessary O(n log n) sort was the dominant cost.

---

## 5. Benchmark Results

| Metric | Old (`forEachTiddler` + `indexOf`) | New (`each` + hashmap) | Speedup |
|---|---|---|---|
| Median (10k tiddlers) | ~7.08ms | ~1.44ms | **~5x faster** |

---

## 6. Benchmark Architecture

Uses the same three-file architecture as the `getOrphanTitles` benchmark:

```
editions/test/tiddlers/tests/benchmarks/
├── missing-benchmark-core.js         ← Shared benchmark logic
├── test-missing-benchmark.js         ← Thin Jasmine wrapper (browser + full TW)
├── run-benchmark.js                  ← Standalone runner (auto-detects all *-benchmark-core.js)
└── concept-summary-missing-titles.md ← This file
```

The standalone runner (`run-benchmark.js`) auto-detects all `*-benchmark-core.js` files in the directory, so it runs benchmarks from multiple optimization branches automatically.

### Dual-mode: Node module + browser console

`missing-benchmark-core.js` works in three contexts:

1. **Node test suite** — `require("missing-benchmark-core.js")` returns `{ run: fn }`, called by the Jasmine wrapper
2. **Standalone runner** — same `require()` path, called by `run-benchmark.js`
3. **Browser console** — paste the entire file; it detects `typeof exports === "undefined"` and auto-runs with `$tw.wiki`

`buildWiki($tw, wiki)` accepts an optional second argument:
- **Omitted / falsy** — creates a fresh isolated `new $tw.Wiki({enableIndexers: []})`. Used by the Node test suite.
- **Provided** (e.g., `$tw.wiki`) — adds tiddlers to the existing live wiki. Used when pasted into the browser console.

Both modes produce **identical tiddlers** — same titles (e.g., `"Tiddler0"`), same content, same seeded PRNG, same percentages. No prefixes, no extra fields (tags, etc.). This ensures benchmark results are comparable across environments.

In the browser, tiddlers persist after the benchmark — they are **not** cleaned up. Find them via `[prefix[Tiddler]]` or `[prefix[MissingTiddler]]` in Advanced Search.

See `concept-summary.md` (from the `getOrphanTitles-performance-improvement` branch) for full details on the benchmark architecture, TiddlyWiki test APIs, and gotchas.

---

## 7. Design Rules

1. **Keep test tiddlers identical across environments** — Do not add tags, prefixes, extra fields, or any data that the isolated wiki mode doesn't add. Any difference changes test conditions (e.g., tags affect link parsing, prefixes change titles), making results non-comparable. Both modes must produce the exact same tiddlers.

---

## 8. File Locations

- **Optimized source:** `core/modules/wiki.js` — `getMissingTitles` (line ~645)
- **`each()` definition:** `boot/boot.js` (line ~1284)
- **`forEachTiddler()` definition:** `core/modules/wiki.js` (line ~488)
- **Benchmark core:** `editions/test/tiddlers/tests/benchmarks/missing-benchmark-core.js`
- **Jasmine wrapper:** `editions/test/tiddlers/tests/benchmarks/test-missing-benchmark.js`
- **Standalone runner:** `editions/test/tiddlers/tests/benchmarks/run-benchmark.js`
