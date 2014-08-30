/*\
title: $:/plugins/tiddlywiki/jasmine/jasmine-plugin.js
type: application/javascript
module-type: startup

The main module of the Jasmine test plugin for TiddlyWiki5

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var TEST_TIDDLER_FILTER = "[type[application/javascript]tag[$:/tags/test-spec]]";

/*
Startup function for running tests
*/
exports.startup = function() {
	// Get the Jasmine exports
	var jasmine = $tw.modules.execute("$:/plugins/tiddlywiki/jasmine/jasmine.js");
	// Add our other context variables
	var context = $tw.utils.extend({},jasmine,{
			console: console,
			setInterval: setInterval,
			clearInterval: clearInterval,
			setTimeout: setTimeout,
			clearTimeout: clearTimeout,
			exports: {},
			$tw: $tw
	});
	// Prepare the Jasmine environment
	var jasmineEnv = jasmine.jasmine.getEnv();
	jasmineEnv.updateInterval = 1000;
	// Execute the appropriate reporter
	var reporterTitle = $tw.browser ? "$:/plugins/tiddlywiki/jasmine/jasmine-html.js" : "$:/plugins/tiddlywiki/jasmine/reporter.js";
	context.require = function(moduleTitle) {
		return $tw.modules.execute(moduleTitle,reporterTitle);
	};
	var code = $tw.wiki.getTiddlerText(reporterTitle,""),
		reporterExports = $tw.utils.evalSandboxed(code,context,reporterTitle);
	// Link the reporter into jasmine
	if($tw.browser) {
		var htmlReporter = new jasmine.jasmine.HtmlReporter();
		jasmineEnv.addReporter(htmlReporter);
		jasmineEnv.specFilter = function(spec) {
			return htmlReporter.specFilter(spec);
		};
	} else {
		// The HTMLReporter links itself into the jasmine object automatically, but we have to manually add the node reporter
		jasmine.jasmine.TerminalVerboseReporter = reporterExports.jasmineNode.TerminalVerboseReporter;
		jasmine.jasmine.TerminalReporter = reporterExports.jasmineNode.TerminalReporter;
		jasmineEnv.addReporter(new jasmine.jasmine.TerminalVerboseReporter({
			print: require("util").print,
			color: true,
			includeStackTrace: true
		}));
	}
	// Iterate through all the test modules
	var tests = $tw.wiki.filterTiddlers(TEST_TIDDLER_FILTER);
	$tw.utils.each(tests,function(title,index) {
		// Get the test specification code
		var code = $tw.wiki.getTiddlerText(title,"");
		// Add a require handler
		context.require = function(moduleTitle) {
			return $tw.modules.execute(moduleTitle,title);
		};
		// Execute the test code with the context variables
		$tw.utils.evalSandboxed(code,context,title);
	});
	// Execute the tests
	jasmineEnv.execute();
};

})();
