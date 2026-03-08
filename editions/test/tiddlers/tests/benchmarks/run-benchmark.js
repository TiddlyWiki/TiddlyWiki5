#!/usr/bin/env node

/*
Standalone benchmark runner for TiddlyWiki performance tests.
Boots TW core minimally and runs benchmarks directly — much faster
than the full Jasmine test suite on Windows.

Automatically discovers and runs all *-benchmark-core.js files in
the same directory. Missing core files (from other branches) are
skipped gracefully.

Usage:
  node editions/test/tiddlers/tests/benchmarks/run-benchmark.js
*/

"use strict";

var path = require("path");
var fs = require("fs");

// Boot TiddlyWiki with just the core (no editions, no plugins, no Jasmine)
var $tw = require("../../../../../boot/boot.js").TiddlyWiki();
$tw.boot.argv = [];
// Suppress boot help/info output, restore before running benchmarks
var _write = process.stdout.write;
process.stdout.write = function() { return true; };
$tw.boot.boot(function() {
	process.stdout.write = _write;

	console.log("TiddlyWiki " + $tw.version + " — Standalone Benchmark Runner\n");

	// Discover all *-benchmark-core.js files in this directory
	var benchmarkDir = __dirname;
	var files = fs.readdirSync(benchmarkDir);
	var coreFiles = files.filter(function(f) {
		return f.match(/-benchmark-core\.js$/);
	}).sort();

	if(coreFiles.length === 0) {
		console.log("No benchmark core files found in " + benchmarkDir);
		process.exit(0);
	}

	var allPassed = true;
	var ranCount = 0;

	coreFiles.forEach(function(coreFile) {
		var fullPath = path.join(benchmarkDir, coreFile);
		console.log("\n" + "=".repeat(60));
		console.log("Running: " + coreFile);
		console.log("=".repeat(60));

		try {
			var benchmark = require(fullPath);
			var results = benchmark.run($tw);
			ranCount++;

			// Check correctness — handle both flat and nested result formats
			var correct = checkCorrectness(results);
			console.log("\nCorrectness: " + (correct ? "PASS" : "FAIL"));
			if(!correct) {
				console.error("ERROR: Old and new implementations return different results!");
				allPassed = false;
			}
		} catch(e) {
			console.error("ERROR running " + coreFile + ": " + e.message);
			allPassed = false;
		}
	});

	console.log("\n" + "=".repeat(60));
	console.log("Ran " + ranCount + "/" + coreFiles.length + " benchmark(s)");
	console.log("=".repeat(60));

	process.exit(allPassed ? 0 : 1);
});

// Check correctness for both flat results (e.g. {correct: true})
// and nested results (e.g. {extractLinks: {correct: true}, backlinks: {correct: true}})
function checkCorrectness(results) {
	if(typeof results.correct === "boolean") {
		return results.correct;
	}
	var keys = Object.keys(results);
	for(var i = 0; i < keys.length; i++) {
		var sub = results[keys[i]];
		if(sub && typeof sub.correct === "boolean" && !sub.correct) {
			return false;
		}
	}
	return true;
}
