/*\
title: $:/plugins/tiddlywiki/markdown/frontmatter-deserializer.js
type: application/javascript
module-type: tiddlerdeserializer

Markdown deserializer with YAML frontmatter extraction.

Parses YAML frontmatter delimited by `---` markers and maps extracted
values to tiddler fields. Array values on list fields (tags, list, any
field with a registered `stringify` method) are converted to TiddlyWiki
bracketed lists. Non-string, non-array values are stored as their JSON
representation.

`created` and `modified` in the frontmatter are accepted in either
TiddlyWiki's native `YYYYMMDDHHMMSSmmm` UTC format or any ISO-8601
string that `Date()` can parse; both are normalised to TW's native
format. Values that cannot be parsed are dropped.

\*/
"use strict";

var yaml = require("$:/plugins/tiddlywiki/markdown/yaml.js");

function deserialize(text,fields) {
	var result = Object.create(null),
		body = text,
		frontmatter = null;
	// Copy incoming fields (e.g. from .meta file or filename)
	for(var f in fields) {
		result[f] = fields[f];
	}
	// Extract YAML frontmatter if present
	if(text.indexOf("---") === 0) {
		var endMarker = text.indexOf("\n---",3);
		if(endMarker !== -1) {
			var yamlText = text.substring(3,endMarker).trim();
			// Body starts after the closing --- and its newline
			var afterMarker = endMarker + 4;
			if(text[afterMarker] === "\n") {
				afterMarker++;
			} else if(text[afterMarker] === "\r" && text[afterMarker + 1] === "\n") {
				afterMarker += 2;
			}
			// Skip one blank line if present (conventional separator between frontmatter and body)
			if(text[afterMarker] === "\n") {
				afterMarker++;
			} else if(text[afterMarker] === "\r" && text[afterMarker + 1] === "\n") {
				afterMarker += 2;
			}
			body = text.substring(afterMarker);
			try {
				frontmatter = yaml.load(yamlText);
			} catch(e) {
				// If YAML parsing fails, treat the whole text as body
				body = text;
				frontmatter = null;
			}
		}
	}
	// Map frontmatter fields to tiddler fields
	if(frontmatter && typeof frontmatter === "object" && !Array.isArray(frontmatter)) {
		var keys = Object.keys(frontmatter);
		for(var i = 0; i < keys.length; i++) {
			var key = keys[i],
				value = frontmatter[key];
			// Apply field collision policy
			if(key === "created" || key === "modified") {
				var normalised = normaliseDate(value);
				if(normalised !== null) {
					result[key] = normalised;
				}
				continue;
			}
			if(key === "tags" && result[key]) {
				// Merge: parse existing tags, add new ones
				result[key] = mergeTagValue(result[key],value);
				continue;
			}
			result[key] = fieldValueToString(key,value);
		}
	}
	result.text = body;
	if(!result.type) {
		result.type = "text/x-markdown";
	}
	return [result];
}

// Register under both types — text/x-markdown is the deserializer type
// registered for .md file extensions; text/markdown is the raw content type.
exports["text/x-markdown"] = deserialize;
exports["text/markdown"] = deserialize;

/*
Convert a parsed YAML value to a tiddler field string.
- Arrays on list fields (tags, list, etc.) → TW bracketed list format
- Strings → as-is
- Everything else → JSON
*/
function fieldValueToString(key,value) {
	if(value === null || value === undefined) {
		return "";
	}
	if(typeof value === "string") {
		return value;
	}
	if(Array.isArray(value)) {
		// Check if this field has a stringify method (i.e. it's a list field)
		if($tw.Tiddler.fieldModules[key] && $tw.Tiddler.fieldModules[key].stringify) {
			var stringItems = [];
			for(var i = 0; i < value.length; i++) {
				stringItems.push(value[i] == null ? "" : String(value[i]));
			}
			return $tw.utils.stringifyList(stringItems);
		}
		return JSON.stringify(value);
	}
	if(typeof value === "object") {
		return JSON.stringify(value);
	}
	return String(value);
}

/*
Normalise a frontmatter date value to TiddlyWiki's YYYYMMDDHHMMSSmmm UTC
format. Accepts TW native strings (14 or 17 digits, optional leading "-"
for negative years) and anything `Date()` can parse (ISO 8601, RFC 2822,
Date objects). Returns null if the value cannot be interpreted as a date.
*/
function normaliseDate(value) {
	if(value === null || value === undefined) {
		return null;
	}
	if(typeof value === "string") {
		if(/^-?\d{14}$/.test(value)) {
			return value + "000";
		}
		if(/^-?\d{17}$/.test(value)) {
			return value;
		}
		var d = new Date(value);
		if(!isNaN(d.getTime())) {
			return $tw.utils.stringifyDate(d);
		}
		return null;
	}
	if(value instanceof Date && !isNaN(value.getTime())) {
		return $tw.utils.stringifyDate(value);
	}
	return null;
}

/*
Merge incoming tag value with existing tags string.
The incoming value may be a string (TW bracketed list) or an array (from YAML).
*/
function mergeTagValue(existing,incoming) {
	var existingTags = $tw.utils.parseStringArray(existing) || [];
	var newTags;
	if(Array.isArray(incoming)) {
		newTags = incoming.map(function(t) { return t == null ? "" : String(t); });
	} else if(typeof incoming === "string") {
		newTags = $tw.utils.parseStringArray(incoming) || [];
	} else {
		return existing;
	}
	var seen = Object.create(null);
	for(var i = 0; i < existingTags.length; i++) {
		seen[existingTags[i]] = true;
	}
	for(var j = 0; j < newTags.length; j++) {
		if(!seen[newTags[j]]) {
			existingTags.push(newTags[j]);
			seen[newTags[j]] = true;
		}
	}
	return $tw.utils.stringifyList(existingTags);
}
