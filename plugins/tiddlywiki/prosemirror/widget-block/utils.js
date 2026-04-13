/*\
title: $:/plugins/tiddlywiki/prosemirror/widget-block/utils.js
type: application/javascript
module-type: library

Widget/Procedure block parser and recognizer for ProseMirror

\*/

"use strict";

function parseWidget(text) {
	const trimmed = (text || "").trim();
	if(!trimmed.startsWith("<<") || trimmed.length < 5) {
		return null;
	}
	// Scan past the opening <<
	let pos = 2;
	// Skip whitespace
	while(pos < trimmed.length && /\s/.test(trimmed[pos])) pos++;
	// Read widget/macro name: [a-zA-Z_][a-zA-Z0-9_-]*
	const nameStart = pos;
	if(pos < trimmed.length && /[a-zA-Z_]/.test(trimmed[pos])) {
		pos++;
		while(pos < trimmed.length && /[a-zA-Z0-9_-]/.test(trimmed[pos])) pos++;
	}
	const widgetName = trimmed.substring(nameStart, pos);
	if(!widgetName) return null;
	// Skip whitespace
	while(pos < trimmed.length && /\s/.test(trimmed[pos])) pos++;
	// Now scan for the closing >> that is NOT inside quotes.
	// Collect the attribute portion.
	const attrStart = pos;
	const closingPos = scanForClosingBrackets(trimmed, pos);
	if(closingPos === -1) return null;
	const attributesStr = trimmed.substring(attrStart, closingPos).trim();
	const attributes = parseAttributes(attributesStr);
	return {
		type: "widget",
		widgetName: widgetName,
		attributes: attributes,
		rawText: trimmed
	};
}

function scanForClosingBrackets(str, start) {
	let pos = start;
	while(pos < str.length - 1) {
		const ch = str[pos];
		// Triple-double-quote delimiter: """..."""
		if(ch === '"' && str[pos + 1] === '"' && str[pos + 2] === '"') {
			pos += 3;
			while(pos < str.length - 2) {
				if(str[pos] === '"' && str[pos + 1] === '"' && str[pos + 2] === '"') {
					pos += 3;
					break;
				}
				pos++;
			}
			continue;
		}
		// Double-quote string
		if(ch === '"') {
			pos++;
			while(pos < str.length && str[pos] !== '"') {
				if(str[pos] === "\\") pos++; // skip escaped char
				pos++;
			}
			pos++; // skip closing quote
			continue;
		}
		// Single-quote string
		if(ch === "'") {
			pos++;
			while(pos < str.length && str[pos] !== "'") {
				if(str[pos] === "\\") pos++;
				pos++;
			}
			pos++;
			continue;
		}
		// Check for >>
		if(ch === ">" && str[pos + 1] === ">") {
			return pos;
		}
		pos++;
	}
	return -1;
}

function parseAttributes(str) {
	const attributes = {};
	if(!str) return attributes;
	let pos = 0;
	let paramIndex = 0;
	while(pos < str.length) {
		// Skip whitespace
		while(pos < str.length && /\s/.test(str[pos])) pos++;
		if(pos >= str.length) break;
		// Try to read key=value or key:"value" or key:'value'
		const keyMatch = str.substring(pos).match(/^([a-zA-Z_$][a-zA-Z0-9_$-]*)(?:[:=])/);
		if(keyMatch) {
			const key = keyMatch[1];
			pos += keyMatch[0].length;
			// Read the value
			const valueResult = readValue(str, pos);
			attributes[key] = valueResult.value;
			pos = valueResult.end;
		} else {
			// Positional argument — use numeric-only name to match TW's convention
			const valueResult = readValue(str, pos);
			if(valueResult.value !== null && valueResult.end > pos) {
				attributes[paramIndex + ""] = valueResult.value;
				paramIndex++;
				pos = valueResult.end;
			} else {
				// Skip a character to avoid infinite loop
				pos++;
			}
		}
	}
	return attributes;
}

function readValue(str, pos) {
	if(pos >= str.length) return { value: null, end: pos };
	// Triple-double-quote
	if(str[pos] === '"' && str[pos + 1] === '"' && str[pos + 2] === '"') {
		const start = pos + 3;
		let end = str.indexOf('"""', start);
		if(end === -1) end = str.length;
		return { value: str.substring(start, end), end: end + 3 };
	}
	// Double-quoted
	if(str[pos] === '"') {
		const start = pos + 1;
		let end = start;
		while(end < str.length && str[end] !== '"') {
			if(str[end] === "\\") end++;
			end++;
		}
		return { value: str.substring(start, end), end: end + 1 };
	}
	// Single-quoted
	if(str[pos] === "'") {
		const start = pos + 1;
		let end = start;
		while(end < str.length && str[end] !== "'") {
			if(str[end] === "\\") end++;
			end++;
		}
		return { value: str.substring(start, end), end: end + 1 };
	}
	// [[double bracket]]
	if(str[pos] === "[" && str[pos + 1] === "[") {
		const start = pos + 2;
		const end = str.indexOf("]]", start);
		if(end !== -1) {
			return { value: str.substring(start, end), end: end + 2 };
		}
	}
	// Unquoted: read until whitespace
	const start = pos;
	while(pos < str.length && !/\s/.test(str[pos])) pos++;
	return { value: str.substring(start, pos), end: pos };
}

function recognizeWidget(line) {
	return parseWidget(line);
}

exports.parseWidget = parseWidget;
exports.parseAttributes = parseAttributes;
exports.recognizeWidget = recognizeWidget;
