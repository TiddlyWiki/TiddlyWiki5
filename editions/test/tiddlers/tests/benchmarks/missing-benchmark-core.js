/*\
title: missing-benchmark-core.js
type: application/javascript
module-type: library

Shared benchmark code for getMissingTitles optimization.
Used by both the Jasmine test (test-missing-benchmark.js) and
the standalone runner (run-benchmark.js).

Usage:
  var benchmark = require("missing-benchmark-core.js");
  var results = benchmark.run($tw);

\*/
"use strict";

var now = (typeof performance !== "undefined" && typeof performance.now === "function")
	? performance.now.bind(performance)
	: function() {
		var hr = process.hrtime();
		return hr[0] * 1000 + hr[1] / 1e6;
	};

var TIDDLER_COUNT = 10000;
var LINK_PERCENTAGE = 0.10;       // 10% of tiddlers link to other tiddlers
var NO_LINK_PERCENTAGE = 0.20;    // 20% of tiddlers have no links at all
var MISSING_LINK_PERCENTAGE = 0.10; // 10% of link targets are non-existent tiddlers
var LINKS_PER_TIDDLER_MIN = 1;
var LINKS_PER_TIDDLER_MAX = 5;
var WARMUP_RUNS = 2;
var BENCHMARK_RUNS = 5;
// Run multiple iterations per timed sample to overcome low-resolution browser timers
var ITERATIONS_PER_SAMPLE = 10;

// Seeded PRNG for reproducible benchmarks
function mulberry32(seed) {
	return function() {
		seed |= 0; seed = seed + 0x6D2B79F5 | 0;
		var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
		t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
		return ((t ^ t >>> 14) >>> 0) / 4294967296;
	};
}

// Old implementation for comparison (forEachTiddler + indexOf dedup)
function getMissingTitlesOld(wiki, $tw) {
	var self = wiki,
		missing = [];
	wiki.forEachTiddler(function(title, tiddler) {
		var links = self.getTiddlerLinks(title);
		$tw.utils.each(links, function(link) {
			if((!self.tiddlerExists(link) && !self.isShadowTiddler(link)) && missing.indexOf(link) === -1) {
				missing.push(link);
			}
		});
	});
	return missing;
}

// New optimized implementation (each + hashmap dedup)
function getMissingTitlesNew(wiki, $tw) {
	var self = wiki,
		missing = Object.create(null);
	wiki.each(function(tiddler, title) {
		var links = self.getTiddlerLinks(title);
		$tw.utils.each(links, function(link) {
			if(!self.tiddlerExists(link) && !self.isShadowTiddler(link)) {
				missing[link] = true;
			}
		});
	});
	return Object.keys(missing);
}

function buildWiki($tw) {
	var random = mulberry32(42);
	var wiki = new $tw.Wiki({enableIndexers: []});
	wiki.addIndexersToWiki();
	var allTitles = [];
	var missingTitles = [];
	var t;
	for(t = 0; t < TIDDLER_COUNT; t++) {
		allTitles.push("Tiddler" + t);
	}
	var missingCount = Math.floor(TIDDLER_COUNT * MISSING_LINK_PERCENTAGE);
	for(t = 0; t < missingCount; t++) {
		missingTitles.push("MissingTiddler" + t);
	}
	var allTargets = allTitles.concat(missingTitles);
	var noLinkCount = Math.floor(TIDDLER_COUNT * NO_LINK_PERCENTAGE);
	var linkingCount = Math.floor(TIDDLER_COUNT * LINK_PERCENTAGE);
	var indices = [];
	for(t = 0; t < TIDDLER_COUNT; t++) {
		indices.push(t);
	}
	for(t = indices.length - 1; t > 0; t--) {
		var j = Math.floor(random() * (t + 1));
		var temp = indices[t];
		indices[t] = indices[j];
		indices[j] = temp;
	}
	var noLinkSet = Object.create(null);
	for(t = 0; t < noLinkCount; t++) {
		noLinkSet[indices[t]] = true;
	}
	var linkingSet = Object.create(null);
	for(t = noLinkCount; t < noLinkCount + linkingCount; t++) {
		linkingSet[indices[t]] = true;
	}
	for(t = 0; t < TIDDLER_COUNT; t++) {
		var text;
		if(noLinkSet[t]) {
			text = "This is tiddler " + t + " with no links.";
		} else if(linkingSet[t]) {
			var numLinks = LINKS_PER_TIDDLER_MIN + Math.floor(random() * (LINKS_PER_TIDDLER_MAX - LINKS_PER_TIDDLER_MIN + 1));
			var links = [];
			for(var l = 0; l < numLinks; l++) {
				var targetIdx = Math.floor(random() * allTargets.length);
				links.push("[[" + allTargets[targetIdx] + "]]");
			}
			text = "Tiddler " + t + " links to " + links.join(" and ");
		} else {
			text = "Content of tiddler " + t + ".";
		}
		wiki.addTiddler({
			title: allTitles[t],
			text: text
		});
	}
	return { wiki: wiki, allTitles: allTitles, missingTitles: missingTitles };
}

