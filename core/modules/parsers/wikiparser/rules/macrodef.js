/*\
title: $:/core/modules/parsers/wikiparser/rules/macrodef.js
type: application/javascript
module-type: wikirule

Wiki pragma rule for macro definitions

```
\define name(param:defaultvalue,param2:defaultvalue)
definition text, including $param$ markers
\end
```

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "macrodef";
exports.types = {pragma: true};

/*
Instantiate parse rule
*/
exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	this.matchRegExp = /^\\define\s+([^(\s]+)\(\s*([^)]*)\)(\r?\n)?/mg;
};

/*
Parse the most recent match
*/
exports.parse = function() {
	// Move past the macro name and parameters
	this.parser.pos = this.matchRegExp.lastIndex;
	// Parse the parameters
	var paramString = this.match[2],
		params = [];
	if(paramString !== "") {
		var reParam = /\s*([A-Za-z0-9\-_]+)(?:\s*:\s*(?:"([^"]*)"|'([^']*)'|\[\[([^\]]*)\]\]|([^"'\s]+)))?/mg,
			paramMatch = reParam.exec(paramString);
		while(paramMatch) {
			// Save the parameter details
			var paramInfo = {name: paramMatch[1]},
				defaultValue = paramMatch[2] || paramMatch[3] || paramMatch[4] || paramMatch[5];
			if(defaultValue) {
				paramInfo["default"] = defaultValue;
			}
			params.push(paramInfo);
			// Look for the next parameter
			paramMatch = reParam.exec(paramString);
		}
	}
	// Is this a multiline definition?
	var reEnd;
	if(this.match[3]) {
		// If so, the end of the body is marked with \end
		reEnd = /(\r?\n\\end\r?\n)/mg;
	} else {
		// Otherwise, the end of the definition is marked by the end of the line
		reEnd = /(\r?\n)/mg;
	}
	// Find the end of the definition
	reEnd.lastIndex = this.parser.pos;
	var text,
		endMatch = reEnd.exec(this.parser.source);
	if(endMatch) {
		text = this.parser.source.substring(this.parser.pos,endMatch.index).trim();
		this.parser.pos = endMatch.index + endMatch[0].length;
	} else {
		// We didn't find the end of the definition, so we'll make it blank
		text = "";
	}
	// Save the macro definition
	this.parser.macroDefinitions[this.match[1]] = {
		type: "textmacro",
		name: this.match[1],
		params: params,
		text: text
	};
};

})();
