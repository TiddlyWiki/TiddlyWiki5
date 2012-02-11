/*\
title: js/ImageParser.js

Compiles images into JavaScript functions that render them in HTML

\*/
(function(){

/*jslint node: true */
"use strict";

var utils = require("./Utils.js");

var ImageRenderer = function(handlerCode) {
	/*jslint evil: true */
	this.handler = eval(handlerCode);
};

ImageRenderer.prototype.render = function(tiddler,store) {
	return this.handler(tiddler,store,utils);
};

// The parse tree is degenerate
var ImageParseTree = function(type,text) {
	this.type = type;
	this.text = text;
	this.dependencies = {};
};

ImageParseTree.prototype.compile = function(type) {
	if(type === "text/html") {
		if(this.type === "image/svg+xml") {
			return new ImageRenderer("(function (tiddler,store,utils) {return '<img src=\"data:" + this.type + "," + utils.stringify(encodeURIComponent(this.text)) + "\">';})");
		} else {
			return new ImageRenderer("(function (tiddler,store,utils) {return '<img src=\"data:" + this.type + ";base64," + this.text + "\">';})");
		}
	} else {
		return null;
	}
};

var ImageParser = function() {
};

ImageParser.prototype.parse = function(type,text) {
	return new ImageParseTree(type,text);
};

exports.ImageParser = ImageParser;

})();
