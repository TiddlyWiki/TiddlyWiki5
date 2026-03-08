/*\
title: test-orphans-benchmark.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Performance benchmark comparing old vs new getOrphanTitles implementations.
Generates 10,000 synthetic tiddlers with realistic link distributions.

\*/
"use strict";

var now = (typeof performance !== "undefined" && typeof performance.now === "function")
	? performance.now.bind(performance)
	: function() {
		var hr = process.hrtime();
		return hr[0] * 1000 + hr[1] / 1e6;
	};

// only run for v5.5.0 and v5.5.0-prerelease
// TODO: Adjust the version check! Currently for the draft it is v5.4.0-pre.. 

if($tw.version.indexOf("5.4.0") === 0) {
	describe("Orphan tiddler performance benchmarks", function() {

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

		var wiki, allTitles, missingTitles;

		// Old implementations for comparison
		function getOrphanTitlesOld() {
			var self = wiki,
				orphans = wiki.getTiddlers();
			wiki.forEachTiddler(function(title,tiddler) {
				var links = self.getTiddlerLinks(title);
				$tw.utils.each(links,function(link) {
					var p = orphans.indexOf(link);
					if(p !== -1) {
						orphans.splice(p,1);
					}
				});
			});
			return orphans;
		}

		// New optimized implementation
		function getOrphanTitlesNew() {
			var self = wiki,
				linkedTitles = Object.create(null);
			wiki.forEachTiddler(function(title,tiddler) {
				var links = self.getTiddlerLinks(title);
				$tw.utils.each(links,function(link) {
					linkedTitles[link] = true;
				});
			});
			var orphans = [];
			wiki.forEachTiddler(function(title,tiddler) {
				if(!linkedTitles[title]) {
					orphans.push(title);
				}
			});
			return orphans;
		}

		function buildWiki() {
			var random = mulberry32(42);
			wiki = new $tw.Wiki({enableIndexers: []});
			wiki.addIndexersToWiki();
			allTitles = [];
			missingTitles = [];
			// Generate tiddler titles
			var t;
			for(t = 0; t < TIDDLER_COUNT; t++) {
				allTitles.push("Tiddler" + t);
			}
			// Generate missing tiddler titles (targets that won't have actual tiddlers)
			var missingCount = Math.floor(TIDDLER_COUNT * MISSING_LINK_PERCENTAGE);
			for(t = 0; t < missingCount; t++) {
				missingTitles.push("MissingTiddler" + t);
			}
			// All possible link targets: real tiddlers + missing tiddlers
			var allTargets = allTitles.concat(missingTitles);
			// Determine which tiddlers get no links (20%)
			var noLinkCount = Math.floor(TIDDLER_COUNT * NO_LINK_PERCENTAGE);
			// Determine which tiddlers link to others (10% of the total)
			var linkingCount = Math.floor(TIDDLER_COUNT * LINK_PERCENTAGE);
			// Shuffle indices to randomly assign roles
			var indices = [];
			for(t = 0; t < TIDDLER_COUNT; t++) {
				indices.push(t);
			}
			// Fisher-Yates shuffle with seeded PRNG
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
			// Create tiddlers
			for(t = 0; t < TIDDLER_COUNT; t++) {
				var text;
				if(noLinkSet[t]) {
					// No links - just plain text
					text = "This is tiddler " + t + " with no links.";
				} else if(linkingSet[t]) {
					// This tiddler links to random targets
					var numLinks = LINKS_PER_TIDDLER_MIN + Math.floor(random() * (LINKS_PER_TIDDLER_MAX - LINKS_PER_TIDDLER_MIN + 1));
					var links = [];
					for(var l = 0; l < numLinks; l++) {
						var targetIdx = Math.floor(random() * allTargets.length);
						links.push("[[" + allTargets[targetIdx] + "]]");
					}
					text = "Tiddler " + t + " links to " + links.join(" and ");
				} else {
					// Remaining 70% - plain text, no links
					text = "Content of tiddler " + t + ".";
				}
				wiki.addTiddler({
					title: allTitles[t],
					text: text
				});
			}
		}

		function benchmarkFn(fn, label) {
			// Warmup
			var r, i;
			for(r = 0; r < WARMUP_RUNS; r++) {
				fn();
			}
			// Timed runs: batch ITERATIONS_PER_SAMPLE calls per sample
			// to overcome low-resolution browser timers
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
			times.sort(function(a,b) { return a - b; });
			var median = times[Math.floor(times.length / 2)];
			var avg = times.reduce(function(s,v) { return s + v; }, 0) / times.length;
			var min = times[0];
			var max = times[times.length - 1];
			console.log("  " + label + ": median=" + median.toFixed(2) + "ms, avg=" + avg.toFixed(2) + "ms, min=" + min.toFixed(2) + "ms, max=" + max.toFixed(2) + "ms");
			return { result: result, median: median, avg: avg, min: min, max: max };
		}

		// Build wiki at describe scope (beforeAll is not available in TW's in-browser Jasmine)
		console.log("\nBuilding wiki with " + TIDDLER_COUNT + " tiddlers...");
		var buildStart = now();
		buildWiki();
		var buildElapsed = now() - buildStart;
		console.log("Wiki built in " + buildElapsed.toFixed(0) + "ms");
		console.log("  " + TIDDLER_COUNT + " tiddlers, " +
			Math.floor(TIDDLER_COUNT * LINK_PERCENTAGE) + " linking, " +
			Math.floor(TIDDLER_COUNT * NO_LINK_PERCENTAGE) + " with no links, " +
			missingTitles.length + " missing targets");

		describe("getOrphanTitles", function() {
			var oldResult, newResult;

			it("correctness: new implementation should return the same results as old", function() {
				oldResult = getOrphanTitlesOld();
				newResult = getOrphanTitlesNew();
				// Sort both for comparison since order may differ
				var oldSorted = oldResult.slice().sort();
				var newSorted = newResult.slice().sort();
				expect(newSorted).toEqual(oldSorted);
				console.log("  getOrphanTitles: " + oldResult.length + " orphans found out of " + TIDDLER_COUNT + " tiddlers");
			});

			it("performance: new implementation should be faster than old", function() {
				console.log("\n  getOrphanTitles benchmark (" + BENCHMARK_RUNS + " runs, " + WARMUP_RUNS + " warmup):");
				var oldBench = benchmarkFn(getOrphanTitlesOld, "OLD (indexOf + splice)");
				var newBench = benchmarkFn(getOrphanTitlesNew, "NEW (hash lookup)      ");
				var speedup = oldBench.median / newBench.median;
				console.log("  Speedup: " + speedup.toFixed(2) + "x faster");
				expect(newBench.median).toBeLessThan(oldBench.median);
			});
		});

	});
}