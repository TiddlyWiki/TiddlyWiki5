/*\
title: test-prosemirror-editor-mapping.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the deliberately narrow editor mapping contract.
\*/

"use strict";

describe("ProseMirror editor mapping", function() {
	it("maps WikiText, but not Markdown or arbitrary content types", function() {
		expect($tw.wiki.getTiddlerText("$:/config/EditorTypeMappings/text/vnd.tiddlywiki")).toBe("prosemirror");
		expect($tw.wiki.getTiddlerText("$:/config/EditorTypeMappings/text/markdown")).toBeUndefined();
		expect($tw.wiki.getTiddlerText("$:/config/EditorTypeMappings/application/x-unknown")).toBeUndefined();
	});

	it("keeps editor selection generic and delegates environment fallback to the mapped widget", function() {
		const EditWidget = require("$:/core/modules/widgets/edit.js").edit;
		const wiki = new $tw.Wiki();
		wiki.addTiddler({
			title: "$:/config/EditorTypeMappings/text/vnd.tiddlywiki",
			text: "prosemirror"
		});
		wiki.addTiddler({
			title: "MappingTest",
			text: "Hello world",
			type: "text/vnd.tiddlywiki"
		});
		const widget = {
			wiki: wiki,
			editTitle: "MappingTest",
			editField: "text"
		};

		expect(EditWidget.prototype.getEditorType.call(widget)).toBe("prosemirror");
		expect(require("$:/plugins/tiddlywiki/prosemirror/core/widget-loader.js")["edit-prosemirror"]).toBeDefined();
	});
});
