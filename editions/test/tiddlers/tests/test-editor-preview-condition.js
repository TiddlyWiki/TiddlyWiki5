/*\
title: test-editor-preview-condition.js
type: application/javascript
tags: [[$:/tags/test-spec]]

The preview dropdown is shared by all text editors. Conditional entries must
not hide the ordinary previews or introduce paragraph wrappers in the popup.

\*/

"use strict";

describe("Editor preview conditions", function() {
	function makeWiki() {
		const wiki = new $tw.Wiki();
		wiki.addTiddlers([
			{
				title: "$:/core/ui/EditorToolbar/preview-type-dropdown",
				text: $tw.wiki.getTiddlerText("$:/core/ui/EditorToolbar/preview-type-dropdown")
			},
			{title: "AlwaysPreview",tags: "$:/tags/EditPreview",caption: "Always caption"},
			{title: "CustomPreview",tags: "$:/tags/EditPreview",caption: "Custom caption",condition: "[<tv-editor-type>match[custom]]"},
			{title: "NeverPreview",tags: "$:/tags/EditPreview",caption: "Never caption",condition: "[<tv-editor-type>match[missing]]"},
			{title: "DraftPreview",tags: "$:/tags/EditPreview",caption: "Draft caption","draft.of": "AnotherPreview"}
		]);
		return wiki;
	}

	function render(wiki, editorType) {
		return wiki.renderText("text/html","text/vnd.tiddlywiki",
			'<$let tv-editor-type="' + editorType + '"><$transclude tiddler="$:/core/ui/EditorToolbar/preview-type-dropdown"/></$let>',
			{parseAsInline: true});
	}

	it("keeps unconditional previews available to the default editor", function() {
		const html = render(makeWiki(),"text");
		expect(html).toContain("Always caption");
		expect(html).not.toContain("Custom caption");
		expect(html).not.toContain("Never caption");
		expect(html).not.toContain("Draft caption");
	});

	it("uses editor context to show matching conditional previews", function() {
		const html = render(makeWiki(),"custom");
		expect(html).toContain("Always caption");
		expect(html).toContain("Custom caption");
		expect(html).not.toContain("Never caption");
	});

	it("keeps ordinary previews when editor context is absent", function() {
		const html = render(makeWiki(),"");
		expect(html).toContain("Always caption");
		expect(html).not.toContain("Custom caption");
	});

	it("renders entries as inline anchors without paragraph wrappers", function() {
		const html = render(makeWiki(),"custom");
		expect((html.match(/<a\b/g) || []).length).toBe(2);
		expect(html).not.toMatch(/<p\b/);
	});

	it("shows the selected preview checkmark without changing available entries", function() {
		const wiki = makeWiki();
		wiki.addTiddler({title: "$:/state/editpreviewtype",text: "CustomPreview"});
		const html = render(wiki,"custom");
		expect(html).toContain("Always caption");
		expect(html).toContain("Custom caption");
		expect((html.match(/\u2713/g) || []).length).toBe(1);
	});
});
