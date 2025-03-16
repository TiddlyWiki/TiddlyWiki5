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

"use strict";

exports.name = "parameters";
exports.types = {pragma: true};

/*
Instantiate parse rule
*/
exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	this.matchRegExp = /\\parameters\s*\(([^)]*)\)(\s*\r?\n)?/mg;
};

/*
Parse the most recent match
*/
exports.parse = function() {
	// Move past the macro name and parameters
	this.parser.pos = this.matchRegExp.lastIndex;
	// Parse the parameters
	var params = $tw.utils.parseParameterDefinition(this.match[1]);
	var attributes = Object.create(null),
		orderedAttributes = [];
	$tw.utils.each(params,function(param) {
		var name = param.name;
		// Parameter names starting with dollar must be escaped to double dollars for the parameters widget
		if(name.charAt(0) === "$") {
			name = "$" + name;
		}
		var attribute = {name: name, type: "string", value: param["default"] || ""};
		attributes[name] = attribute;
		orderedAttributes.push(attribute);
	});
	// Save the macro definition
	return [{
		type: "parameters",
		attributes: attributes,
		orderedAttributes: orderedAttributes
	}];
};
