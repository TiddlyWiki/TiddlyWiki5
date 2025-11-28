/*\
title: $:/plugins/tiddlywiki/prosemirror/widget-block/utils.js
type: application/javascript
module-type: library

Widget/Procedure block parser and recognizer for ProseMirror

\*/

"use strict";

/**
 * Parse a widget invocation string
 * @param {string} text - The text to parse, e.g. `<<list-links "[tag[task]sort[title]]">>`
 * @returns {object|null} - Parsed widget object or null if not a valid widget
 */
function parseWidget(text) {
	// Match pattern: <<widgetName attributes>>
	const widgetPattern = /^<<\s*([a-zA-Z_][a-zA-Z0-9_-]*)\s*(.*)>>$/;
	const match = text.trim().match(widgetPattern);
	
	if(!match) {
		return null;
	}
	
	const widgetName = match[1];
	const attributesStr = match[2].trim();
	
	// For now, we'll do simple parsing of attributes
	// We'll handle the specific case: <<list-links "[tag[task]sort[title]]">>
	const attributes = parseAttributes(attributesStr);
	
	return {
		type: "widget",
		widgetName: widgetName,
		attributes: attributes,
		rawText: text.trim()
	};
}

/**
 * Parse widget attributes
 * For now, this is a simple implementation that handles quoted strings and identifiers
 * @param {string} str - The attributes string
 * @returns {object} - Parsed attributes as key-value pairs
 */
function parseAttributes(str) {
	const attributes = {};
	
	if(!str) {
		return attributes;
	}
	
	// Try to match patterns like: "value" or key="value" or key=value
	const attrPattern = /(?:([a-zA-Z_][a-zA-Z0-9_-]*)=)?(?:"([^"]*)"|'([^']*)'|([^\s]+))/g;
	let match;
	let paramIndex = 0;
	
	while((match = attrPattern.exec(str)) !== null) {
		const key = match[1];
		const value = match[2] || match[3] || match[4];
		
		if(key) {
			attributes[key] = value;
		} else {
			// Positional argument
			attributes[`param${paramIndex}`] = value;
			paramIndex++;
		}
	}
	
	return attributes;
}

/**
 * Check if a line contains a widget invocation
 * @param {string} line - The line text
 * @returns {object|null} - Parsed widget or null
 */
function recognizeWidget(line) {
	return parseWidget(line);
}

exports.parseWidget = parseWidget;
exports.parseAttributes = parseAttributes;
exports.recognizeWidget = recognizeWidget;
