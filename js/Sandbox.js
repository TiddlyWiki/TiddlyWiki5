/*\
title: js/Sandbox.js

Execute a fragment of JavaScript in a sandbox

\*/
(function(){

/*jslint node: true */
"use strict";

var uglify = require("uglify-js");

var safeEval = function(e) {
	return eval(e);
};

var Sandbox = function(code,globals) {
	var globalNames = [],
		globalValues = [],
		collectGlobals = function(globals) {
			if(globals) {
				for(var g in globals) {
					globalNames.push(g);
					globalValues.push(globals[g]);
				}
			}
		};
	// Collect the supplied globals
	collectGlobals(globals);
	// Add the default globals
	collectGlobals({
		tiddlywiki: "5"
	});
	// Compose the code
	var out = [];
	out.push("(function(")
	out.push(globalNames.join(","));
	out.push(") { return ");
	out.push(code);
	out.push(";})");
	// Parse the code
	var tree = uglify.parser.parse(out.join(""));
	// XXX: Sanitise the code by checking for references to globals
	// Recompile the code
	var compiledCode = uglify.uglify.gen_code(tree);
	// Execute it
	return eval(compiledCode).apply(null,globalValues);
};

exports.Sandbox = Sandbox;

})();