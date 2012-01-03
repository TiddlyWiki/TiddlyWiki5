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

Sandbox.prototype.parse = function(code) {
	return this.parser.parse(code);
};

exports.Sandbox = Sandbox;

})();