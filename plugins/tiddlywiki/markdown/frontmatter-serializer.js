/*\
title: $:/plugins/tiddlywiki/markdown/frontmatter-serializer.js
type: application/javascript
module-type: tiddlerserializer

Markdown serializer with YAML frontmatter.

Inverse of `frontmatter-deserializer.js`. Given a tiddler, returns a
Markdown file body whose first lines are a YAML frontmatter block
(`---` … `---`), followed by the tiddler's `text` field.

Field handling:
- `title` is always emitted (frontmatter wins over filename when reloaded).
- `text` is the body; not emitted in the frontmatter.
- `created`, `modified` are skipped (TiddlyWiki manages timestamps via filesystem).
- `type` is skipped when it equals `text/x-markdown` (the default for `.md` files).
- `bag`, `revision` are skipped (sync metadata, not authored content).
- List fields (those with a registered `stringify` method) are emitted as YAML arrays.
- All other fields are emitted as YAML strings (preserving their on-disk type).

\*/
"use strict";

var yaml = require("$:/plugins/tiddlywiki/markdown/yaml.js");

// Field names to skip when emitting frontmatter
var SKIP_FIELDS = {
	text: true,
	created: true,
	modified: true,
	bag: true,
	revision: true
};

function serialize(tiddler) {
	if(!tiddler) {
		return "";
	}
	var fields = tiddler.fields || {},
		frontmatter = Object.create(null);
	// Always include title first
	if(fields.title) {
		frontmatter.title = fields.title;
	}
	// Add other fields
	$tw.utils.each(fields,function(value,name) {
		if(SKIP_FIELDS[name] || name === "title") {
			return;
		}
		if(name === "type" && value === "text/x-markdown") {
			return;
		}
		// List fields → YAML arrays
		if($tw.Tiddler.fieldModules[name] && $tw.Tiddler.fieldModules[name].stringify) {
			var items;
			if(Array.isArray(value)) {
				items = value.slice();
			} else {
				items = $tw.utils.parseStringArray(value || "") || [];
			}
			frontmatter[name] = items;
		} else if(typeof value === "string") {
			frontmatter[name] = value;
		} else {
			// Fallback: stringify whatever it is
			frontmatter[name] = String(value);
		}
	});
	var body = fields.text || "";
	var hasFrontmatter = Object.keys(frontmatter).length > 0;
	if(!hasFrontmatter) {
		return body;
	}
	return "---\n" + yaml.dump(frontmatter) + "\n---\n\n" + body;
}

// Register under both types — text/markdown is what the "New Markdown" button
// sets; text/x-markdown is what the deserializer uses after content-type
// resolution for .md files loaded from disk.
exports["text/x-markdown"] = serialize;
exports["text/markdown"] = serialize;
