/*\
title: js/TiddlyTextParser.js

Parses a plain text block that can also contain macros and transclusions.

The syntax for transclusions is:

	[[tiddlerTitle]]

The syntax for macros is:

	<<macroName params>>

\*/
(function(){

/*jslint node: true */
"use strict";

var Dependencies = require("./Dependencies.js").Dependencies,
	Renderer = require("./Renderer.js").Renderer,
	utils = require("./Utils.js");

var TiddlyTextParser = function(options) {
	this.store = options.store;
};

TiddlyTextParser.prototype.parse = function(type,text) {
	var output = [],
		dependencies = new Dependencies(),
		macroRegExp = /(?:\[\[([^\]]+)\]\])|(?:<<([^>\s]+)(?:\s*)((?:[^>]|(?:>(?!>)))*)>>)/mg,
		lastMatchPos = 0,
		match,
		macroNode;
	do {
		match = macroRegExp.exec(text);
		if(match) {
			output.push(Renderer.TextNode(text.substring(lastMatchPos,match.index)));
			if(match[1]) { // Transclusion
				macroNode = Renderer.MacroNode("tiddler",{
					target: match[1]
				},[],this.store);
			} else if(match[2]) { // Macro call
				macroNode = Renderer.MacroNode(match[2],match[3],[],this.store);
			}
			output.push(macroNode);
			dependencies.mergeDependencies(macroNode.dependencies);
			lastMatchPos = match.index + match[0].length;
		} else {
			output.push(Renderer.TextNode(text.substr(lastMatchPos)));
		}
	} while(match);
	return new Renderer(output,dependencies,this.store);
};

exports.TiddlyTextParser = TiddlyTextParser;

})();
