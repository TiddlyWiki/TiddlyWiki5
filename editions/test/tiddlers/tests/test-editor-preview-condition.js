/*\\
title: test-editor-preview-condition.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests that the preview-type dropdown respects the condition field on $:/tags/EditPreview tiddlers.

\\*/
"use strict";

describe("Preview type dropdown condition field", function() {

	function setupWiki() {
		var wiki = new $tw.Wiki({});
		wiki.addTiddlers([
			{ title: "AlwaysPreview", tags: "$:/tags/EditPreview", caption: "Always" },
			{ title: "CustomEditorOnlyPreview", tags: "$:/tags/EditPreview", caption: "Custom", condition: "[<tv-editor-type>match[custom]]" }
		]);
		wiki.addIndexersToWiki();
		return wiki;
	}

	function renderDropdown(wiki, editorType) {
		var parser = wiki.parseText("text/vnd.tiddlywiki",
			"<$set name=\"tv-editor-type\" value=\"" + editorType + "\"><$transclude tiddler=\"$:/core/ui/EditorToolbar/preview-type-dropdown\"/\u003e</$set\u003e");
		var widget = wiki.makeWidget(parser, { document: $tw.fakeDocument });
		var container = $tw.fakeDocument.createElement("div");
		widget.render(container, null);
		return container;
	}

	function textContent(container) {
		return (container.textContent || "").replace(/\s+/g, " ").trim();
	}

	it("should show all preview types when no condition is set", function() {
		var wiki = setupWiki();
		var container = renderDropdown(wiki, "text");
		var text = textContent(container);
		expect(text).toContain("Always");
		expect(text).not.toContain("Custom");
	});

	it("should show conditional preview types when the condition matches", function() {
		var wiki = setupWiki();
		var container = renderDropdown(wiki, "custom");
		var text = textContent(container);
		expect(text).toContain("Always");
		expect(text).toContain("Custom");
	});

});
