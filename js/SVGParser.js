/*\
title: js/SVGParser.js

Compiles SVG images into JavaScript functions that render them in HTML

\*/
(function(){

/*jslint node: true */
"use strict";

// The parse tree is degenerate
var SVGParseTree = function() {
	this.dependencies = [];
};

SVGParseTree.prototype.compile = function(type) {
	if(type === "text/html") {
		return "(function (tiddler,store,utils) {return tiddler.text;})";
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
