/*
Fast test runner that boots the test edition and runs selected test specs.
Skips the expensive --rendertiddler step from --build index.

Usage:
  node test-parser-quick.js [test-files...]

Examples:
  node test-parser-quick.js                                     # Run ALL specs
  node test-parser-quick.js test-wikitext-parser                # Run one spec file
  node test-parser-quick.js test-wikitext-parser test-filters   # Run multiple spec files
*/

"use strict";

var $tw = require("../../boot/boot.js").TiddlyWiki();

$tw.boot.argv = ["editions/test"];

// Disable startup modules that aren't needed for tests
$tw.boot.disabledStartupModules = [
	"favicon", "password", "browser-messaging", "info",
	"render", "rootwidget", "story", "windows"
];

$tw.boot.boot(function() {
	var args = process.argv.slice(2);
	var allTests = $tw.wiki.filterTiddlers("[all[tiddlers+shadows]type[application/javascript]tag[$:/tags/test-spec]]");

	// Filter test tiddlers if arguments provided
	var testsToRun;
	if(args.length > 0) {
		testsToRun = allTests.filter(function(title) {
			return args.some(function(arg) {
				return title.toLowerCase().indexOf(arg.toLowerCase()) !== -1;
			});
		});
		if(testsToRun.length === 0) {
			console.error("No test files matched: " + args.join(", "));
			console.error("Available test files:");
			allTests.forEach(function(t) { console.error("  " + t); });
			process.exit(1);
		}
	} else {
		testsToRun = allTests;
	}

	// Override the test filter to only include our selected tests
	var titlesSet = Object.create(null);
	testsToRun.forEach(function(t) { titlesSet[t] = true; });

	var origFilterTiddlers = $tw.wiki.filterTiddlers.bind($tw.wiki);
	$tw.wiki.filterTiddlers = function(filterString) {
		var result = origFilterTiddlers.apply(null, arguments);
		if(filterString.indexOf("$:/tags/test-spec") !== -1) {
			return result.filter(function(t) { return titlesSet[t]; });
		}
		return result;
	};

	console.log("Running " + testsToRun.length + " of " + allTests.length + " test files");

	// Use the jasmine plugin's own runTests function
	var jasmine = $tw.modules.execute("$:/plugins/tiddlywiki/jasmine/jasmine-plugin.js");
	jasmine.runTests(function(err) {
		if(err) {
			console.error(err);
			process.exit(1);
		}
	});
});
