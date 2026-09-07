/*\
title: Run Benchmark on Windows - small wrapper - much faster
type: text/plain

Standalone benchmark runner. Boots TiddlyWiki minimally and runs all
*-benchmark-core.js files found in this directory.

Usage:
  node editions/test/tiddlers/tests/benchmarks/run-benchmark.js

\*/
"use strict";

var path = require("path");
var fs = require("fs");

// Boot TiddlyWiki
var twRoot = path.resolve(__dirname, "../../../../..");
var $tw = require(path.join(twRoot, "boot/boot.js")).TiddlyWiki();
$tw.boot.argv = [path.join(twRoot, "editions/test")];
$tw.boot.boot();

// Auto-detect all *-benchmark-core.js files
var benchmarkDir = __dirname;
var coreFiles = fs.readdirSync(benchmarkDir).filter(function(f) {
	return f.match(/-benchmark-core\.js$/);
});

console.log("Found " + coreFiles.length + " benchmark(s): " + coreFiles.join(", "));

var allPassed = true;
coreFiles.forEach(function(coreFile) {
	console.log("\n=== Running: " + coreFile + " ===");
	var benchmark = require(path.join(benchmarkDir, coreFile));
	var results = benchmark.run($tw);
	if(!results.correct) {
		console.log("FAIL: Correctness check failed for " + coreFile);
		allPassed = false;
	}
});

console.log("\n" + (allPassed ? "ALL BENCHMARKS PASSED" : "SOME BENCHMARKS FAILED"));
process.exit(allPassed ? 0 : 1);
