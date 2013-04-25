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
			$tw: $tw
	});
	// Add the HTMLReporter
	if($tw.browser) {
		var reporterTitle = "$:/plugins/tiddlywiki/jasmine/jasmine-html.js";
		var code = $tw.wiki.getTiddlerText(reporterTitle,"");
		$tw.utils.evalSandboxed(code,context,reporterTitle);
	} else {
		var reporterTitle = "$:/plugins/tiddlywiki/jasmine/reporter.js";
		context.require = function(moduleTitle) {
			return $tw.modules.execute(moduleTitle,reporterTitle);
		};
		var code = $tw.wiki.getTiddlerText(reporterTitle,"");
		var nodeReporters = $tw.utils.evalSandboxed(code,context,reporterTitle);
		jasmine.TerminalVerboseReporter = nodeReporters.jasmineNode.TerminalVerboseReporter;
		jasmine.TerminalReporter = nodeReporters.jasmineNode.TerminalReporter;
	}
	// Prepare the Jasmine environment
	var jasmineEnv = jasmine.jasmine.getEnv();
	jasmineEnv.updateInterval = 1000;
	if($tw.browser) {
		var htmlReporter = new jasmine.jasmine.HtmlReporter();
		jasmineEnv.addReporter(htmlReporter);
		jasmineEnv.specFilter = function(spec) {
			return htmlReporter.specFilter(spec);
		};
	} else {
	    jasmineEnv.addReporter(new jasmine.TerminalVerboseReporter({
			print: require("util").print,
			color: true,
			includeStackTrace: true
		}));
	}
	// Iterate through all the test modules
	var tests = $tw.wiki.filterTiddlers("[type[application/javascript]tag[$:/tags/test-spec]]");
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
