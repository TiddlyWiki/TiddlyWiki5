/*\
title: test-compare-filters.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the compare filter.

\*/
(function(){

/* jslint node: true, browser: true */
/* eslint-env node, browser, jasmine */
/* eslint no-mixed-spaces-and-tabs: ["error", "smart-tabs"]*/
/* global $tw, require */
"use strict";

describe("'compare' filter tests", function() {

	var wiki = new $tw.Wiki();

	it("should compare numerical equality", function() {
		expect(wiki.filterTiddlers("[[2]compare:number:eq[0003]]").join(",")).toBe("");
		expect(wiki.filterTiddlers("[[2]compare:number:ne[000003]]").join(",")).toBe("2");
		expect(wiki.filterTiddlers("[[2]compare:number:eq[3]]").join(",")).toBe("");
		expect(wiki.filterTiddlers("[[2]compare:number:ne[3]]").join(",")).toBe("2");
		expect(wiki.filterTiddlers("[[2]compare:number:eq[2]]").join(",")).toBe("2");
		expect(wiki.filterTiddlers("[[2]compare:number:ne[2]]").join(",")).toBe("");
		expect(wiki.filterTiddlers("[[2]compare:number:eq[x]]").join(",")).toBe("");
		expect(wiki.filterTiddlers("[[2]compare:number:ne[x]]").join(",")).toBe("2");
		expect(wiki.filterTiddlers("[[2]!compare:number:eq[3]]").join(",")).toBe("2");
		expect(wiki.filterTiddlers("[[2]!compare:number:ne[3]]").join(",")).toBe("");
		expect(wiki.filterTiddlers("[[2]!compare:number:eq[2]]").join(",")).toBe("");
		expect(wiki.filterTiddlers("[[2]!compare:number:ne[2]]").join(",")).toBe("2");
		expect(wiki.filterTiddlers("[[2]!compare:number:eq[x]]").join(",")).toBe("2");
		expect(wiki.filterTiddlers("[[2]!compare:number:ne[x]]").join(",")).toBe("");
	});

	it("should compare numerical magnitude", function() {
		expect(wiki.filterTiddlers("[[2]compare:number:gt[3]]").join(",")).toBe("");
		expect(wiki.filterTiddlers("[[2]compare:number:lt[3]]").join(",")).toBe("2");
		expect(wiki.filterTiddlers("[[2]compare:number:gt[2]]").join(",")).toBe("");
		expect(wiki.filterTiddlers("[[2]compare:number:lt[2]]").join(",")).toBe("");
		expect(wiki.filterTiddlers("[[2]compare:number:gt[x]]").join(",")).toBe("2");
		expect(wiki.filterTiddlers("[[2]compare:number:lt[x]]").join(",")).toBe("");
		expect(wiki.filterTiddlers("[[2]!compare:number:gt[3]]").join(",")).toBe("2");
		expect(wiki.filterTiddlers("[[2]!compare:number:lt[3]]").join(",")).toBe("");
		expect(wiki.filterTiddlers("[[2]!compare:number:gt[2]]").join(",")).toBe("2");
		expect(wiki.filterTiddlers("[[2]!compare:number:lt[2]]").join(",")).toBe("2");
		expect(wiki.filterTiddlers("[[2]!compare:number:gt[x]]").join(",")).toBe("");
		expect(wiki.filterTiddlers("[[2]!compare:number:lt[x]]").join(",")).toBe("2");
	});

	it("should compare string", function() {
		expect(wiki.filterTiddlers("[[Monday]compare:string:lt[M]]").join(",")).toBe("");
		expect(wiki.filterTiddlers("[[Monday]compare:string:lt[W]]").join(",")).toBe("Monday");
		expect(wiki.filterTiddlers("Monday Tuesday Wednesday Thursday Friday Saturday Sunday +[compare:string:gt[M]sort[]]").join(",")).toBe("Monday,Saturday,Sunday,Thursday,Tuesday,Wednesday");
		expect(wiki.filterTiddlers("Monday Tuesday Wednesday Thursday Friday Saturday Sunday +[compare:string:gt[M]compare:string:lt[W]sort[]]").join(",")).toBe("Monday,Saturday,Sunday,Thursday,Tuesday");
	});

	it("should compare dates", function() {
		expect(wiki.filterTiddlers("[[20200101]compare:date:gt[201912311852]]").join(",")).toBe("20200101");
	});

	it("should compare version numbers", function() {
		expect(wiki.filterTiddlers("[[v1.2.3]compare:version:eq[v1.1.0]]").join(",")).toBe("");
		expect(wiki.filterTiddlers("[[v1.2.3]compare:version:eq[v1.2.2]]").join(",")).toBe("");
		expect(wiki.filterTiddlers("[[v1.2.3]compare:version:eq[v1.2.3]]").join(",")).toBe("v1.2.3");
		expect(wiki.filterTiddlers("[[v1.2.3]compare:version:eq[v1.2.4]]").join(",")).toBe("");
		expect(wiki.filterTiddlers("[[v1.2.3]compare:version:eq[v2.0.0]]").join(",")).toBe("");
		expect(wiki.filterTiddlers("[[v1.2.3]compare:version:gt[v1.1.0]]").join(",")).toBe("v1.2.3");
		expect(wiki.filterTiddlers("[[v1.2.3]compare:version:gt[v1.2.2]]").join(",")).toBe("v1.2.3");
		expect(wiki.filterTiddlers("[[v1.2.3]compare:version:gt[v1.2.3]]").join(",")).toBe("");
		expect(wiki.filterTiddlers("[[v1.2.3]compare:version:gt[v1.2.4]]").join(",")).toBe("");
		expect(wiki.filterTiddlers("[[v1.2.3]compare:version:gt[v2.0.0]]").join(",")).toBe("");
		expect(wiki.filterTiddlers("[[v1.2.3]compare:version:lt[v1.1.0]]").join(",")).toBe("");
		expect(wiki.filterTiddlers("[[v1.2.3]compare:version:lt[v1.2.2]]").join(",")).toBe("");
		expect(wiki.filterTiddlers("[[v1.2.3]compare:version:lt[v1.2.3]]").join(",")).toBe("");
		expect(wiki.filterTiddlers("[[v1.2.3]compare:version:lt[v1.2.4]]").join(",")).toBe("v1.2.3");
		expect(wiki.filterTiddlers("[[v1.2.3]compare:version:lt[v2.0.0]]").join(",")).toBe("v1.2.3");
	});

});

})();
