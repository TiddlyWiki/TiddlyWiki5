# TiddlyWiki Performance Optimization — Concept Summary

This document captures the full context from a conversation optimizing `getOrphanTitles` in `core/modules/wiki.js`, including lessons learned for writing TiddlyWiki performance benchmarks. Feed this into a new conversation to replicate the approach for similar optimizations.

---

## 1. The Optimization Pattern

### Problem: `indexOf` + `splice` on arrays is O(n²)

Several functions in `core/modules/wiki.js` (around line 638+) use a pattern where they build up or filter an array using `Array.indexOf()` for deduplication/lookup and `Array.splice()` for removal. Both are O(n) per call, making the overall function O(n²) when called inside a loop over all tiddlers.

### Solution: Use `Object.create(null)` as a hash map for O(1) lookups

Replace `indexOf` checks with property lookups on a plain object (`Object.create(null)`), and `splice` removals with a two-pass collect-then-filter approach.

### Example — `getOrphanTitles`

**Before (O(n²)):**
```javascript
exports.getOrphanTitles = function() {
    var self = this,
        orphans = this.getTiddlers();
    this.forEachTiddler(function(title, tiddler) {
        var links = self.getTiddlerLinks(title);
        $tw.utils.each(links, function(link) {
            var p = orphans.indexOf(link);    // O(n) scan
            if(p !== -1) {
                orphans.splice(p, 1);         // O(n) shift
            }
        });
    });
    return orphans;
};
```

**After (O(n)):**
```javascript
exports.getOrphanTitles = function() {
    var self = this,
        linkedTitles = Object.create(null);
    this.forEachTiddler(function(title, tiddler) {
        var links = self.getTiddlerLinks(title);
        $tw.utils.each(links, function(link) {
            linkedTitles[link] = true;        // O(1) insert
        });
    });
    var orphans = [];
    this.forEachTiddler(function(title, tiddler) {
        if(!linkedTitles[title]) {            // O(1) lookup
            orphans.push(title);
        }
    });
    return orphans;
};
```

### Candidate for same optimization: `getMissingTitles`

Located directly above `getOrphanTitles` in `core/modules/wiki.js` (line ~641). Uses `missing.indexOf(link) === -1` for deduplication. Replace with `Object.create(null)` hash map, then `Object.keys()` at the end. Note: The speedup is smaller here (~1.2-1.4x) because the missing list is typically small (hundreds, not thousands), so `indexOf` cost is low.

---

## 2. How to Write TiddlyWiki Benchmarks

### File structure

Benchmark files go in `editions/test/tiddlers/tests/` (or a subfolder like `benchmarks/`). They need the TiddlyWiki module header:

```javascript
/*\
title: test-my-benchmark.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Description here.

\*/
"use strict";
```

The `$:/tags/test-spec` tag is required for the Jasmine test runner to pick up the file.

### Running benchmarks

```bash
# Run ALL tests
node tiddlywiki.js editions/test --verbose --test

# Run only specific tests using Jasmine's specFilter (matches against full spec name)
node tiddlywiki.js editions/test --verbose --test spec="Orphan"
```

The `spec=` parameter is a regex matched against the full spec name (describe + it text).

### Key TiddlyWiki APIs for tests

```javascript
// Create a wiki instance (use enableIndexers:[] to disable indexers for controlled testing)
var wiki = new $tw.Wiki({enableIndexers: []});
wiki.addIndexersToWiki();

// Add tiddlers — accepts plain objects, auto-converts to $tw.Tiddler
wiki.addTiddler({ title: "MyTiddler", text: "Content with [[Link]]" });

// Core methods
wiki.getTiddlers()                    // Returns sorted array of non-system tiddler titles
wiki.forEachTiddler(function(title, tiddler) { ... })
wiki.getTiddlerLinks(title)           // Returns array of link targets (parsed from wikitext)
wiki.tiddlerExists(title)             // Boolean check
wiki.isShadowTiddler(title)           // Boolean check
wiki.parseTiddler(title)              // Returns parse tree (cached per tiddler)
wiki.extractLinks(parseTree)          // Extracts link targets from parse tree
wiki.filterTiddlers(filterString)     // Run a TW filter
```

### Link syntax in tiddler text

Links are created with `[[TargetTitle]]` wikitext syntax. The parser extracts these via `extractLinks()` which walks the parse tree looking for `type === "link"` nodes.

### Critical gotchas learned

