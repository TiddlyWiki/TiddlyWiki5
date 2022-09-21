/*\
title: $:/plugins/tiddlywiki/jasmine/startup.js
type: application/javascript
module-type: startup

The main module of the Jasmine test plugin for TiddlyWiki5

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: true */
"use strict";

var jasmine = require("./jasmine-plugin.js");

exports.name = "jasmine";

if($tw.browser) {
	// Jasmine is run automatically on the browser, so always add it here.
	exports.startup = jasmine.runTests;
} else {
	// However, if we're on node.js, the tests are explciitly run with the
	// --test command. This didn't used to be the case, so if they're
	// not, we'll issue a small notice to cue users in to the change
	// BTW, this notice probably won't be needed forever. It was installed
	// Sept 2022. If it's been four years, this notice can probably come out.
	exports.startup = function() {
		if(!jasmine.testsWereRun()) {
			process.stdout.write("Jasmine: no \"--test\" command given, so skipping tests\n");
		}
	}
	// We make this check after the commands are run.
	exports.after = ["commands"];
}

})();
