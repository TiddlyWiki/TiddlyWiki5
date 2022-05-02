/*\
title: $:/core/modules/parsers/wikiparser/rules/parameters.js
type: application/javascript
module-type: wikirule

Wiki pragma rule for parameter definitions

```
\parameters(param:defaultvalue,param2:defaultvalue)
definition text
```

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "parameters";
exports.types = {pragma: true};

/*
Instantiate parse rule
*/
exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	this.matchRegExp = /^\\parameters\s*\(([^)]*)\)\s*\r?\n/mg;
};

/*
Parse the most recent match
*/
exports.parse = function() {
	// Move past the macro name and parameters
	this.parser.pos = this.matchRegExp.lastIndex;
	// Parse the parameters
	var paramString = this.match[1],
		attributes = Object.create(null),
		orderedAttributes = [],
		reParam = /\s*([^:)\s]+)(?:\s*:\s*(?:"""([\s\S]*?)"""|"([^"]*)"|'([^']*)'|([^"'\s]+)))?/mg,
		paramMatch = reParam.exec(paramString);
	while(paramMatch) {
		// Save the parameter details
		var name = paramMatch[1],
			attribute = {name: name, type: "string", value: paramMatch[2] || paramMatch[3] || paramMatch[4] || paramMatch[5]};
		attributes[name] = attribute;
		orderedAttributes.push(attribute);
		// Look for the next parameter
		paramMatch = reParam.exec(paramString);
	}
	// Save the macro definition
	return [{
		type: "parameters",
		attributes: attributes,
		orderedAttributes: orderedAttributes
	}];
};

})();
