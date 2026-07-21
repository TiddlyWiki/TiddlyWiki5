/*\
title: $:/core/modules/filters/colour-resolve.js
type: application/javascript
module-type: filteroperator

Filter operator for resolving colour palette entry reference chains

\*/

"use strict";

/*
Get the consolidated palette dictionary
*/
function getConsolidatedPalette(options) {
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
function parseReference(value) {
	if(typeof value !== "string" || value === "") {
		return null;
	}
	var match;
	// [tf.colour[name]]
	match = value.match(/^\s*\[tf\.colour\[([^\]]+)\]\]\s*$/);
	if(match) {
		return match[1];
	}
	// <<colour name>> or <<color name>>
	match = value.match(/^\s*<<colou?r\s+(\S+)\s*>>\s*$/);
	if(match) {
		return match[1];
	}
	// <$transclude ... $variable="colour" ... name="name" ... />
	match = value.match(/^\s*<\$transclude[^>]*\$variable="colou?r"[^>]*name="([^"]+)"[^/]*\/>\s*$/);
	if(match) {
		return match[1];
	}
	// <$macrocall ... $name="colour" ... name="name" ... />
	match = value.match(/^\s*<\$macrocall[^>]*\$name="colou?r"[^>]*name="([^"]+)"[^>]*\/>\s*$/);
	if(match) {
		return match[1];
	}
	return null;
}

/*
Recursively resolve a palette entry name to its terminal entry.
Returns the name of the terminal entry.
*/
function resolveEntry(name, palette, visited) {
	if(visited.indexOf(name) !== -1) {
		return name;
	}
	visited.push(name);
	var value = palette[name];
	if(value === undefined || value === null) {
		return name;
	}
	var target = parseReference(value);
	if(target) {
		return resolveEntry(target, palette, visited);
	}
	return name;
}

/*
Export our filter function
*/
exports["colour-resolve"] = function(source, operator, options) {
	var results = [];
	var mode = (((operator.suffixes || [])[0] || ["name"])[0] || "name").toLowerCase();
	var palette = getConsolidatedPalette(options);
	if(!palette) {
		source(function(tiddler, title) {
			results.push(title);
		});
		return results;
	}
	if(operator.prefix === "!") {
		source(function(tiddler, title) {
			var value = palette[title];
			if(value === undefined || value === null || parseReference(value) === null) {
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
			var resolved = resolveEntry(title, palette, visited);
			if(mode === "colour") {
				results.push(palette[resolved] || "");
			} else {
				results.push(resolved);
			}
		});
	}
	return results;
};
