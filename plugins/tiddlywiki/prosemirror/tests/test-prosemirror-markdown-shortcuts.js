/*\
title: test-prosemirror-markdown-shortcuts.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests for Markdown shortcut enablement defaults in ProseMirror.

\*/

"use strict";

describe("ProseMirror markdown shortcut defaults", function() {
	let buildSchema, markdownShortcuts;
	try {
		buildSchema = require("$:/plugins/tiddlywiki/prosemirror/core/schema.js").buildSchema;
		markdownShortcuts = require("$:/plugins/tiddlywiki/prosemirror/features/markdown-shortcuts.js");
	} catch(e) {
		return;
	}

	function makeWiki(config) {
		return {
			getTiddlerText: function(title, defaultText) {
				return Object.prototype.hasOwnProperty.call(config, title) ? config[title] : defaultText;
			}
		};
	}

	it("should keep markdown-style shortcuts opt-in for every content type", function() {
		const wiki = makeWiki({});
		expect(markdownShortcuts.shouldEnableMarkdownShortcuts(wiki, "text/markdown")).toBe(false);
		expect(markdownShortcuts.getMarkdownInputRules(wiki, buildSchema(), "text/markdown").length).toBe(0);
	});

	it("should keep markdown shortcuts disabled by default for wikitext tiddlers", function() {
		const wiki = makeWiki({});
		expect(markdownShortcuts.shouldEnableMarkdownShortcuts(wiki, "text/vnd.tiddlywiki")).toBe(false);
		expect(markdownShortcuts.getMarkdownInputRules(wiki, buildSchema(), "text/vnd.tiddlywiki").length).toBe(0);
	});

	it("should keep an explicit no setting disabled", function() {
		const wiki = makeWiki({
			"$:/config/prosemirror/markdown-shortcuts": "no"
		});
		expect(markdownShortcuts.shouldEnableMarkdownShortcuts(wiki, "text/x-markdown")).toBe(false);
	});

	it("should allow explicitly enabling markdown shortcuts for all editor types", function() {
		const wiki = makeWiki({
			"$:/config/prosemirror/markdown-shortcuts": "yes"
		});
		expect(markdownShortcuts.shouldEnableMarkdownShortcuts(wiki, "text/vnd.tiddlywiki")).toBe(true);
		expect(markdownShortcuts.getMarkdownInputRules(wiki, buildSchema(), "text/vnd.tiddlywiki").length).toBeGreaterThan(0);
	});
});
