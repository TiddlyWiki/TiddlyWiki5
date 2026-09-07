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

## 2. Benchmark Architecture: Shared Core + Two Runners + Browser Console

### The problem

Running benchmarks via the full TW Jasmine test suite (`node tiddlywiki.js editions/test --verbose --test`) is slow on Windows due to process startup overhead and full TW boot. But we also need benchmarks to run in the browser via the Jasmine test runner. And sometimes we want to add test tiddlers to a **live wiki** in the browser to test UI responses interactively.

### The solution: Three-file architecture with UMD-style auto-run

Write the benchmark logic **once** in a shared core module, then use two thin runner wrappers. The core module also auto-runs when pasted into a browser console.

```
editions/test/tiddlers/tests/benchmarks/
├── orphans-benchmark-core.js   ← Shared benchmark logic (+ browser console auto-run)
├── test-orphans-benchmark.js   ← Thin Jasmine wrapper (browser + full TW)
├── run-benchmark.js            ← Thin standalone wrapper (fast local testing)
└── concept-summary.md          ← This file
```

### Shared core module (`orphans-benchmark-core.js`)

This file has a TW module header, standard `exports`, and a UMD-style tail so it works in three contexts:

```javascript
/*\
title: orphans-benchmark-core.js
type: application/javascript
module-type: library
\*/
"use strict";

var run = function($tw, wiki) {
    // Build wiki, run old vs new, return results
    // wiki param is optional — omit for isolated wiki, pass $tw.wiki for live wiki
};

// --- Module exports (Node / TW test suite) or auto-run (browser console) ---
if(typeof module !== "undefined" && module.exports) {
    exports.run = run;
    exports.buildWiki = buildWiki;
} else if(typeof $tw !== "undefined") {
    // Browser console: add tiddlers to live wiki, then run benchmark
    run($tw, $tw.wiki);
}
```

Key points:
- `module-type: library` makes it requireable inside TW via `require("orphans-benchmark-core.js")`
- Standard `exports.run` makes it requireable via Node's `require("./orphans-benchmark-core.js")`
- Accepts `$tw` as a parameter — does NOT reference `$tw` as a global
- All benchmark config (TIDDLER_COUNT, etc.), wiki building, old/new implementations, timing logic, and correctness checking live here
- The `typeof module !== "undefined" && module.exports` check (not `typeof exports`) avoids ReferenceError when pasted into a browser console under strict mode

### `buildWiki($tw, wiki)` — dual-mode test data creation

The `buildWiki` function accepts an optional `wiki` parameter:

- **Omitted / falsy** → creates a fresh isolated `new $tw.Wiki({enableIndexers: []})`. Used by the Node test suite.
- **Provided** (e.g., `$tw.wiki`) → adds tiddlers to the existing live wiki. Used when pasted into the browser console.

Both modes produce **identical tiddlers** — same titles (e.g., `"Tiddler0"`), same content, same seeded PRNG, same percentages. No prefixes, no extra fields (tags, etc.). This ensures benchmark results are comparable across environments.

In the browser, find the tiddlers via `[prefix[Tiddler]]` or `[prefix[MissingTiddler]]` in Advanced Search.

### Jasmine wrapper (`test-orphans-benchmark.js`)

Thin wrapper for in-browser and full TW test suite:

```javascript
/*\
title: test-orphans-benchmark.js
type: application/javascript
tags: [[$:/tags/test-spec]]
\*/
"use strict";

if($tw.version.indexOf("5.4.0") === 0) {
    var benchmark = require("orphans-benchmark-core.js");

    describe("Orphan tiddler performance benchmarks", function() {
        var results = benchmark.run($tw);

        it("correctness: ...", function() {
            expect(results.correct).toBe(true);
        });

        it("performance: ...", function() {
            expect(results.newMedian).toBeLessThan(results.oldMedian);
        });
    });
}
```

