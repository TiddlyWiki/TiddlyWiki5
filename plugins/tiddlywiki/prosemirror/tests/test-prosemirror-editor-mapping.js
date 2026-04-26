/*\
title: test-prosemirror-editor-mapping.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests for editor type fallback integration with ProseMirror mapping.
\*/

"use strict";

describe("ProseMirror editor mapping fallback", function() {
	function withBrowserFlag(value, callback) {
		var originalBrowser = $tw.browser;
		$tw.browser = value;
		try {
			callback();
		} finally {
			$tw.browser = originalBrowser;
		}
	}

	it("should fall back to text editor outside the browser when mapped to prosemirror", function() {
		var EditWidget = require("$:/core/modules/widgets/edit.js").edit;
		var wiki = new $tw.Wiki();
		wiki.addTiddler({
			title: "$:/config/EditorTypeMappings/text/vnd.tiddlywiki",
			text: "prosemirror"
		});
		wiki.addTiddler({
			title: "MappingFallbackTest",
			text: "Hello world",
			type: "text/vnd.tiddlywiki"
		});

		var widget = {
			wiki: wiki,
			editTitle: "MappingFallbackTest",
			editField: "text"
		};

		expect(EditWidget.prototype.getEditorType.call(widget)).toBe("text");
	});

	it("should fall back to text editor in the browser when a mapped parser is unavailable", function() {
		var EditWidget = require("$:/core/modules/widgets/edit.js").edit;
		var wiki = new $tw.Wiki();
		wiki.addTiddler({
			title: "$:/config/EditorTypeMappings/application/x-unknown",
			text: "prosemirror"
		});
		wiki.addTiddler({
			title: "MissingParserFallbackTest",
			text: "Hello world",
			type: "application/x-unknown"
		});

		var widget = {
			wiki: wiki,
			editTitle: "MissingParserFallbackTest",
			editField: "text"
		};

		withBrowserFlag(true,function() {
			expect(EditWidget.prototype.getEditorType.call(widget)).toBe("text");
		});
	});

	it("should use prosemirror in the browser for markdown when the parser is available", function() {
		var EditWidget = require("$:/core/modules/widgets/edit.js").edit;
		var wiki = new $tw.Wiki();
		wiki.addTiddler({
			title: "$:/config/EditorTypeMappings/text/markdown",
			text: "prosemirror"
		});
		wiki.addTiddler({
			title: "MarkdownMappingTest",
			text: "# Heading",
			type: "text/markdown"
		});

		var widget = {
			wiki: wiki,
			editTitle: "MarkdownMappingTest",
			editField: "text"
		};

		withBrowserFlag(true,function() {
			expect($tw.Wiki.parsers["text/markdown"]).toBeTruthy();
			expect(EditWidget.prototype.getEditorType.call(widget)).toBe("prosemirror");
		});
	});
});