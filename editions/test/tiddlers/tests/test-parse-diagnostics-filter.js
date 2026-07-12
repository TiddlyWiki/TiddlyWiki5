/*\
title: test-parse-diagnostics-filter.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the parse-diagnostics filter operator that reads the parser-agnostic diagnostics contract from the parse cache.

\*/

"use strict";

describe("parse-diagnostics filter operator", function() {

	function wikiWith(tiddlers) {
		var wiki = new $tw.Wiki();
		wiki.addTiddlers(tiddlers);
		return wiki;
	}

	var degraded = {title: "Degraded", type: "text/vnd.tiddlywiki", text: "```\nunclosed"},
		clean = {title: "Clean", type: "text/vnd.tiddlywiki", text: "Just ordinary prose."};

	it("keeps tiddlers whose parse produced diagnostics", function() {
		var wiki = wikiWith([degraded,clean]);
		expect(wiki.filterTiddlers("[all[tiddlers]parse-diagnostics[]]")).toEqual(["Degraded"]);
	});

	it("inverts to keep tiddlers whose parse was clean", function() {
		var wiki = wikiWith([degraded,clean]);
		expect(wiki.filterTiddlers("[all[tiddlers]!parse-diagnostics[]]")).toEqual(["Clean"]);
	});

	it("returns the diagnostic count as the parse grade", function() {
		var wiki = wikiWith([degraded,clean]);
		expect(wiki.filterTiddlers("[[Degraded]parse-diagnostics:count[]]")).toEqual(["1"]);
		expect(wiki.filterTiddlers("[[Clean]parse-diagnostics:count[]]")).toEqual(["0"]);
	});

	it("lists the distinct diagnostic codes", function() {
		var wiki = wikiWith([degraded]);
		expect(wiki.filterTiddlers("[all[tiddlers]parse-diagnostics:codes[]]")).toEqual(["unterminated-codeblock"]);
	});

	it("grades by the worst severity band", function() {
		var wiki = wikiWith([degraded,clean]);
		expect(wiki.filterTiddlers("[[Degraded]parse-diagnostics:grade[]]")).toEqual(["warning"]);
		expect(wiki.filterTiddlers("[[Clean]parse-diagnostics:grade[]]")).toEqual(["clean"]);
	});

	describe("reading a grammar of its own", function() {

		var CUSTOM_TYPE = "text/x-test-grammar";

		function CustomParser(type,text,options) {
			this.tree = [{type: "text", text: text}];
			this.source = text;
			this.diagnostics = [];
			var index = text.indexOf("!!");
			if(index !== -1) {
				this.diagnostics.push($tw.utils.makeParseDiagnostic({
					from: index,
					to: index + 2,
					severity: "error",
					code: "custom-fault",
					message: "The grammar refused this construct"
				},{source: type, sourceLength: text.length}));
				this.tree = [{type: "text", text: text, start: 0, end: text.length, isRecovered: true}];
			}
		}

		beforeEach(function() {
			$tw.Wiki.parsers[CUSTOM_TYPE] = CustomParser;
		});

		afterEach(function() {
			delete $tw.Wiki.parsers[CUSTOM_TYPE];
		});

		it("carries diagnostics from any parser, not only from wikitext", function() {
			var wiki = wikiWith([
				{title: "CustomBroken", type: CUSTOM_TYPE, text: "a construct !! that fails"},
				{title: "CustomClean", type: CUSTOM_TYPE, text: "a construct that holds"}
			]);
			expect(wiki.filterTiddlers("[all[tiddlers]parse-diagnostics[]]")).toEqual(["CustomBroken"]);
			expect(wiki.filterTiddlers("[[CustomBroken]parse-diagnostics:grade[]]")).toEqual(["error"]);
			expect(wiki.filterTiddlers("[[CustomBroken]parse-diagnostics:codes[]]")).toEqual(["custom-fault"]);
			expect(wiki.filterTiddlers("[[CustomClean]parse-diagnostics:grade[]]")).toEqual(["clean"]);
		});

		it("grades a wikitext tiddler and a custom grammar tiddler on one scale", function() {
			var wiki = wikiWith([
				degraded,
				{title: "CustomBroken", type: CUSTOM_TYPE, text: "a construct !! that fails"}
			]);
			expect(wiki.filterTiddlers("[all[tiddlers]parse-diagnostics:grade[]]").sort()).toEqual(["error","warning"]);
		});
	});
});
