/*\
title: js/BitmapParser.js

Compiles bitmap images into JavaScript functions that render them in HTML

\*/
(function(){

/*jslint node: true */
"use strict";

// The parse tree is degenerate
var BitmapParseTree = function() {
	this.dependencies = [];
};

BitmapParseTree.prototype.compile = function(type) {
	if(type === "text/html") {
		return "(function (tiddler,store,utils) {return '<img src=\"data:' + tiddler.type + ';base64,' + tiddler.text + '\">';})";
	} else {
		return null;
	}
};

var BitmapParser = function() {
};

BitmapParser.prototype.parse = function() {
	return new BitmapParseTree();
};

exports.BitmapParser = BitmapParser;

})();
