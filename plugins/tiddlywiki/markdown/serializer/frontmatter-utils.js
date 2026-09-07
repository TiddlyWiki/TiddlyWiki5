/*\
title: $:/plugins/tiddlywiki/markdown/serializer/frontmatter-utils.js
type: application/javascript
module-type: library

Utility functions for parsing and serialising markdown frontmatter.

\*/

"use strict";

const DEFAULT_LIST_FIELDS = {
	tags: true,
	list: true,
	aliases: true,
	cssclasses: true
};

function parseScalarValue(value) {
	const trimmed = (value || "").trim();
	if(!trimmed) {
		return "";
	}
	if(trimmed.charAt(0) === '"' && trimmed.charAt(trimmed.length - 1) === '"' && trimmed.length >= 2) {
		return trimmed.substring(1,trimmed.length - 1)
			.replace(/\\"/g,'"')
			.replace(/\\\\/g,"\\");
	}
	if(trimmed.charAt(0) === "'" && trimmed.charAt(trimmed.length - 1) === "'" && trimmed.length >= 2) {
		return trimmed.substring(1,trimmed.length - 1).replace(/''/g,"'");
	}
	return trimmed;
}

function shouldQuoteValue(value) {
	return value === "" ||
		/^\s|\s$/.test(value) ||
		/[:#\r\n]/.test(value) ||
		/^---$/.test(value) ||
		/^(?:true|false|null|~|yes|no|on|off)$/i.test(value) ||
		/^-?\d+(?:\.\d+)?$/.test(value);
}

function quoteValue(value) {
	if(shouldQuoteValue(value)) {
		return '"' + value.replace(/\\/g,"\\\\").replace(/"/g,'\\"') + '"';
	}
	return value;
}

exports.parseFrontmatter = function(text) {
	const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n)?/.exec(text || "");
	if(!match) {
		return null;
	}
	let body = (text || "").substring(match[0].length);
	if(/^\r?\n/.test(body)) {
		body = body.replace(/^\r?\n/,"");
	}
	return {
		fields: exports.parseYamlLikeFields(match[1]),
		body: body
	};
};

exports.parseYamlLikeFields = function(yamlText) {
	const lines = (yamlText || "").split(/\r?\n/mg),
		fields = Object.create(null);
	for(let index = 0; index < lines.length; index++) {
		const line = lines[index],
			trimmed = line.trim();
		if(!trimmed || trimmed.charAt(0) === "#") {
			continue;
		}
		const scalarMatch = /^([^:\s][^:]*):(.*)$/.exec(line);
		if(!scalarMatch) {
			continue;
		}
		const fieldName = scalarMatch[1].trim(),
			remainder = scalarMatch[2].trim();
		if(remainder) {
			fields[fieldName] = parseScalarValue(remainder);
			continue;
		}
		const listItems = [];
		while(index + 1 < lines.length) {
			const nextLine = lines[index + 1],
				nextTrimmed = nextLine.trim(),
				listItemMatch = /^\s*-\s*(.*)$/.exec(nextLine);
			if(!nextTrimmed || nextTrimmed.charAt(0) === "#") {
				index++;
				continue;
			}
			if(!listItemMatch) {
				break;
			}
			listItems.push(parseScalarValue(listItemMatch[1]));
			index++;
		}
		fields[fieldName] = listItems.length ? $tw.utils.stringifyList(listItems) : "";
	}
	return fields;
};

exports.stringifyYamlLikeFields = function(fields,options) {
	options = options || {};
	const listFields = options.listFields || DEFAULT_LIST_FIELDS,
		lines = [];
	$tw.utils.each(Object.keys(fields || {}).sort(),function(fieldName) {
		const value = fields[fieldName];
		if(value === undefined || value === null) {
			return;
		}
		const asString = String(value);
		if(listFields[fieldName]) {
			const items = $tw.utils.parseStringArray(asString);
			if(items.length > 0) {
				lines.push(fieldName + ":");
				$tw.utils.each(items,function(item) {
					lines.push("  - " + quoteValue(item));
				});
				return;
			}
		}
		lines.push(fieldName + ": " + quoteValue(asString));
	});
	return lines.join("\n");
};

exports.serializeMarkdownTiddler = function(tiddler,options) {
	const fields = tiddler.getFieldStrings({exclude: ["text","bag"]}),
		frontmatter = exports.stringifyYamlLikeFields(fields,options),
		body = tiddler.fields.text || "";
	return "---\n" + frontmatter + "\n---\n\n" + body;
};
