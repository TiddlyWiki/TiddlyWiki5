/*\
title: test-prosemirror-editor-mapping.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests for editor type fallback integration with ProseMirror mapping.
\*/

"use strict";

describe("ProseMirror editor mapping fallback", function() {
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
});