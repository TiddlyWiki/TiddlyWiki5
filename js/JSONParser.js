/*\
title: js/JSONParser.js

Compiles JSON objects into JavaScript functions that render them in HTML and plain text

\*/
(function(){

/*jslint node: true */
"use strict";

var utils = require("./Utils.js");

var JSONRenderer = function(handlerCode) {
	/*jslint evil: true */
	this.handler = eval(handlerCode);
};

JSONRenderer.prototype.render = function(tiddler,store) {
	return this.handler(tiddler,store,utils);
};

JSONRenderer.prototype.toString = function(type) {
	var output = [];
	utils.renderObject(output,type,this.handler.toString(),[]);
	return output.join("");
};

// The parse tree is degenerate
var JSONParseTree = function(tree) {
	this.tree = tree;
	this.dependencies = [];
};

JSONParseTree.prototype.compile = function(type) {
	return new JSONRenderer("(function (tiddler,store,utils) {var output=[]; utils.renderObject(output,'" + type + "'," + JSON.stringify(this.tree) + ",[]);return output.join('');})");
};

JSONParseTree.prototype.toString = function(type) {
	var output = [];
	utils.renderObject(output,type,this.tree,[]);
	return output.join("");
};

var JSONParser = function() {
};

JSONParser.prototype.parse = function(type,text) {
	return new JSONParseTree(JSON.parse(text));
};


exports.JSONParser = JSONParser;

})();