function benchmarkFn(fn, label) {
	var r, i;
	for(r = 0; r < WARMUP_RUNS; r++) {
		fn();
	}
	var times = [];
	var result;
	for(r = 0; r < BENCHMARK_RUNS; r++) {
		var start = now();
		for(i = 0; i < ITERATIONS_PER_SAMPLE; i++) {
			result = fn();
		}
		var end = now();
		times.push((end - start) / ITERATIONS_PER_SAMPLE);
	}
	times.sort(function(a, b) { return a - b; });
	var median = times[Math.floor(times.length / 2)];
	var avg = times.reduce(function(s, v) { return s + v; }, 0) / times.length;
	var min = times[0];
	var max = times[times.length - 1];
	console.log("  " + label + ": median=" + median.toFixed(2) + "ms, avg=" + avg.toFixed(2) + "ms, min=" + min.toFixed(2) + "ms, max=" + max.toFixed(2) + "ms");
	return { result: result, median: median, avg: avg, min: min, max: max };
}

/*
Run all benchmarks. Returns an object with results for use by callers.
  $tw - the TiddlyWiki instance (must be booted)
*/
exports.run = function($tw) {
	console.log("\nBuilding wiki with " + TIDDLER_COUNT + " tiddlers...");
	var buildStart = now();
	var data = buildWiki($tw);
	var wiki = data.wiki;
	var buildElapsed = now() - buildStart;
	console.log("Wiki built in " + buildElapsed.toFixed(0) + "ms");
	console.log("  " + TIDDLER_COUNT + " tiddlers, " +
		Math.floor(TIDDLER_COUNT * LINK_PERCENTAGE) + " linking, " +
		Math.floor(TIDDLER_COUNT * NO_LINK_PERCENTAGE) + " with no links, " +
		data.missingTitles.length + " missing targets");

	// Correctness
	var oldResult = getMissingTitlesOld(wiki, $tw);
	var newResult = getMissingTitlesNew(wiki, $tw);
	var oldSorted = oldResult.slice().sort();
	var newSorted = newResult.slice().sort();
	var correct = JSON.stringify(oldSorted) === JSON.stringify(newSorted);

	// Performance
	console.log("\n  getMissingTitles benchmark (" + BENCHMARK_RUNS + " runs, " + WARMUP_RUNS + " warmup, " + ITERATIONS_PER_SAMPLE + " iter/sample):");
	var oldBench = benchmarkFn(function() { return getMissingTitlesOld(wiki, $tw); }, "OLD (forEachTiddler + indexOf)");
	var newBench = benchmarkFn(function() { return getMissingTitlesNew(wiki, $tw); }, "NEW (each + hashmap)          ");
	var speedup = oldBench.median / newBench.median;
	console.log("  Speedup: " + speedup.toFixed(2) + "x faster");

	return {
		correct: correct,
		missingCount: oldResult.length,
		tiddlerCount: TIDDLER_COUNT,
		oldMedian: oldBench.median,
		newMedian: newBench.median,
		speedup: speedup
	};
};
