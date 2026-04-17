/*\
title: links-benchmark-core.js
type: application/javascript
module-type: library

Shared benchmark code for getTiddlerBacklinks optimization.
Used by both the Jasmine test (test-links-benchmark.js) and
the standalone runner (run-benchmark.js).

Usage:
  var benchmark = require("links-benchmark-core.js");
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
// Target minimum measurable duration in ms — samples shorter than this
// are unreliable on coarsened browser timers
var MIN_SAMPLE_MS = 5;

// Detect timer resolution and choose iterations per sample accordingly.
// Browsers reduce performance.now() precision (often to 100us or 1ms) for
// Spectre mitigation unless cross-origin isolated. On Node / high-res
// environments we can use fewer iterations and save CI time.
function detectIterationsPerSample() {
	var deltas = [];
	var prev = now();
	// Collect non-zero deltas to estimate resolution
	while(deltas.length < 10) {
		var current = now();
		var d = current - prev;
		if(d > 0) {
			deltas.push(d);
			prev = current;
		}
	}
	deltas.sort(function(a, b) { return a - b; });
	var resolution = deltas[0];
	// If resolution is fine-grained (< 0.1ms), a single iteration is enough.
	// For coarser timers, use enough iterations so that each sample spans
	// well above the resolution floor.
	if(resolution < 0.1) {
		return 1;
	}
	var estimate = Math.ceil(MIN_SAMPLE_MS / resolution);
	return Math.max(1, Math.min(estimate, 50));
}

// Seeded PRNG for reproducible benchmarks
function mulberry32(seed) {
	return function() {
		seed |= 0; seed = seed + 0x6D2B79F5 | 0;
		var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
		t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
		return ((t ^ t >>> 14) >>> 0) / 4294967296;
	};
}

// Old getTiddlerBacklinks: uses forEachTiddler (sorts + filters system tiddlers)
function getTiddlerBacklinksOld(wiki, targetTitle) {
	var backlinks = [];
	wiki.forEachTiddler(function(title, tiddler) {
		var links = wiki.getTiddlerLinks(title);
		if(links.indexOf(targetTitle) !== -1) {
			backlinks.push(title);
		}
	});
	return backlinks;
}

// New getTiddlerBacklinks: uses each() (no sort, includes all tiddlers)
function getTiddlerBacklinksNew(wiki, targetTitle) {
	var backlinks = [];
	wiki.each(function(_tiddler, title) {
		var links = wiki.getTiddlerLinks(title);
		if(links.indexOf(targetTitle) !== -1) {
			backlinks.push(title);
		}
	});
	return backlinks;
}

/*
Build test tiddlers and add them to a wiki.
  $tw   - the TiddlyWiki instance (must be booted)
  wiki  - (optional) wiki to add tiddlers to. If omitted a fresh
          isolated wiki is created (used by the Node test suite).
          Identical tiddlers are produced in both modes.
*/
function buildWiki($tw, wiki) {
	var random = mulberry32(42);
	if(!wiki) {
		wiki = new $tw.Wiki({enableIndexers: []});
		wiki.addIndexersToWiki();
	}
	var allTitles = [];
	var missingTitles = [];
	var linkingTiddlers = [];
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
			linkingTiddlers.push(allTitles[t]);
		} else {
			text = "Content of tiddler " + t + ".";
		}
		wiki.addTiddler({
			title: allTitles[t],
			text: text
		});
	}
	return { wiki: wiki, allTitles: allTitles, missingTitles: missingTitles, linkingTiddlers: linkingTiddlers };
}

function benchmarkFn(fn, label, iterationsPerSample) {
	var r, i;
	for(r = 0; r < WARMUP_RUNS; r++) {
		fn();
	}
	var times = [];
	var result;
	for(r = 0; r < BENCHMARK_RUNS; r++) {
		var start = now();
		for(i = 0; i < iterationsPerSample; i++) {
			result = fn();
		}
		var end = now();
		times.push((end - start) / iterationsPerSample);
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
  $tw   - the TiddlyWiki instance (must be booted)
  wiki  - (optional) existing wiki to add tiddlers to
*/
function run($tw, wiki) {
	console.log("\nBuilding wiki with " + TIDDLER_COUNT + " tiddlers...");
	var buildStart = now();
	var data = buildWiki($tw, wiki);
	var benchWiki = data.wiki;
	var buildElapsed = now() - buildStart;
	console.log("Wiki built in " + buildElapsed.toFixed(0) + "ms");
	console.log("  " + TIDDLER_COUNT + " tiddlers, " +
		Math.floor(TIDDLER_COUNT * LINK_PERCENTAGE) + " linking, " +
		Math.floor(TIDDLER_COUNT * NO_LINK_PERCENTAGE) + " with no links, " +
		data.missingTitles.length + " missing targets");

	// Pick a subset of target titles that have backlinks for meaningful testing
	var backlinkTargets = [];
	for(var b = 0; b < data.linkingTiddlers.length && backlinkTargets.length < 20; b++) {
		var links = benchWiki.getTiddlerLinks(data.linkingTiddlers[b]);
		for(var lb = 0; lb < links.length && backlinkTargets.length < 20; lb++) {
			if(benchWiki.tiddlerExists(links[lb])) {
				backlinkTargets.push(links[lb]);
			}
		}
	}
	console.log("  " + backlinkTargets.length + " target titles for backlinks benchmark");

	// getTiddlerBacklinks correctness
	var backlinksCorrect = true;
	for(var bc = 0; bc < backlinkTargets.length; bc++) {
		var oldBacklinks = getTiddlerBacklinksOld(benchWiki, backlinkTargets[bc]).slice().sort();
		var newBacklinks = getTiddlerBacklinksNew(benchWiki, backlinkTargets[bc]).slice().sort();
		if(JSON.stringify(oldBacklinks) !== JSON.stringify(newBacklinks)) {
			// The new version uses each() which includes system tiddlers,
			// while the old uses forEachTiddler which excludes them.
			// In our test wiki there are no system tiddlers, so results should match.
			backlinksCorrect = false;
			break;
		}
	}

	// getTiddlerBacklinks performance
	var iterationsPerSample = detectIterationsPerSample();
	console.log("\n  getTiddlerBacklinks benchmark (" + BENCHMARK_RUNS + " runs, " + WARMUP_RUNS + " warmup, " + iterationsPerSample + " iter/sample):");
	var backlinksOldBench = benchmarkFn(function() {
		var results = [];
		for(var i = 0; i < backlinkTargets.length; i++) {
			results.push(getTiddlerBacklinksOld(benchWiki, backlinkTargets[i]));
		}
		return results;
	}, "OLD (forEachTiddler)  ", iterationsPerSample);
	var backlinksNewBench = benchmarkFn(function() {
		var results = [];
		for(var i = 0; i < backlinkTargets.length; i++) {
			results.push(getTiddlerBacklinksNew(benchWiki, backlinkTargets[i]));
		}
		return results;
	}, "NEW (each)            ", iterationsPerSample);
	var backlinksSpeedup = backlinksOldBench.median / backlinksNewBench.median;
	console.log("  Speedup: " + backlinksSpeedup.toFixed(2) + "x faster");

	return {
		correct: backlinksCorrect,
		targetCount: backlinkTargets.length,
		oldMedian: backlinksOldBench.median,
		newMedian: backlinksNewBench.median,
		speedup: backlinksSpeedup
	};
}

// Export for Node/TiddlyWiki module system, auto-run for browser console
if(typeof exports !== "undefined") {
	exports.run = run;
} else {
	run($tw, $tw.wiki);
}
