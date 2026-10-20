/*\
title: finddraft-benchmark-core.js
type: application/javascript
module-type: library

Shared benchmark code for findDraft optimization.
Used by both the Jasmine test (test-finddraft-benchmark.js) and
the standalone runner (run-benchmark.js).

Usage:
  var benchmark = require("finddraft-benchmark-core.js");
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
var DRAFT_PERCENTAGE = 0.02;      // 2% of tiddlers are drafts
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

// Old implementation using forEachTiddler (sorts all tiddlers alphabetically)
function findDraftOld(wiki, targetTitle) {
	var draftTitle = undefined;
	wiki.forEachTiddler({includeSystem: true},function(title,tiddler) {
		if(tiddler.fields["draft.title"] && tiddler.fields["draft.of"] === targetTitle) {
			draftTitle = title;
		}
	});
	return draftTitle;
}

// New optimized implementation using each() (no sorting)
function findDraftNew(wiki, targetTitle) {
	var draftTitle = undefined;
	wiki.each(function(tiddler,title) {
		if(tiddler.fields["draft.title"] && tiddler.fields["draft.of"] === targetTitle) {
			draftTitle = title;
		}
	});
	return draftTitle;
}

function buildWiki($tw) {
	var random = mulberry32(42);
	var wiki = new $tw.Wiki({enableIndexers: []});
	wiki.addIndexersToWiki();
	var allTitles = [];
	var draftTargets = [];
	var draftTitles = [];
	var t;
	for(t = 0; t < TIDDLER_COUNT; t++) {
		allTitles.push("Tiddler" + t);
	}
	// Create some drafts
	var draftCount = Math.floor(TIDDLER_COUNT * DRAFT_PERCENTAGE);
	// Pick random tiddlers to be draft targets
	var indices = [];
	for(t = 0; t < TIDDLER_COUNT; t++) {
		indices.push(t);
	}
	// Shuffle to pick random draft targets
	for(t = indices.length - 1; t > 0; t--) {
		var j = Math.floor(random() * (t + 1));
		var temp = indices[t];
		indices[t] = indices[j];
		indices[j] = temp;
	}
	for(t = 0; t < draftCount; t++) {
		draftTargets.push(allTitles[indices[t]]);
	}
	// Add all regular tiddlers
	for(t = 0; t < TIDDLER_COUNT; t++) {
		wiki.addTiddler({
			title: allTitles[t],
			text: "Content of tiddler " + t + "."
		});
	}
	// Add draft tiddlers (these are additional tiddlers with draft.of/draft.title fields)
	for(t = 0; t < draftCount; t++) {
		var draftTitle = "Draft of '" + draftTargets[t] + "'";
		draftTitles.push(draftTitle);
		wiki.addTiddler({
			title: draftTitle,
			text: "Draft content for " + draftTargets[t],
			"draft.title": draftTargets[t],
			"draft.of": draftTargets[t]
		});
	}
	return { wiki: wiki, allTitles: allTitles, draftTargets: draftTargets, draftTitles: draftTitles };
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
	console.log("  " + TIDDLER_COUNT + " regular tiddlers, " +
		data.draftTargets.length + " drafts");

	// Correctness: check all draft targets
	var allCorrect = true;
	for(var c = 0; c < data.draftTargets.length; c++) {
		var target = data.draftTargets[c];
		var oldResult = findDraftOld(wiki, target);
		var newResult = findDraftNew(wiki, target);
		if(oldResult !== newResult) {
			allCorrect = false;
			console.log("  MISMATCH for target '" + target + "': old='" + oldResult + "', new='" + newResult + "'");
		}
	}
	// Also verify a non-draft tiddler returns undefined
	var nonDraftOld = findDraftOld(wiki, "NonExistentTiddler");
	var nonDraftNew = findDraftNew(wiki, "NonExistentTiddler");
	if(nonDraftOld !== nonDraftNew) {
		allCorrect = false;
	}

	// Performance: search for the first draft target repeatedly
	var benchTarget = data.draftTargets[0];
	console.log("\n  findDraft benchmark (" + BENCHMARK_RUNS + " runs, " + WARMUP_RUNS + " warmup, " + ITERATIONS_PER_SAMPLE + " iter/sample):");
	console.log("  Searching for draft of: '" + benchTarget + "'");
	var oldBench = benchmarkFn(function() { return findDraftOld(wiki, benchTarget); }, "OLD (forEachTiddler)");
	var newBench = benchmarkFn(function() { return findDraftNew(wiki, benchTarget); }, "NEW (each)           ");
	var speedup = oldBench.median / newBench.median;
	console.log("  Speedup: " + speedup.toFixed(2) + "x faster");

	return {
		correct: allCorrect,
		draftCount: data.draftTargets.length,
		tiddlerCount: TIDDLER_COUNT,
		oldMedian: oldBench.median,
		newMedian: newBench.median,
		speedup: speedup
	};
};
