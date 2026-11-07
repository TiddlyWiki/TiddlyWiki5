# findDraft Performance Optimization

## Summary

The `findDraft` function in `core/modules/wiki.js` searches all tiddlers to find an existing draft of a specified tiddler. It was using `forEachTiddler({includeSystem: true}, ...)` which sorts all tiddlers alphabetically (O(n log n)) before iterating — completely unnecessary for a simple search operation.

## The Change

### Before
```javascript
exports.findDraft = function(targetTitle) {
    var draftTitle = undefined;
    this.forEachTiddler({includeSystem: true},function(title,tiddler) {
        if(tiddler.fields["draft.title"] && tiddler.fields["draft.of"] === targetTitle) {
            draftTitle = title;
        }
    });
    return draftTitle;
};
```

### After
```javascript
exports.findDraft = function(targetTitle) {
    var draftTitle = undefined;
    this.each(function(tiddler,title) {
        if(tiddler.fields["draft.title"] && tiddler.fields["draft.of"] === targetTitle) {
            draftTitle = title;
        }
    });
    return draftTitle;
};
```

## Why `each()` over `forEachTiddler()`

| Aspect | `forEachTiddler()` | `each()` |
|--------|-------------------|----------|
| **Sorting** | Sorts alphabetically O(n log n) | No sorting — direct hash iteration O(n) |
| **System tiddlers** | Excluded by default; needs `{includeSystem: true}` | Includes all tiddlers by default |
| **Callback signature** | `(title, tiddler)` | `(tiddler, title)` |
| **Use case** | Display/ordered output | Internal lookups and searches |

The `forEachTiddler` call with `{includeSystem: true}` was paying the full O(n log n) sort cost just to search through every tiddler — the sort order is irrelevant when looking for a specific draft.

## Benchmark Results (10,000 tiddlers, 200 drafts)

| Implementation | Median | Avg | Min | Max |
|---------------|--------|-----|-----|-----|
| OLD (`forEachTiddler`) | 4.99ms | 5.02ms | 4.92ms | 5.19ms |
| NEW (`each()`) | 1.66ms | 1.67ms | 1.61ms | 1.80ms |
| **Speedup** | **3.01x** | | | |

The ~3x speedup comes entirely from eliminating the unnecessary alphabetical sort in `forEachTiddler`. The function logic itself is identical — just iterating and checking fields.

## Note on Early Termination

The wiki's `each()` method uses a simple `for` loop and does not support early termination (unlike `$tw.utils.each()` which uses `.every()` and supports `return false` to break). Both the old and new implementations continue iterating after finding the draft. An early-exit optimization could provide additional speedup but would require changes to the `each()` API or direct iteration over the tiddlers hash.

## Files

- **Optimization**: `core/modules/wiki.js` — `findDraft` function
- **Benchmark core**: `editions/test/tiddlers/tests/benchmarks/finddraft-benchmark-core.js`
- **Jasmine wrapper**: `editions/test/tiddlers/tests/benchmarks/test-finddraft-benchmark.js`
- **Standalone runner**: `editions/test/tiddlers/tests/benchmarks/run-benchmark.js`
