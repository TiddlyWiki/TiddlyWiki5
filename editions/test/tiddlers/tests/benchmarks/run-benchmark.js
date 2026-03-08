#!/usr/bin/env node

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

	// Auto-detect and run all *-benchmark-core.js files in this directory
	var path = require("path");
	var fs = require("fs");
	var dir = __dirname;
	var coreFiles = fs.readdirSync(dir).filter(function(f) {
		return f.match(/-benchmark-core\.js$/);
	}).sort();

	var allPassed = true;
	coreFiles.forEach(function(file) {
		console.log("Running: " + file);
		var benchmark = require(path.join(dir, file));
		var results = benchmark.run($tw);
		var passed = results.correct;
		console.log("Correctness: " + (passed ? "PASS" : "FAIL") + "\n");
		if(!passed) {
			console.error("ERROR: Old and new implementations return different results!");
			allPassed = false;
		}
	});

	process.exit(allPassed ? 0 : 1);
});
