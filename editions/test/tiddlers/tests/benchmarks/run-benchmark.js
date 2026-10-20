/*
Standalone benchmark runner for TiddlyWiki performance tests.
Boots TW core minimally and runs benchmarks directly — much faster
than the full Jasmine test suite on Windows.

Usage:
  node editions/test/tiddlers/tests/benchmarks/run-benchmark.js
*/

"use strict";

// Boot TiddlyWiki with just the core (no editions, no plugins, no Jasmine)
var $tw = require("../../../../../boot/boot.js").TiddlyWiki();
$tw.boot.argv = [];
// Suppress boot help/info output, restore before running benchmarks
var _write = process.stdout.write;
process.stdout.write = function() { return true; };
$tw.boot.boot(function() {
	process.stdout.write = _write;

	console.log("TiddlyWiki " + $tw.version + " — Standalone Benchmark Runner\n");

	var benchmark = require("./orphans-benchmark-core.js");
	var results = benchmark.run($tw);

	console.log("\nCorrectness: " + (results.correct ? "PASS" : "FAIL"));
	if(!results.correct) {
		console.error("ERROR: Old and new implementations return different results!");
		process.exit(1);
	}
	process.exit(0);
});
