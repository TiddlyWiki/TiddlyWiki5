# Performance benchmarks (archived measurement code)

This folder holds performance/measurement specs: code written to quantify a change for a pull request, kept afterwards for reference rather than deleted. They are NOT regression guards. The behavioural guard for a change lives in a normal spec under `tests/` (for the tag-indexer fix that is `test-tag-indexer.js`).

## Conventions

- One benchmark per file, tagged `$:/tags/test-spec` like any spec, so it is discovered by the normal test runner.
- Each file gates its own specs at the top of the `describe`, skipping for two independent reasons: a CI/CD build, or an archived version:

```js
var ARCHIVED_FROM = "5.5.0";
var env = (typeof process !== "undefined" && process.env) || {};
var skipReason = null;
if(env.CI || env.NETLIFY || env.TW_SKIP_PERF_TESTS) {
	skipReason = "skipped in CI/CD";
} else if($tw.utils.checkVersions($tw.version,ARCHIVED_FROM)) {
	skipReason = "archived from v" + ARCHIVED_FROM;
}
if(skipReason) {
	it("benchmark not run here (" + skipReason + ")",function() {
		pending(skipReason + "; running core is v" + $tw.version);
	});
	return;
}
```

### CI/CD skip

Benchmark timings are meaningless on shared CI runners, so benchmarks skip themselves there. Netlify and GitHub Actions both export `CI=true` (Netlify also sets `NETLIFY=true`), so this needs **no configuration** on the CI side. To skip benchmarks in any other environment, set `TW_SKIP_PERF_TESTS=1`.

### Version archive

`$tw.utils.checkVersions(a,b)` is true when `a >= b` (patch/prerelease suffixes are ignored for the comparison). So a benchmark gated at `5.5.0` runs for every `5.4.x` patch release and disables itself the moment the core minor version is bumped to `5.5.0`.

In every skipped case the file leaves a single pending spec as a marker; the expensive measurement code is never executed.

## Running

Benchmarks run as part of the test edition (and skip in CI/CD):

```sh
npm test
```
