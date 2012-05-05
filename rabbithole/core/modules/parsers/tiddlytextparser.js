/*\
title: $:/core/modules/parsers/tiddlytextparser.js
type: application/javascript
module-type: parser

Parses a plain text block that can also contain macros and transclusions.

The syntax for transclusions is:

	[[tiddlerTitle]]

The syntax for macros is:

	<<macroName params>>

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var TiddlyTextParser = function(options) {
	this.wiki = options.wiki;
};

TiddlyTextParser.prototype.parse = function(type,text) {
	var output = [],
		dependencies = new $tw.Dependencies(),
		macroRegExp = /(?:\[\[([^\]]+)\]\])|(?:<<(?:([!@£\$%\^\&\*\(\)`\~'"\|\\\/;\:\.\,\+\=\-\_\{\}])|([^>\s]+))(?:\s*)((?:[^>]|(?:>(?!>)))*)>>)/mg,
		lastMatchPos = 0,
		match,
		macroNode;
	do {
		match = macroRegExp.exec(text);
		if(match) {
			output.push($tw.Tree.Text(text.substring(lastMatchPos,match.index)));
			var macroName = match[2] || match[3];
			if(match[1]) { // Transclusion
				macroNode = $tw.Tree.Macro("tiddler",{
					target: match[1]
				},[],this.wiki);
			} else if(macroName) { // Macro call
				macroNode = $tw.Tree.Macro(macroName,match[4],[],this.wiki);
			}
			output.push(macroNode);
			dependencies.mergeDependencies(macroNode.dependencies);
			lastMatchPos = match.index + match[0].length;
		} else {
			output.push($tw.Tree.Text(text.substr(lastMatchPos)));
		}
	} while(match);
	return new $tw.Renderer(output,dependencies);
};

exports["text/x-tiddlywiki-css"] = TiddlyTextParser;
exports["text/x-tiddlywiki-html"] = TiddlyTextParser;

})();
