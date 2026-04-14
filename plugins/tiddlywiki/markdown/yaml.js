/*\
title: $:/plugins/tiddlywiki/markdown/yaml.js
type: application/javascript
module-type: library

Minimal YAML parser for frontmatter extraction.
API-compatible subset of js-yaml: load(string) → object, dump(object) → string.
Handles scalars, flow/block arrays, and simple nested maps.

\*/
"use strict";

function YAMLException(message, mark) {
	this.name = "YAMLException";
	this.message = message;
	this.mark = mark || null;
}
YAMLException.prototype = Object.create(Error.prototype);
YAMLException.prototype.constructor = YAMLException;

// -- Scalar parsing --

function parseScalar(raw) {
	if(raw === "" || raw === "null" || raw === "Null" || raw === "NULL" || raw === "~") {
		return null;
	}
	if(raw === "true" || raw === "True" || raw === "TRUE") {
		return true;
	}
	if(raw === "false" || raw === "False" || raw === "FALSE") {
		return false;
	}
	// Quoted strings
	if((raw[0] === '"' && raw[raw.length - 1] === '"') ||
	   (raw[0] === "'" && raw[raw.length - 1] === "'")) {
		var inner = raw.slice(1, -1);
		if(raw[0] === '"') {
			// Handle basic escape sequences in double-quoted strings
			inner = inner.replace(/\\n/g, "\n")
				.replace(/\\t/g, "\t")
				.replace(/\\r/g, "\r")
				.replace(/\\\\/g, "\\")
				.replace(/\\"/g, '"');
		}
		return inner;
	}
	// Numbers: integers and floats
	if(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(raw)) {
		var num = Number(raw);
		if(!isNaN(num)) {
			return num;
		}
	}
	// Hex integers
	if(/^0x[0-9a-fA-F]+$/.test(raw)) {
		return parseInt(raw, 16);
	}
	// Octal integers
	if(/^0o[0-7]+$/.test(raw)) {
		return parseInt(raw.slice(2), 8);
	}
	// Special floats
	if(raw === ".inf" || raw === ".Inf" || raw === ".INF") {
		return Infinity;
	}
	if(raw === "-.inf" || raw === "-.Inf" || raw === "-.INF") {
		return -Infinity;
	}
	if(raw === ".nan" || raw === ".NaN" || raw === ".NAN") {
		return NaN;
	}
	return raw;
}

// -- Flow sequence parser: [item, item, ...] --

function parseFlowSequence(str) {
	// Strip outer brackets and split respecting nested brackets and quotes
	var inner = str.slice(1, -1).trim();
	if(inner === "") {
		return [];
	}
	var items = [],
		current = "",
		depth = 0,
		inSingle = false,
		inDouble = false;
	for(var i = 0; i < inner.length; i++) {
		var ch = inner[i];
		if(ch === "\\" && inDouble) {
			current += ch + (inner[i + 1] || "");
			i++;
			continue;
		}
		if(ch === '"' && !inSingle) {
			inDouble = !inDouble;
			current += ch;
			continue;
		}
		if(ch === "'" && !inDouble) {
			inSingle = !inSingle;
			current += ch;
			continue;
		}
		if(!inSingle && !inDouble) {
			if(ch === "[" || ch === "{") {
				depth++;
			} else if(ch === "]" || ch === "}") {
				depth--;
			} else if(ch === "," && depth === 0) {
				items.push(parseScalar(current.trim()));
				current = "";
				continue;
			}
		}
		current += ch;
	}
	if(current.trim() !== "") {
		items.push(parseScalar(current.trim()));
	}
	return items;
}

// -- Flow mapping parser: {key: value, ...} --

function parseFlowMapping(str) {
	var inner = str.slice(1, -1).trim();
	if(inner === "") {
		return {};
	}
	var result = Object.create(null),
		pairs = [],
		current = "",
		depth = 0,
		inSingle = false,
		inDouble = false;
	for(var i = 0; i < inner.length; i++) {
		var ch = inner[i];
		if(ch === "\\" && inDouble) {
			current += ch + (inner[i + 1] || "");
			i++;
			continue;
		}
		if(ch === '"' && !inSingle) {
			inDouble = !inDouble;
			current += ch;
			continue;
		}
		if(ch === "'" && !inDouble) {
			inSingle = !inSingle;
			current += ch;
			continue;
		}
		if(!inSingle && !inDouble) {
			if(ch === "[" || ch === "{") {
				depth++;
			} else if(ch === "]" || ch === "}") {
				depth--;
			} else if(ch === "," && depth === 0) {
				pairs.push(current.trim());
				current = "";
				continue;
			}
		}
		current += ch;
	}
	if(current.trim() !== "") {
		pairs.push(current.trim());
	}
	for(var p = 0; p < pairs.length; p++) {
		var colonIdx = pairs[p].indexOf(":");
		if(colonIdx !== -1) {
			var key = pairs[p].slice(0, colonIdx).trim(),
				val = pairs[p].slice(colonIdx + 1).trim();
			result[parseScalar(key)] = parseScalar(val);
		}
	}
	return result;
}

// -- Block parser (indentation-based) --

/*
Parse block YAML from an array of {indent, raw} line objects.
Returns the parsed value (object, array, or scalar).
*/
function parseBlock(lines, start, baseIndent) {
	if(start >= lines.length) {
		return {value: null, nextIndex: start};
	}
	var firstLine = lines[start];
	// Block sequence: lines starting with "- "
	if(firstLine.raw.indexOf("- ") === 0 || firstLine.raw === "-") {
		return parseBlockSequence(lines, start, firstLine.indent);
	}
	// Block mapping: lines containing ":"
	if(firstLine.raw.indexOf(":") !== -1) {
		return parseBlockMapping(lines, start, firstLine.indent);
	}
	// Bare scalar
	return {value: parseScalar(firstLine.raw), nextIndex: start + 1};
}

function parseBlockSequence(lines, start, seqIndent) {
	var result = [],
		i = start;
	while(i < lines.length && lines[i].indent === seqIndent && (lines[i].raw.indexOf("- ") === 0 || lines[i].raw === "-")) {
		var itemRaw = lines[i].raw.slice(2); // After "- "
		// Check for inline flow value
		var trimmed = itemRaw.trim();
		if(trimmed[0] === "[") {
			result.push(parseFlowSequence(trimmed));
			i++;
		} else if(trimmed[0] === "{") {
			result.push(parseFlowMapping(trimmed));
			i++;
		} else if(trimmed === "" || trimmed === undefined) {
			// Multi-line block item — collect indented children
			i++;
			var childLines = [];
			while(i < lines.length && lines[i].indent > seqIndent) {
				childLines.push(lines[i]);
				i++;
			}
			if(childLines.length > 0) {
				var parsed = parseBlock(childLines, 0, childLines[0].indent);
				result.push(parsed.value);
			} else {
				result.push(null);
			}
		} else if(trimmed.indexOf(":") !== -1 && !isQuotedColonValue(trimmed)) {
			// Inline mapping start as sequence item
			// Collect this line (re-indented) plus any deeper-indented children
			var mappingLines = [{indent: seqIndent + 2, raw: trimmed}];
			i++;
			while(i < lines.length && lines[i].indent > seqIndent) {
				mappingLines.push(lines[i]);
				i++;
			}
			var parsedMap = parseBlock(mappingLines, 0, mappingLines[0].indent);
			result.push(parsedMap.value);
		} else {
			result.push(parseScalar(trimmed));
			i++;
		}
	}
	return {value: result, nextIndex: i};
}

function isQuotedColonValue(str) {
	// Check if the colon is inside quotes (meaning it's a scalar, not a mapping)
	var colonIdx = str.indexOf(":");
	if(colonIdx === -1) {
		return false;
	}
	// If the value starts with a quote and the colon is inside, it's a quoted scalar
	if((str[0] === '"' || str[0] === "'") && colonIdx > 0) {
		var quote = str[0];
		var closeIdx = str.indexOf(quote, 1);
		if(closeIdx > colonIdx) {
			return true;
		}
	}
	return false;
}

function parseBlockMapping(lines, start, mapIndent) {
	var result = Object.create(null),
		i = start;
	while(i < lines.length && lines[i].indent === mapIndent) {
		var line = lines[i].raw,
			colonIdx = line.indexOf(":");
		if(colonIdx === -1) {
			break;
		}
		var key = line.slice(0, colonIdx).trim(),
			valRaw = line.slice(colonIdx + 1).trim();
		if(valRaw !== "") {
			// Inline value
			if(valRaw[0] === "[") {
				result[key] = parseFlowSequence(valRaw);
			} else if(valRaw[0] === "{") {
				result[key] = parseFlowMapping(valRaw);
			} else {
				result[key] = parseScalar(valRaw);
			}
			i++;
		} else {
			// Block value on subsequent indented lines
			i++;
			var childLines = [];
			while(i < lines.length && lines[i].indent > mapIndent) {
				childLines.push(lines[i]);
				i++;
			}
			if(childLines.length > 0) {
				var parsed = parseBlock(childLines, 0, childLines[0].indent);
				result[key] = parsed.value;
			} else {
				result[key] = null;
			}
		}
	}
	return {value: result, nextIndex: i};
}

// -- Main API --

/*
Parse a YAML string into a JavaScript value.
Compatible with js-yaml's load() function.
Handles the subset of YAML used in frontmatter:
scalars, flow/block arrays, flow/block mappings, nested maps.
*/
function load(text) {
	if(typeof text !== "string") {
		throw new YAMLException("Input must be a string");
	}
	text = text.trim();
	if(text === "") {
		return null;
	}
	// Tokenise into lines with indent tracking
	var rawLines = text.split(/\r?\n/),
		lines = [];
	for(var i = 0; i < rawLines.length; i++) {
		var raw = rawLines[i];
		// Skip blank lines and comment-only lines
		var trimmed = raw.trim();
		if(trimmed === "" || trimmed[0] === "#") {
			continue;
		}
		var indent = 0;
		while(indent < raw.length && raw[indent] === " ") {
			indent++;
		}
		lines.push({indent: indent, raw: trimmed});
	}
	if(lines.length === 0) {
		return null;
	}
	// Single-line flow values
	if(lines.length === 1) {
		var single = lines[0].raw;
		if(single[0] === "[") {
			return parseFlowSequence(single);
		}
		if(single[0] === "{") {
			return parseFlowMapping(single);
		}
	}
	var parsed = parseBlock(lines, 0, lines[0].indent);
	return parsed.value;
}

/*
Serialise a JavaScript value to a YAML string.
Compatible with js-yaml's dump() function.
Handles the subset of YAML used in frontmatter.
*/
function dump(obj, options) {
	options = options || {};
	var indent = options.indent || 2;
	return dumpValue(obj, 0, indent);
}

function dumpValue(val, level, indentSize) {
	if(val === null || val === undefined) {
		return "null";
	}
	if(typeof val === "boolean") {
		return val ? "true" : "false";
	}
	if(typeof val === "number") {
		if(val !== val) { return ".nan"; }
		if(val === Infinity) { return ".inf"; }
		if(val === -Infinity) { return "-.inf"; }
		return String(val);
	}
	if(typeof val === "string") {
		return dumpString(val);
	}
	if(Array.isArray(val)) {
		return dumpArray(val, level, indentSize);
	}
	if(typeof val === "object") {
		return dumpObject(val, level, indentSize);
	}
	return String(val);
}

function dumpString(str) {
	// Use plain style if safe, otherwise double-quote
	if(str === "") {
		return "''";
	}
	if(/^[\w][\w\s\-\.\/]*$/.test(str) &&
	   str !== "true" && str !== "false" && str !== "null" &&
	   str !== "True" && str !== "False" && str !== "Null" &&
	   str !== "TRUE" && str !== "FALSE" && str !== "NULL" &&
	   !/^-?\d/.test(str)) {
		return str;
	}
	// Double-quote with escaping
	return '"' + str.replace(/\\/g, "\\\\")
		.replace(/"/g, '\\"')
		.replace(/\n/g, "\\n")
		.replace(/\r/g, "\\r")
		.replace(/\t/g, "\\t") + '"';
}

function dumpArray(arr, level, indentSize) {
	if(arr.length === 0) {
		return "[]";
	}
	var prefix = repeat(" ", level * indentSize);
	var lines = [];
	for(var i = 0; i < arr.length; i++) {
		var val = dumpValue(arr[i], level + 1, indentSize);
		if(typeof arr[i] === "object" && arr[i] !== null && !Array.isArray(arr[i])) {
			// Object items: first key on same line as dash, rest indented
			var objLines = val.split("\n");
			lines.push(prefix + "- " + objLines[0]);
			for(var j = 1; j < objLines.length; j++) {
				lines.push(prefix + "  " + objLines[j]);
			}
		} else {
			lines.push(prefix + "- " + val);
		}
	}
	return "\n" + lines.join("\n");
}

function dumpObject(obj, level, indentSize) {
	var keys = Object.keys(obj);
	if(keys.length === 0) {
		return "{}";
	}
	var prefix = repeat(" ", level * indentSize);
	var lines = [];
	for(var i = 0; i < keys.length; i++) {
		var key = keys[i],
			val = obj[key];
		var dumpedVal = dumpValue(val, level + 1, indentSize);
		if((typeof val === "object" && val !== null) &&
		   ((Array.isArray(val) && val.length > 0) || (!Array.isArray(val) && Object.keys(val).length > 0))) {
			lines.push(prefix + dumpString(key) + ":" + dumpedVal);
		} else {
			lines.push(prefix + dumpString(key) + ": " + dumpedVal);
		}
	}
	return lines.join("\n");
}

function repeat(str, count) {
	var result = "";
	for(var i = 0; i < count; i++) {
		result += str;
	}
	return result;
}

exports.load = load;
exports.dump = dump;
exports.YAMLException = YAMLException;
