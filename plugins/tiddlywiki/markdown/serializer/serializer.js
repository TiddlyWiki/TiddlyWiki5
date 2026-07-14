/*\
title: $:/plugins/tiddlywiki/markdown/serializer/serializer.js
type: application/javascript
module-type: tiddlerserializer

Serialize markdown tiddlers with YAML-like frontmatter.

\*/

"use strict";

const frontmatter = require("$:/plugins/tiddlywiki/markdown/serializer/frontmatter-utils.js");

function serializeMarkdown(tiddler) {
	return frontmatter.serializeMarkdownTiddler(tiddler);
}

exports["text/x-markdown"] = serializeMarkdown;
exports["text/markdown"] = serializeMarkdown;
