/*\
title: js/SVGParser.js

Compiles SVG images into JavaScript functions that render them in HTML

\*/
(function(){

/*jslint node: true */
"use strict";

var utils = require("./Utils.js");

var SVGRenderer = function(handlerCode) {
	/*jslint evil: true */
	this.handler = eval(handlerCode);
};

SVGRenderer.prototype.render = function(tiddler,store) {
	return this.handler(tiddler,store,utils);
};

// The parse tree is degenerate
var SVGParseTree = function() {
	this.dependencies = [];
};

SVGParseTree.prototype.compile = function(type) {
	if(type === "text/html") {
		return new SVGRenderer("(function (tiddler,store,utils) {return '<img src=\"data:' + tiddler.type + ',' + encodeURIComponent(tiddler.text) + '\">';})");
	} else {
		return null;
	}
};

var SVGParser = function() {
};

SVGParser.prototype.parse = function() {
	return new SVGParseTree();
};

exports.SVGParser = SVGParser;

})();
