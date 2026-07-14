/*\
title: $:/plugins/tiddlywiki/markdown/serializer/deserializer.js
type: application/javascript
module-type: tiddlerdeserializer

Deserialize markdown files that include YAML-like frontmatter.

\*/

"use strict";

const frontmatter = require("$:/plugins/tiddlywiki/markdown/serializer/frontmatter-utils.js");

function deserializeMarkdown(text,fields) {
	fields = fields || Object.create(null);
	const result = Object.create(null);
	const parsed = frontmatter.parseFrontmatter(text || "");
	$tw.utils.each(fields,function(value,name) {
		result[name] = value;
	});
	if(parsed) {
		$tw.utils.each(parsed.fields,function(value,name) {
			result[name] = value;
		});
		result.text = parsed.body;
	} else {
		result.text = text;
	}
	if(!result.type) {
		result.type = "text/x-markdown";
	}
	return [result];
}

exports["text/x-markdown"] = deserializeMarkdown;
exports["text/markdown"] = deserializeMarkdown;
