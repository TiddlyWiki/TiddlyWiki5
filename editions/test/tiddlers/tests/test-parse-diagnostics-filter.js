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
});
