/*\
title: $:/core/modules/parsers/wikiparser/rules/fnprocdef.js
type: application/javascript
module-type: wikirule

Wiki pragma rule for function, procedure and widget definitions

```
\function name(param:defaultvalue,param2:defaultvalue)
definition text
\end

\procedure name(param:defaultvalue,param2:defaultvalue)
definition text
\end

\widget $mywidget(param:defaultvalue,param2:defaultvalue)
definition text
\end
```

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "fnprocdef";
exports.types = {pragma: true};

/*
Instantiate parse rule
*/
exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	this.matchRegExp = /^\\(\??)(function|procedure|widget)\s+([^(\s]+)(\(\s*([^)]*)\))?(\s*\r?\n)?/mg;
};

/*
Parse the most recent match
*/
exports.parse = function() {
	// Move past the macro name and parameters
	this.parser.pos = this.matchRegExp.lastIndex;
	// Parse the parameters
	var params = [];
	if(this.match[4]) {
		params = $tw.utils.parseParameterDefinition(this.match[5]);
	}
	// Is this a multiline definition?
	var reEnd;
	if(this.match[6]) {
		// If so, the end of the body is marked with \end
		reEnd = /(\r?\n\\end[^\S\n\r]*(?:$|\r?\n))/mg;
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
		attributes: {
			name: {type: "string", value: this.match[3]},
			value: {type: "string", value: text}
		},
		children: [],
		params: params
	}];
	if(this.match[2] === "function") {
		parseTreeNodes[0].isFunctionDefinition = true;
	} else if(this.match[2] === "procedure") {
		parseTreeNodes[0].isProcedureDefinition = true;
	} else if(this.match[2] === "widget") {
		parseTreeNodes[0].isWidgetDefinition = true;
	}
	if(this.parser.configTrimWhiteSpace) {
		parseTreeNodes[0].configTrimWhiteSpace = true;
	}
	if(this.match[1] === "?") {
		$tw.utils.addAttributeToParseTreeNode(parseTreeNodes[0],"conditional","yes");
	}
	return parseTreeNodes;
};

})();
	