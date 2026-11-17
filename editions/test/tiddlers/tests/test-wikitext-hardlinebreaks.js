/*\
title: test-wikitext-hardlinebreaks.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests for triple-quote regions and their public serializer adapter.

\*/

"use strict";

describe("Hard linebreak region compatibility", function() {
	function parse(text) {
		return $tw.wiki.parseText("text/vnd.tiddlywiki",text,{parseAsInline: true}).tree;
	}

	function render(tree) {
		var widget = $tw.wiki.makeWidget({tree: tree}, {document: $tw.fakeDocument}),
			container = $tw.fakeDocument.createElement("div");
		widget.render(container,null);
		return container.innerHTML;
	}

	it("keeps formatting rule names inside a transparent wrapper", function() {
		var tree = parse('"""\n\'\'bold\'\'\n//italic//\n"""'),
			region = tree[0];
		expect(region.type).toBe("void");
		expect(region.rule).toBe("hardlinebreaks");
		expect(region.children.map(function(node) { return node.rule; })).toEqual(["bold", "hardlinebreaks", "italic", "hardlinebreaks"]);
		expect(render(tree)).toBe("<strong>bold</strong><br><em>italic</em><br>");
		expect(region.children[0].isRuleStart).toBeUndefined();
		expect(region.children[3].isRuleEnd).toBeUndefined();
	});

	["\n", "\r\n"].forEach(function(lineEnd) {
		["", lineEnd].forEach(function(openingLineEnd) {
			it("preserves a region opener through the public serializer: " + JSON.stringify(openingLineEnd) + "/" + JSON.stringify(lineEnd), function() {
				var source = 'before """' + openingLineEnd + "''bold''" + lineEnd + "//italic//" + lineEnd + '""" after',
					serialized = $tw.utils.serializeWikitextParseTree(parse(source), {source: source});
				expect(serialized).toBe(source);
				expect(render(parse(serialized))).toBe(render(parse(source)));
			});
		});
	});

	it("preserves adjacent regions and an empty region", function() {
		['""""""', '"""\n"""', '"""A""""""B"""', '"""\r\n\r\n"""'].forEach(function(source) {
			expect($tw.utils.serializeWikitextParseTree(parse(source), {source: source})).toBe(source);
		});
	});

	it("serializes an editor-built wrapper with a canonical opening line end", function() {
		var tree = [{type: "void", rule: "hardlinebreaks", children: [
			{type: "text", text: "one"},
			{type: "element", tag: "br", rule: "hardlinebreaks"},
			{type: "text", text: "two"}
		]}];
		expect($tw.utils.serializeWikitextParseTree(tree)).toBe('"""\none\ntwo"""');
	});

	it("keeps source options when a region is nested inside formatting", function() {
		var source = "''" + '"""inline\r\nbody"""' + "''";
		expect($tw.utils.serializeWikitextParseTree(parse(source), {source: source})).toBe(source);
	});

	it("keeps the flag-based legacy tree serializable", function() {
		var serialize = require("$:/plugins/tiddlywiki/wikitext-serialize/rules/hardlinebreaks.js").serialize,
			text = function(nodes) { return nodes.map(function(node) { return node.text; }).join(""); };
		expect(serialize({type: "text", rule: "hardlinebreaks", text: "single", isRuleStart: true, isRuleEnd: true}, text)).toBe('"""\nsingle"""');
		expect(serialize({type: "text", rule: "hardlinebreaks", text: "middle"}, text)).toBe("middle");
		expect(serialize({type: "element", tag: "br", rule: "hardlinebreaks", isRuleEnd: true}, text)).toBe('\n"""');
	});
});
