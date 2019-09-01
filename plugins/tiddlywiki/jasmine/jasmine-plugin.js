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
	// Set up a shared context object.
	var context = {
		console: console,
		setInterval: setInterval,
		clearInterval: clearInterval,
		setTimeout: setTimeout,
		clearTimeout: clearTimeout,
		$tw: $tw
	};
	// The `global` property is needed in two places:
	// 1. jasmine-core/node_boot.js: extends the global object with jasmine interface.
	// 2. jasmine-core/jasmine.js: when it's loaded, if it determines that it's
	//    running in a commonjs environment and `global` is undefined, it will set
	//    `jasmineGlobal`, its internal reference to the global object, to {},
	//    which is not what we want. Alternatively, the `jasmine.getEnv()` API allows
	//    you to pass in a `global` object, but the boot scripts we use don't allow
	//    the caller to customize the `.getEnv()` call. We'd rather use the boot scripts
	//    as-is than duplicating them in order to do minor tweaks.
	//
	// We need this `$tw.browser ?` conditional because:
	// 1. In a browser environment, 'jasmine-core/jasmine.js' calls `setTimeout` like
	//    `setTimeout.apply(jasmineGlobal, ...)`; the browser throws an "illegal invocation"
	//    unless `jasmineGlobal` is the right context object, which is `window`.
	// 2. In Node.js, there is no `window` object.
	//    Further more, we don't have access to the `global` object when this code
	//    is executed, so we use the `context` object instead.
	context.global = $tw.browser ? window : context;

	function evalInContext(title) {
		var code = $tw.wiki.getTiddlerText(title,"");
		var _exports = {};
		context.exports = _exports;
		context.module = {exports: _exports};
		context.require = function(moduleTitle) {
			// mock out the 'glob' module required in
			// "$:/plugins/tiddlywiki/jasmine/jasmine/jasmine.js"
			if (moduleTitle === "glob") {
				return {};
			}
			return $tw.modules.execute(moduleTitle,title);
		};
		var contextExports = $tw.utils.evalSandboxed(code,context,title);
		// jasmine/jasmine.js assigns directly to `module.exports`: check
		// for it first.
		return context.module.exports || contextExports;
	}

	// Get the core Jasmine exports
	var jasmineCore = evalInContext("$:/plugins/tiddlywiki/jasmine/jasmine-core/jasmine-core/jasmine.js");
	// Get the Jasmine instance and configure reporters
	var jasmine;
	if($tw.browser) {
		window.jasmineRequire = jasmineCore;
		$tw.modules.execute("$:/plugins/tiddlywiki/jasmine/jasmine-core/jasmine-core/jasmine-html.js");
		$tw.modules.execute("$:/plugins/tiddlywiki/jasmine/jasmine-core/jasmine-core/boot.js");
		jasmine = window.jasmine;
	} else {
		// We load 'jasmine-core/jasmine.js' above instead of the
		// main script 'jasmine-core/jasmine-core.js', which is what's loaded
		// when you run `require('jasmine-core')` in a Node.js environment.
		// We load 'jasmine-core/jasmine.js' because we want to factor out
		// code paths that are common between browser and Node.js environments.
		// As a result, the `jasmineCore` object is missing some properties that
		// 'jasmine/jasmine.js' expects, so we manually populate what we need.

		// 'jasmine/jasmine.js' calls `.boot()`
		jasmineCore.boot = evalInContext("$:/plugins/tiddlywiki/jasmine/jasmine-core/jasmine-core/node_boot.js");
		// 'jasmine/jasmine.js' references `.files.path`
		jasmineCore.files = {
			path: "$:/plugins/tiddlywiki/jasmine/jasmine-core/jasmine-core"
		};
		// 'jasmine/jasmine.js' references `process.exit`
		context.process = process;

		var JasmineNode = evalInContext("$:/plugins/tiddlywiki/jasmine/jasmine/jasmine.js");
		var jasmineRunner = new JasmineNode({jasmineCore: jasmineCore});
		jasmineRunner.configureDefaultReporter({});
		jasmine = jasmineRunner.jasmine;
	}
	// Add Jasmine's DSL to our context
	var env = jasmine.getEnv();
	var jasmineInterface = jasmineCore.interface(jasmine,env)
	context = $tw.utils.extend({},jasmineInterface,context);
	// Iterate through all the test modules
	var tests = $tw.wiki.filterTiddlers(TEST_TIDDLER_FILTER);
	$tw.utils.each(tests,function(title) {
		evalInContext(title);
	});
	// In a browser environment, jasmine-core/boot.js calls `execute()` for us.
	// In Node.js, we call it manually.
	if(!$tw.browser) {
		env.execute();
	}
};

})();
