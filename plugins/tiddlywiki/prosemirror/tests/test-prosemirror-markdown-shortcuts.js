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

	it("should enable markdown shortcuts by default for markdown tiddlers", function() {
		const wiki = makeWiki({});
		expect(markdownShortcuts.shouldEnableMarkdownShortcuts(wiki, "text/markdown")).toBe(true);
		expect(markdownShortcuts.getMarkdownInputRules(wiki, buildSchema(), "text/markdown").length).toBeGreaterThan(0);
	});

	it("should keep markdown shortcuts disabled by default for wikitext tiddlers", function() {
		const wiki = makeWiki({});
		expect(markdownShortcuts.shouldEnableMarkdownShortcuts(wiki, "text/vnd.tiddlywiki")).toBe(false);
		expect(markdownShortcuts.getMarkdownInputRules(wiki, buildSchema(), "text/vnd.tiddlywiki").length).toBe(0);
	});

	it("should allow disabling markdown auto-shortcuts for markdown tiddlers", function() {
		const wiki = makeWiki({
			"$:/config/prosemirror/markdown-shortcuts/auto-for-markdown": "no"
		});
		expect(markdownShortcuts.shouldEnableMarkdownShortcuts(wiki, "text/x-markdown")).toBe(false);
	});

	it("should allow explicitly enabling markdown shortcuts for all editor types", function() {
		const wiki = makeWiki({
			"$:/config/prosemirror/markdown-shortcuts": "yes",
			"$:/config/prosemirror/markdown-shortcuts/auto-for-markdown": "no"
		});
		expect(markdownShortcuts.shouldEnableMarkdownShortcuts(wiki, "text/vnd.tiddlywiki")).toBe(true);
		expect(markdownShortcuts.getMarkdownInputRules(wiki, buildSchema(), "text/vnd.tiddlywiki").length).toBeGreaterThan(0);
	});
});