Key points:
- Uses `require("orphans-benchmark-core.js")` (TW title, no `./` prefix)
- Version guard with `$tw.version.indexOf(...)` to skip on incompatible versions
- Wiki is built at `describe` scope (no `beforeAll` — not reliable in TW's browser Jasmine)
- Calls `benchmark.run($tw)` without a wiki parameter → isolated wiki, no prefix
- Jasmine `expect()` calls use the pre-computed results from the core module

### Standalone runner (`run-benchmark.js`)

Fast runner for local development — boots only TW core:

```javascript
#!/usr/bin/env node
"use strict";

var $tw = require("../../../../../boot/boot.js").TiddlyWiki();
$tw.boot.argv = [];
// Suppress boot help output
var _write = process.stdout.write;
process.stdout.write = function() { return true; };
$tw.boot.boot(function() {
    process.stdout.write = _write;
    var benchmark = require("./orphans-benchmark-core.js");
    var results = benchmark.run($tw);
    process.exit(results.correct ? 0 : 1);
});
```

Key points:
- Uses `require("./orphans-benchmark-core.js")` (filesystem path, with `./` prefix)
- Boots with empty `$tw.boot.argv = []` — no editions, no plugins, no Jasmine
- Suppresses TW's boot help output by temporarily replacing `process.stdout.write`
- Calls `benchmark.run($tw)` without a wiki parameter → isolated wiki, no prefix
- Exits with code 0/1 for CI integration

### Browser console usage

Paste the entire contents of `orphans-benchmark-core.js` into the browser console of a running TiddlyWiki. The UMD tail detects that `module` is undefined and `$tw` exists, and auto-runs `run($tw, $tw.wiki)`. This:

1. Adds 10,000 tiddlers (`Tiddler0` through `Tiddler9999`) to the live wiki
2. Runs the old vs new benchmark against the live wiki (which now includes both real and test tiddlers)
3. Logs results to the console

The tiddlers persist in the wiki — they are **not** cleaned up. You can browse them, test UI responses (e.g., the Orphans tab in $:/ControlPanel), and use filters like `[prefix[Tiddler]]`.

### Running benchmarks

```bash
# Fast standalone (Windows-friendly, ~2-3 seconds)
node editions/test/tiddlers/tests/benchmarks/run-benchmark.js

# Full Jasmine suite with spec filter (~45 seconds)
node tiddlywiki.js editions/test --verbose --test spec="Orphan"

# Full Jasmine suite (all tests)
node tiddlywiki.js editions/test --verbose --test

# Browser console (paste entire orphans-benchmark-core.js contents)
```

### Adding a new benchmark

To add a new benchmark (e.g., for `getMissingTitles`):

1. Add the old/new implementations and benchmark logic to the core module's `run()` function (or create a new core module like `missing-benchmark-core.js`)
2. Add corresponding `expect()` checks in the Jasmine wrapper
3. The standalone runner picks it up automatically since it calls the same `run()`

---

## 3. How to Write TiddlyWiki Benchmarks

### Key TiddlyWiki APIs for tests

```javascript
// Create an isolated wiki instance (used by Node test suite / buildWiki without wiki param)
var wiki = new $tw.Wiki({enableIndexers: []});
wiki.addIndexersToWiki();

// Or use the live wiki (used by browser console / buildWiki with wiki param)
var wiki = $tw.wiki;

// Add tiddlers — plain objects work for isolated wikis
wiki.addTiddler({ title: "MyTiddler", text: "Content with [[Link]]" });
// For live wikis, wrap in new $tw.Tiddler() to trigger change events properly
wiki.addTiddler(new $tw.Tiddler({ title: "MyTiddler", text: "Content with [[Link]]" }));

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

### Version-conditional tests

Use `$tw.version` (a string like `"5.4.0-prerelease"`) to gate tests:

```javascript
// Run only on v5.5.0 and v5.5.0-prerelease
if($tw.version.indexOf("5.5.0") === 0) {
    describe("my tests", function() { ... });
}

// Or for "5.5.0 and above" use TW's version comparator:
var isV550 = $tw.utils.compareVersions($tw.version, "5.5.0") >= 0;
```

### TW module `require()` differences

- **Inside TW context** (Jasmine tests, browser): `require("my-module.js")` resolves by the `title` field in the TW module header
- **Standalone Node.js**: `require("./my-module.js")` resolves by filesystem path
- A module can work in both contexts by having both a TW header (`title`, `module-type: library`) and standard Node.js `exports`

### Critical gotchas learned

1. **No `beforeAll` in browser Jasmine** — TW's in-browser Jasmine doesn't reliably support `beforeAll`. Initialize the wiki directly at `describe` scope. This works in both Node and browser.

2. **Timer resolution in browsers** — Browser `performance.now()` may have only 1ms resolution (integer values). For fast functions (~5-10ms), individual timings round to the same value, making comparisons meaningless. **Solution:** Batch multiple iterations per timed sample:
   ```javascript
   var ITERATIONS_PER_SAMPLE = 10;
   var start = now();
   for(i = 0; i < ITERATIONS_PER_SAMPLE; i++) { result = fn(); }
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

6. **Selectively checking out files** — If the benchmark files live on a different branch, you can selectively pull them: `git checkout <branch> -- editions/test/tiddlers/tests/benchmarks/`

7. **Keep test tiddlers identical across environments** — When adding test tiddlers to a live wiki (browser console mode), do not add tags, prefixes, extra fields, or any data that the isolated wiki mode doesn't add. Any difference changes test conditions (e.g., tags affect link parsing, prefixes change titles), making results non-comparable. Both modes must produce the exact same tiddlers.

8. **UMD detection: use `typeof module` not `typeof exports`** — In strict mode, referencing an undeclared variable like `exports` throws a ReferenceError in the browser console. Use `typeof module !== "undefined" && module.exports` instead, which is safe in all environments.

---

## 4. Synthetic Test Data Design

For 10,000 tiddlers:
- **10% linking** (1,000 tiddlers) — contain `[[Target]]` wikitext links, 1-5 links each
- **20% no links** (2,000 tiddlers) — plain text, no links at all
- **70% remaining** — plain text, no links (these plus the 20% form the bulk)
- **10% missing targets** (1,000 titles) — link targets that have no corresponding tiddler (e.g., "MissingTiddler0" through "MissingTiddler999")

This produces ~7,600 orphan tiddlers and ~259 missing tiddlers, which is a realistic distribution.

Use Fisher-Yates shuffle with seeded PRNG to randomly assign which tiddlers get links vs no links.

---

## 5. Observed Results

| Function | Old (ms) | New (ms) | Speedup |
|---|---|---|---|
| `getOrphanTitles` | ~48-209 | ~11-13 | **4-19x faster** |
| `getMissingTitles` | ~7-8 | ~6-7 | ~1.2-1.4x faster |

The `getOrphanTitles` speedup is dramatic because `indexOf`+`splice` on a 10,000-element array is expensive. The `getMissingTitles` speedup is modest because the missing array stays small (~259 elements). Speedup varies by environment (Node vs browser, Windows vs Linux).

---

## 6. File Locations

- **Optimized source:** `core/modules/wiki.js` — `getOrphanTitles` (~line 656), `getMissingTitles` (~line 641)
- **Benchmark core:** `editions/test/tiddlers/tests/benchmarks/orphans-benchmark-core.js` — shared logic
- **Jasmine wrapper:** `editions/test/tiddlers/tests/benchmarks/test-orphans-benchmark.js` — browser + full TW
- **Standalone runner:** `editions/test/tiddlers/tests/benchmarks/run-benchmark.js` — fast local testing
- **TW test runner:** `plugins/tiddlywiki/jasmine/jasmine-plugin.js` (filter on line 13)
- **TW boot:** `boot/boot.js` — `$tw.Wiki` constructor, `addTiddler`, etc.
- **Link extraction:** `core/modules/wiki.js` — `extractLinks` (~line 501), `getTiddlerLinks` (~line 525)
- **Test command:** `plugins/tiddlywiki/jasmine/command.js` — supports `spec=` filter parameter
