/*\
title: test-finddraft-benchmark.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Performance benchmark for findDraft optimization.
Delegates to finddraft-benchmark-core.js for the actual benchmark logic.

\*/
"use strict";

// only run for v5.5.0 and v5.5.0-prerelease
// TODO: Adjust the version check! Currently for the draft it is v5.4.0-pre..

if($tw.version.indexOf("5.4.0") === 0) {

	var benchmark = require("finddraft-benchmark-core.js");

	describe("findDraft performance benchmarks", function() {

		var results = benchmark.run($tw);

		it("correctness: new implementation should return the same results as old", function() {
			expect(results.correct).toBe(true);
			console.log("  findDraft: " + results.draftCount + " drafts found out of " + results.tiddlerCount + " tiddlers");
		});

		it("performance: new implementation should be faster than old", function() {
			expect(results.newMedian).toBeLessThan(results.oldMedian);
			console.log("  Speedup: " + results.speedup.toFixed(2) + "x faster");
		});
	});
}
