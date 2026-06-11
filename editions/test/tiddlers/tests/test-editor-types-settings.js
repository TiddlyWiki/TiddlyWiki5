/*\
title: test-editor-types-settings.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests Editor Types settings: default mappings and dropdown option discovery.

\*/

"use strict";

describe("Editor Types settings", function() {

	var wiki = $tw.wiki;
	var EDITOR_TYPES_TIDDLER = "$:/core/ui/ControlPanel/Settings/EditorTypes";

	function makeEditorTypesWidget(variables) {
		var parser = wiki.parseText("text/vnd.tiddlywiki", wiki.getTiddlerText(EDITOR_TYPES_TIDDLER));
		var widgetNode = wiki.makeWidget(parser, {variables: variables || {}});
		$tw.fakeDocument.setSequenceNumber(0);
		widgetNode.render($tw.fakeDocument.createElement("div"), null);
		return widgetNode;
	}

	function leafWidget(widgetNode) {
		var node = widgetNode;
		while (node.children.length > 0) {
			node = node.children[0];
		}
		return node;
	}

	function getProcedureFilter(widgetNode, name) {
		return leafWidget(widgetNode).getVariableInfo(name, {allowSelfAssigned: true}).text;
	}

	it("should provide default editor mappings for image and wikitext types", function() {
		expect(wiki.getTiddlerText("$:/config/EditorTypeMappings/image/png")).toBe("bitmap");
		expect(wiki.getTiddlerText("$:/config/EditorTypeMappings/text/vnd.tiddlywiki")).toBe("text");
	});

	function expectValidFilterResults(results) {
		expect(results.length).toBeGreaterThan(0);
		expect(results.join(",")).not.toMatch(/Filter Error/i);
	}

	it("should discover installed edit-* widget names for dropdown options", function() {
		var widgetNode = makeEditorTypesWidget();
		var results = wiki.filterTiddlers(getProcedureFilter(widgetNode, "editor-types-filter"));
		expectValidFilterResults(results);
		expect(results).toContain("text");
		expect(results).toContain("bitmap");
	});

	it("should combine current mapping with installed editor types for select options", function() {
		var widgetNode = makeEditorTypesWidget({mappingTiddler: "$:/config/EditorTypeMappings/image/png"});
		var results = wiki.filterTiddlers(getProcedureFilter(widgetNode, "editor-types-select-options"), leafWidget(widgetNode));
		expectValidFilterResults(results);
		expect(results).toContain("bitmap");
		expect(results.filter(function(title) { return title === "bitmap"; }).length).toBe(1);
		expect(results.join(",")).toBe(results.slice().sort().join(","));
	});

});
