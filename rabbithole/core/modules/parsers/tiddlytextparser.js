/*\
title: $:/core/parsers/tiddlytextparser.js
type: application/javascript
module-type: parser

Parses a plain text block that can also contain macros and transclusions.

The syntax for transclusions is:

	[[tiddlerTitle]]

The syntax for macros is:

	<<macroName params>>

\*/
(function(){

/*jslint node: true */
"use strict";

var TiddlyTextParser = function(options) {
	this.wiki = options.wiki;
};

TiddlyTextParser.prototype.parse = function(type,text) {
	var output = [],
		dependencies = new $tw.Dependencies(),
		macroRegExp = /(?:\[\[([^\]]+)\]\])|(?:<<([^>\s]+)(?:\s*)((?:[^>]|(?:>(?!>)))*)>>)/mg,
		lastMatchPos = 0,
		match,
		macroNode;
	do {
		match = macroRegExp.exec(text);
		if(match) {
			output.push($tw.Tree.Text(text.substring(lastMatchPos,match.index)));
			if(match[1]) { // Transclusion
				macroNode = $tw.Tree.Macro("tiddler",{
					target: match[1]
				},[],this.wiki);
			} else if(match[2]) { // Macro call
				macroNode = $tw.Tree.Macro(match[2],match[3],[],this.wiki);
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

})();