1. **No `beforeAll` in browser Jasmine** — TW's in-browser Jasmine doesn't reliably support `beforeAll`. Initialize the wiki directly at `describe` scope (not inside `beforeAll` or `beforeEach`). This works in both Node and browser.

2. **Timer resolution in browsers** — Browser `performance.now()` may have only 1ms resolution (integer values). For fast functions (~5-10ms), individual timings round to the same value, making comparisons meaningless. **Solution:** Batch multiple iterations per timed sample:
   ```javascript
   var ITERATIONS_PER_SAMPLE = 10;
   // ...
   var start = now();
   for(i = 0; i < ITERATIONS_PER_SAMPLE; i++) {
       result = fn();
   }
   var end = now();
   times.push((end - start) / ITERATIONS_PER_SAMPLE);
   ```

3. **Cross-platform timer** — Use `performance.now.bind(performance)` (not a wrapper that calls `performance.now()` — linters may rename it to `now()` creating infinite recursion). Fallback to `process.hrtime()` for older Node:
   ```javascript
   var now = (typeof performance !== "undefined" && typeof performance.now === "function")
       ? performance.now.bind(performance)
       : function() {
           var hr = process.hrtime();
           return hr[0] * 1000 + hr[1] / 1e6;
       };
   ```

4. **Linter interference** — A project linter automatically renames things. Be aware that `performance.now()` inside a function called `now` will get rewritten to `now()` (infinite recursion). Using `.bind()` avoids this.

5. **Seeded PRNG for reproducibility** — Use a deterministic PRNG (mulberry32) instead of `Math.random()` so benchmark data is identical across runs.

### Benchmark function template

```javascript
function benchmarkFn(fn, label) {
    var r, i;
    for(r = 0; r < WARMUP_RUNS; r++) { fn(); }
    var times = [], result;
    for(r = 0; r < BENCHMARK_RUNS; r++) {
        var start = now();
        for(i = 0; i < ITERATIONS_PER_SAMPLE; i++) { result = fn(); }
        var end = now();
        times.push((end - start) / ITERATIONS_PER_SAMPLE);
    }
    times.sort(function(a,b) { return a - b; });
    var median = times[Math.floor(times.length / 2)];
    console.log("  " + label + ": median=" + median.toFixed(2) + "ms");
    return { result: result, median: median };
}
```

### Correctness test pattern

Always verify the new implementation returns the same results before benchmarking:
```javascript
it("correctness: new should match old", function() {
    var oldSorted = oldFn().slice().sort();
    var newSorted = newFn().slice().sort();
    expect(newSorted).toEqual(oldSorted);
});
```

Sort both results since order may differ between implementations.

---

## 3. Synthetic Test Data Design

For 10,000 tiddlers:
- **10% linking** (1,000 tiddlers) — contain `[[Target]]` wikitext links, 1-5 links each
- **20% no links** (2,000 tiddlers) — plain text, no links at all
- **70% remaining** — plain text, no links (these plus the 20% form the bulk)
- **10% missing targets** (1,000 titles) — link targets that have no corresponding tiddler (e.g., "MissingTiddler0" through "MissingTiddler999")

This produces ~7,600 orphan tiddlers and ~259 missing tiddlers, which is a realistic distribution.

Use Fisher-Yates shuffle with seeded PRNG to randomly assign which tiddlers get links vs no links.

---

## 4. Observed Results

| Function | Old (ms) | New (ms) | Speedup |
|---|---|---|---|
| `getOrphanTitles` | ~48-130 | ~11-13 | **4-10x faster** |
| `getMissingTitles` | ~7-8 | ~6-7 | ~1.2-1.4x faster |

The `getOrphanTitles` speedup is dramatic because `indexOf`+`splice` on a 10,000-element array is expensive. The `getMissingTitles` speedup is modest because the missing array stays small (~259 elements).

---

## 5. File Locations

- **Optimized source:** `core/modules/wiki.js` — `getOrphanTitles` (~line 656), `getMissingTitles` (~line 641)
- **Benchmark test:** `editions/test/tiddlers/tests/benchmarks/test-orphans-benchmark.js`
- **TW test runner:** `plugins/tiddlywiki/jasmine/jasmine-plugin.js` (filter on line 13)
- **TW boot:** `boot/boot.js` — `$tw.Wiki` constructor, `addTiddler`, etc.
- **Link extraction:** `core/modules/wiki.js` — `extractLinks` (~line 501), `getTiddlerLinks` (~line 525)
- **Test command:** `plugins/tiddlywiki/jasmine/command.js` — supports `spec=` filter parameter
