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

"use strict";

exports.name = "macrodef";
exports.types = {pragma: true};

/*
Instantiate parse rule
*/
exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	this.matchRegExp = /\\define\s+([^(\s]+)\(\s*([^)]*)\)(\s*\r?\n)?/mg;
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
		var reParam = /\s*([A-Za-z0-9\-_]+)(?:\s*:\s*(?:"""([\s\S]*?)"""|"([^"]*)"|'([^']*)'|\[\[([^\]]*)\]\]|([^"'\s]+)))?/mg,
			paramMatch = reParam.exec(paramString);
		while(paramMatch) {
			// Save the parameter details
			var paramInfo = {name: paramMatch[1]},
				defaultValue = paramMatch[2] || paramMatch[3] || paramMatch[4] || paramMatch[5] || paramMatch[6];
			if(defaultValue) {
				paramInfo["default"] = defaultValue;
			}
			params.push(paramInfo);
			// Look for the next parameter
			paramMatch = reParam.exec(paramString);
		}
	}
	// Is the remainder of the \define line blank after the parameter close paren?
	var reEnd,isBlock = true;
	if(this.match[3]) {
		// If so, it is a multiline definition and the end of the body is marked with \end
		isBlock = false;
		reEnd = new RegExp("((?:^|\\r?\\n)[^\\S\\n\\r]*\\\\end[^\\S\\n\\r]*(?:" + $tw.utils.escapeRegExp(this.match[1]) + ")?\\s*?(?:$|\\r?\\n))","mg");
	} else {
		// Otherwise, the end of the definition is marked by the end of the line
		reEnd = /($|\r?\n)/mg;
		// Move past any whitespace
		this.parser.pos = $tw.utils.skipWhiteSpace(this.parser.source,this.parser.pos);
	}
	// Find the end of the definition
	reEnd.lastIndex = this.parser.pos;
	var text,
		endMatch = reEnd.exec(this.parser.source);
	if(endMatch) {
		text = this.parser.source.substring(this.parser.pos,endMatch.index);
		this.parser.pos = endMatch.index + endMatch[0].length;
	} else {
		// We didn't find the end of the definition, so we'll make it blank
		text = "";
	}
	// Save the macro definition
	var parseTreeNodes = [{
		type: "set",
		attributes: {},
		children: [],
		params: params,
		isMacroDefinition: true,
		isBlock: isBlock && !!endMatch
	}];
	$tw.utils.addAttributeToParseTreeNode(parseTreeNodes[0],"name",this.match[1]);
	$tw.utils.addAttributeToParseTreeNode(parseTreeNodes[0],"value",text);
	return parseTreeNodes;
};
