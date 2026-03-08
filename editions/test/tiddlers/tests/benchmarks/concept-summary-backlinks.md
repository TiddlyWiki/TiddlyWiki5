# TiddlyWiki Performance Optimization — getTiddlerBacklinks

This document captures the context for the `getTiddlerBacklinks` optimization in `core/modules/wiki.js`.

---

## 1. The Optimization

### Change: Replace `forEachTiddler()` with `each()` in the backlinks fallback path

**Before:**
```javascript
exports.getTiddlerBacklinks = function(targetTitle) {
    var self = this,
        backIndexer = this.getIndexer("BackIndexer"),
        backlinks = backIndexer && backIndexer.subIndexers.link.lookup(targetTitle);
    if(!backlinks) {
        backlinks = [];
        this.forEachTiddler(function(title, tiddler) {
            var links = self.getTiddlerLinks(title);
            if(links.indexOf(targetTitle) !== -1) {
                backlinks.push(title);
            }
        });
        return backlinks;
    }
    return backlinks.slice(0);
};
```

**After:**
```javascript
exports.getTiddlerBacklinks = function(targetTitle) {
    var self = this,
        backIndexer = this.getIndexer("BackIndexer"),
        backlinks = backIndexer && backIndexer.subIndexers.link.lookup(targetTitle);
    if(!backlinks) {
        backlinks = [];
        this.each(function(_tiddler, title) {
            var links = self.getTiddlerLinks(title);
            if(links.indexOf(targetTitle) !== -1) {
                backlinks.push(title);
            }
        });
        return backlinks;
    }
    return backlinks.slice(0);
};
```

---

## 2. Why `each()` is preferred over `forEachTiddler()`

### Performance: `forEachTiddler()` sorts on every call

`forEachTiddler()` (`core/modules/wiki.js`, line ~484) calls `this.getTiddlers(options)` internally, which:

1. Collects all non-system tiddler titles
2. **Sorts them alphabetically** via `sortTiddlers()` — O(n log n)
3. Returns a new array

This sort happens on **every call** to `getTiddlerBacklinks`. For a wiki with 10,000 tiddlers, that's an expensive sort each time — completely wasted work since backlinks scanning doesn't need any particular order.

`each()` (`boot/boot.js`, line ~1284) simply iterates the internal tiddler hash directly via `getTiddlerTitles()`. No sorting, no filtering, no new array allocation.

### Correctness: `forEachTiddler()` skips system tiddlers

`forEachTiddler()` excludes system tiddlers (`$:/...` prefix) by default. This creates an inconsistency in `getTiddlerBacklinks`:

- **BackIndexer path** (when available): `backIndexer.subIndexers.link.lookup()` indexes **all** tiddlers, including system tiddlers. If `$:/MyPlugin` links to `SomeTiddler`, the BackIndexer returns it as a backlink.
- **Fallback path** (old code with `forEachTiddler`): Would **miss** backlinks from system tiddlers because they are filtered out.

Using `each()` makes the fallback path consistent with the BackIndexer — both include system tiddlers. This fixes a subtle bug where the two code paths could return different results depending on whether the BackIndexer was available.

### Summary

| Aspect | `forEachTiddler()` | `each()` |
|---|---|---|
| Sorting | Sorts alphabetically every call — O(n log n) | No sort — direct iteration |
| System tiddlers | Excluded by default | Included |
| BackIndexer consistency | Inconsistent (misses `$:/` backlinks) | Consistent |
| Callback signature | `function(title, tiddler)` | `function(tiddler, title)` |

Note the **swapped callback parameter order**: `each()` passes `(tiddler, title)` while `forEachTiddler()` passes `(title, tiddler)`.

---

## 3. Why `extractLinks` was NOT optimized

An earlier attempt replaced `indexOf` with `Object.create(null)` hash map in `extractLinks()` for O(1) deduplication. Benchmarks showed this was **slower** (~0.5x) for typical tiddlers because:

- Real tiddlers have only 1-5 links — `indexOf` on a tiny array is faster than hash map overhead
- TOC / table of contents pages use transclusions, not link nodes in the parse tree, so `extractLinks` never sees large arrays in practice
- The pathological case (tiddlers with 50+ duplicate links) doesn't occur in real wikis

The change was reverted — the optimization would never pay off in practice.

---

## 4. Benchmark Results

| Metric | Old (`forEachTiddler`) | New (`each()`) | Speedup |
|---|---|---|---|
| Median (20 targets, 10k tiddlers) | ~112ms | ~19ms | **~6x faster** |

---

## 5. File Locations

- **Optimized source:** `core/modules/wiki.js` — `getTiddlerBacklinks` (line ~543)
- **`each()` definition:** `boot/boot.js` (line ~1284)
- **`forEachTiddler()` definition:** `core/modules/wiki.js` (line ~484)
- **BackIndexer:** `core/modules/indexers/back-indexer.js` (line ~9)
- **Benchmark core:** `editions/test/tiddlers/tests/benchmarks/links-benchmark-core.js`
- **Jasmine wrapper:** `editions/test/tiddlers/tests/benchmarks/test-links-benchmark.js`
- **Standalone runner:** `editions/test/tiddlers/tests/benchmarks/run-benchmark.js`
