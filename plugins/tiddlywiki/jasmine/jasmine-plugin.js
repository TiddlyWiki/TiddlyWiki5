/*\
title: $:/plugins/tiddlywiki/jasmine/jasmine-plugin.js
type: application/javascript
module-type: library

The main module of the Jasmine test plugin for TiddlyWiki5

\*/


"use strict";

var TEST_TIDDLER_FILTER = "[all[tiddlers+shadows]type[application/javascript]tag[$:/tags/test-spec]]";
var TESTS_DONE = false;

exports.testsWereRun = function() {
	return TESTS_DONE;
};

/*
function for running tests

Below, paths like jasmine-core/jasmine.js refer to files in the 'jasmine-core' npm
package, whose repository is https://github.com/jasmine/jasmine.
Paths like jasmine/jasmine.js refer to files in the 'jasmine' npm package, whose
repository is https://github.com/jasmine/jasmine-npm.

They're all locally checked into the `./files` directory.
*/

exports.runTests = function(callback,specFilter) {
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

	// We set this early rather than at the end for simplicity. The browser
	// and node.js environments don't end the same way.
	TESTS_DONE = true;

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
		var contextExports = $tw.utils.evalSandboxed(code,context,title,true);
		// jasmine/jasmine.js assigns directly to `module.exports`: check
		// for it first.
		return context.module.exports || contextExports;
	}

	// Get the core Jasmine exports.
	// We load 'jasmine-core/jasmine.js' here in order to start with a module
	// that is shared between browser and Node.js environments. Browser-specific
	// and Node-specific modules are loaded next.
	var jasmineCore = evalInContext("$:/plugins/tiddlywiki/jasmine/jasmine-core/jasmine-core/jasmine.js");
	// The core Jasmine instance
	var jasmine;
	// Node.js wrapper for calling `.execute()`
	var nodeJasmineWrapper;
	if($tw.browser) {
		window.jasmineRequire = jasmineCore;
		$tw.modules.execute("$:/plugins/tiddlywiki/jasmine/jasmine-core/jasmine-core/jasmine-html.js");
		// Prevent jasmine-core/boot.js from installing its own onload handler. We'll execute it explicitly when everything is ready
		var previousOnloadHandler = window.onload;
		window.onload = function() {};
		$tw.modules.execute("$:/plugins/tiddlywiki/jasmine/jasmine-core/jasmine-core/boot.js");
		var jasmineOnloadHandler = window.onload;
		window.onload = function() {};
		jasmine = window.jasmine;
	} else {
		// Add missing properties to `jasmineCore` in order to call the Jasmine
		// constructor in Node.js.
		//
		// The constructor loads the `jasmineCore` object automatically, if
		// not explicitly specified, by calling `require('jasmine-core')`.
		// What happens internally next is...
		//
		//   1. require('jasmine-core')
		//      a. loads the package's main script, 'jasmine-core/jasmine-core.js'
		//         i. requires 'jasmine-core/jasmine.js'
		//         ii. reads some extra files and returns a `jasmineCore` object
		//
		// Because we're in TiddlyWiki land, we really don't need step 1.a.ii.
		//
		// Since the `jasmineCore` variable already holds the result of 1.a.i,
		// we'll add a few properties necessary for calling the Jasmine constructor
		// and pass it in explicitly. The consructor function can be seen here:
		// https://github.com/jasmine/jasmine-npm/blob/v3.4.0/lib/jasmine.js#L10

		// 'jasmine/jasmine.js' requires the `.boot()` function
		jasmineCore.boot = evalInContext("$:/plugins/tiddlywiki/jasmine/jasmine-core/jasmine-core/node_boot.js");
		// 'jasmine/jasmine.js' references `.files.path`
		jasmineCore.files = {
			path: "$:/plugins/tiddlywiki/jasmine/jasmine-core/jasmine-core"
		};
		// 'jasmine/jasmine.js' references `process.exit`, among other properties
		// It will call 'exit' after it's done, which gives us an
		// opportunity to resynchronize and finish any following commands.
		context.process = Object.create(process);
		context.process.exit = function(code) {
			// If jasmine's exit code is non-zero, tests failed. Abort any
			// further commands. If they're important, they could have come
			// before the testing suite.
			callback(code ? "Tests failed with code " + code : undefined);
		};

		var NodeJasmine = evalInContext("$:/plugins/tiddlywiki/jasmine/jasmine/jasmine.js");
		nodeJasmineWrapper = new NodeJasmine({jasmineCore: jasmineCore});
		jasmine = nodeJasmineWrapper.jasmine;
	}
	// Add Jasmine's DSL to our context
	var env = jasmine.getEnv();
	var jasmineInterface = jasmineCore.interface(jasmine,env)
	context = $tw.utils.extend({},jasmineInterface,context);
	// Iterate through all the test modules
	var tests = $tw.wiki.filterTiddlers(TEST_TIDDLER_FILTER);
	$tw.utils.each(tests,evalInContext);
	// In a browser environment, we use jasmine-core/boot.js to call `execute()` for us.
	// In Node.js, we call it manually.
	if($tw.browser) {
		jasmineOnloadHandler();
	} else {
		nodeJasmineWrapper.execute(null,specFilter);
	}
};
