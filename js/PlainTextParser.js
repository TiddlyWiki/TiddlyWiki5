/*\
title: js/PlainTextParser.js

Renders plain text tiddlers

\*/
(function(){

/*jslint node: true */
"use strict";

var WikiTextParseTree = require("./WikiTextParseTree.js").WikiTextParseTree,
    Renderer = require("./Renderer.js").Renderer,
    Dependencies = require("./Dependencies.js").Dependencies,
    utils = require("./Utils.js");

var PlainTextParser = function(options) {
    this.store = options.store;
};

PlainTextParser.prototype.parse = function(type,text) {
	return new WikiTextParseTree([Renderer.ElementNode("pre",{},[Renderer.TextNode(text)])],new Dependencies(),this.store);
};

exports.PlainTextParser = PlainTextParser;

})();
