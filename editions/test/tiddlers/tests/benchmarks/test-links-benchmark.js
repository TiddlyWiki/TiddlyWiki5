/*\
title: test-links-benchmark.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Performance benchmark for getTiddlerBacklinks optimization.
Delegates to links-benchmark-core.js for the actual benchmark logic.

\*/
"use strict";

// TODO: Adjust the version check for the target release
if($tw.version.indexOf("5.4.0") === 0) {

	var benchmark = require("links-benchmark-core.js");

	describe("Backlink performance benchmarks", function() {

		var results = benchmark.run($tw);

		it("correctness: getTiddlerBacklinks new implementation should return the same results as old", function() {
			expect(results.correct).toBe(true);
			console.log("  getTiddlerBacklinks: " + results.targetCount + " target titles tested");
		});

		it("performance: getTiddlerBacklinks new implementation should be faster than old", function() {
			expect(results.newMedian).toBeLessThan(results.oldMedian);
			console.log("  Speedup: " + results.speedup.toFixed(2) + "x faster");
		});
	});
}
