/*\
title: js/Sandbox.js

Execute a fragment of JavaScript in a sandbox

\*/
(function(){

/*jslint evil: true, node: true */
"use strict";

var pegjs = require("pegjs");

var Sandbox = function(parserText) {
	this.parser = pegjs.buildParser(parserText);
};

Sandbox.prototype.execute = function(code,globals) {
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
	out.push("(function(");
	out.push(globalNames.join(","));
	out.push(") { return ");
	out.push(code);
	out.push(";})");
	// Parse the code
	var code = out.join(""),
		tree = this.parser.parse(out.join(""));
	// XXX: Sanitise the code by checking for references to globals, stripping out eval()
console.log(tree);
	// Execute it
	var result;
	try {
		result = eval(code).apply(null,globalValues);
	} catch(err) {
		result = "{{** Evaluation error: " + err + " **}}";
	}
	return result;
};

exports.Sandbox = Sandbox;

})();