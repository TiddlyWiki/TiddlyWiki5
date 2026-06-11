/*\
title: test-editor-types-settings.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests Editor Types settings: default mappings and dropdown option discovery.

\*/

"use strict";

describe("Editor Types settings", function() {

	var wiki = $tw.wiki;

	it("should provide default editor mappings for image and wikitext types", function() {
		expect(wiki.getTiddlerText("$:/config/EditorTypeMappings/image/png")).toBe("bitmap");
		expect(wiki.getTiddlerText("$:/config/EditorTypeMappings/text/vnd.tiddlywiki")).toBe("text");
	});

	it("should discover installed edit-* widget names for dropdown options", function() {
		var editorTypesFromModules = "[[widget]modules[]suffix[.js]regexp[.*/edit-.+]] :map[search-replace:g:regexp[.*/edit-(.+)\\.js],[$1]]";
		var results = wiki.filterTiddlers(editorTypesFromModules);
		expect(results[0]).not.toMatch(/Filter Error/i);
		expect(results).toContain("text");
		expect(results).toContain("bitmap");
	});

	it("should combine current mapping with installed editor types for select options", function() {
		var editorTypesFromModules = "[[widget]modules[]suffix[.js]regexp[.*/edit-.+]] :map[search-replace:g:regexp[.*/edit-(.+)\\.js],[$1]]";
		var mappingValue = "[[$:/config/EditorTypeMappings/image/png]get[text]]";
		var selectOptionsFilter = editorTypesFromModules + " " + mappingValue + " :sort:string[{!!title}]";
		var results = wiki.filterTiddlers(selectOptionsFilter);
		expect(results[0]).not.toMatch(/Filter Error/i);
		expect(results).toContain("bitmap");
	});

});
