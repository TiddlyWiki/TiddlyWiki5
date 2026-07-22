/*\
title: $:/core/modules/filters/colour-resolve.js
type: application/javascript
module-type: filteroperator

Filter operator for resolving colour palette entry reference chains

\*/

"use strict";

/*
Get a palette dictionary by name, or the consolidated palette if no name given
*/
function getPalette(name, options) {
	if(name) {
		var tiddler = options.wiki.getTiddler(name);
		if(tiddler) {
			return options.wiki.getTiddlerData(tiddler);
		}
		return null;
	}
	var tiddler = options.wiki.getTiddler("$:/temp/palette-consolidated");
	if(tiddler) {
		return options.wiki.getTiddlerData(tiddler);
	}
	return null;
}

/*
Parse a palette entry value to extract a reference to another entry.
Returns the target entry name if it's a simple reference, null otherwise.
*/
function parseReference(value,widget) {
	if(typeof value !== "string" || value === "") {
		return null;
	}
	var pos,attribute,widgetType,variableName,targetName,match,node,orderedAttributes,endPos,result;
	// [tf.colour[name]] - literal string operand
	match = value.match(/^\s*\[tf\.colour\[([^\]]+)\]\]\s*$/);
	if(match) {
		return match[1];
	}
	// [tf.colour<name>] - variable reference operand
	match = value.match(/^\s*\[tf\.colour<([^>]+)>\]\s*$/);
	if(match) {
		if(widget) {
			result = widget.getVariable(match[1]);
			if(typeof result === "string" && result !== "") {
				return result;
			}
		}
		return null;
	}
	// [tf.colour{name}] - text reference operand
	match = value.match(/^\s*\[tf\.colour\{([^}]+)\}\]\s*$/);
	if(match) {
		if(widget) {
			result = widget.wiki.getTextReference(match[1],"",widget.getVariable("currentTiddler"));
			if(typeof result === "string" && result !== "") {
				return result;
			}
		}
		return null;
	}
	// <<colour name>> or <<colour "name">> or <<colour name=value>> or <<colour name={{{filter}}}>> etc.
	pos = $tw.utils.skipWhiteSpace(value,0);
	node = $tw.utils.parseMacroInvocationAsTransclusion(value,pos);
	if(node && node.attributes.$variable && /^colou?r$/i.test(node.attributes.$variable.value)) {
		endPos = $tw.utils.skipWhiteSpace(value,node.end);
		if(endPos === value.length) {
			orderedAttributes = node.orderedAttributes || [];
			if(orderedAttributes.length > 0) {
				// Find the parameter named "name", or the first positional parameter
				var targetParam = null;
				for(var i = 0; i < orderedAttributes.length; i++) {
					if(orderedAttributes[i].name === "name") {
						targetParam = orderedAttributes[i];
						break;
					}
				}
				if(!targetParam) {
					for(var i = 0; i < orderedAttributes.length; i++) {
						if(orderedAttributes[i].isPositional) {
							targetParam = orderedAttributes[i];
							break;
						}
					}
				}
				if(!targetParam) {
					targetParam = orderedAttributes[0];
				}
				if(widget) {
					result = widget.computeAttribute(targetParam);
					if(typeof result === "string" && result !== "") {
						return result;
					}
				} else if(targetParam.type === "string") {
					return targetParam.value;
				}
			}
		}
	}
	// Use the core parameter parser for widget tags
	pos = $tw.utils.skipWhiteSpace(value,0);
	if(value.substr(pos,11).toLowerCase() === "<$transclude") {
		widgetType = "transclude";
		pos += 11;
	} else if(value.substr(pos,10).toLowerCase() === "<$macrocall") {
		widgetType = "macrocall";
		pos += 10;
	} else {
		return null;
	}
	// Parse attributes using the core parameter parser
	variableName = null;
	targetName = null;
	attribute = $tw.utils.parseAttribute(value,pos);
	while(attribute) {
		if(attribute.type === "string") {
			if(widgetType === "transclude" && attribute.name === "$variable" && /^colou?r$/i.test(attribute.value)) {
				variableName = attribute.value;
			} else if(widgetType === "macrocall" && attribute.name === "$name" && /^colou?r$/i.test(attribute.value)) {
				variableName = attribute.value;
			} else if(attribute.name === "name") {
				targetName = attribute.value;
			}
		} else if(attribute.name === "name" && widget) {
			result = widget.computeAttribute(attribute);
			if(typeof result === "string" && result !== "") {
				targetName = result;
			}
		}
		pos = attribute.end;
		attribute = $tw.utils.parseAttribute(value,pos);
	}
	if(variableName !== null && targetName !== null) {
		return targetName;
	}
	return null;
}

/*
Recursively resolve a palette entry name to its terminal entry.
Returns the name of the terminal entry.
*/
function resolveEntry(name, palette, visited, widget) {
	if(visited.indexOf(name) !== -1) {
		return name;
	}
	visited.push(name);
	// First, try to resolve the input title itself as a reference
	var target = parseReference(name, widget);
	if(target) {
		return resolveEntry(target, palette, visited, widget);
	}
	// Otherwise, look up the palette entry value and resolve that
	var value = palette[name];
	if(value === undefined || value === null) {
		return name;
	}
	target = parseReference(value, widget);
	if(target) {
		return resolveEntry(target, palette, visited, widget);
	}
	return name;
}

/*
Export our filter function
*/
exports["colour-resolve"] = function(source, operator, options) {
	var results = [];
	var mode = (((operator.suffixes || [])[0] || ["name"])[0] || "name").toLowerCase();
	var paletteName = operator.operand || "";
	var palette = getPalette(paletteName, options);
	if(!palette) {
		source(function(tiddler, title) {
			results.push(title);
		});
		return results;
	}
	if(operator.prefix === "!") {
		source(function(tiddler, title) {
			var value = palette[title];
			if(value === undefined || value === null || parseReference(value, options.widget) === null) {
				if(mode === "colour") {
					results.push(value || "");
				} else {
					results.push(title);
				}
			}
		});
	} else {
		source(function(tiddler, title) {
			var visited = [];
			var resolved = resolveEntry(title, palette, visited, options.widget);
			if(mode === "colour") {
				results.push(palette[resolved] || "");
			} else {
				results.push(resolved);
			}
		});
	}
	return results;
};
