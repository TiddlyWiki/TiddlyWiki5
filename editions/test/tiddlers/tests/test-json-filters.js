/*\
title: test-json-filters.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the JSON filters.

\*/
(function(){

/* jslint node: true, browser: true */
/* eslint-env node, browser, jasmine */
/* eslint no-mixed-spaces-and-tabs: ["error", "smart-tabs"]*/
/* global $tw, require */
"use strict";

describe("json filter tests", function() {

	var wiki = new $tw.Wiki();
	var tiddlers = [{
		title: "First",
		text: '{"a":"one","b":"","c":1.618,"d": {"e": "four","f": ["five","six",true,false,null]}}',
		type: "application/json"
	},{
		title: "Second",
		text: '["une","deux","trois"]',
		type: "application/json"
	}];
	wiki.addTiddlers(tiddlers);

	it("should support the getindex operator", function() {
		expect(wiki.filterTiddlers("[[First]getindex[b]]")).toEqual([]);
	});

	it("should support the getjson operator", function() {
		expect(wiki.filterTiddlers("[[First]getjson[]]")).toEqual(["one","","1.618","four","five","six","true","false","null"]);
		expect(wiki.filterTiddlers("[[First]getjson[a]]")).toEqual(["one"]);
		expect(wiki.filterTiddlers("[[First]getjson[b]]")).toEqual([""]);
		expect(wiki.filterTiddlers("[[First]getjson[d]]")).toEqual(["four","five","six","true","false","null"]);
		expect(wiki.filterTiddlers("[[First]getjson[d],[e]]")).toEqual(["four"]);
		expect(wiki.filterTiddlers("[[First]getjson[d],[f]]")).toEqual(["five","six","true","false","null"]);
		expect(wiki.filterTiddlers("[[First]getjson[d],[f],[0]]")).toEqual(["five"]);
		expect(wiki.filterTiddlers("[[First]getjson[d],[f],[1]]")).toEqual(["six"]);
		expect(wiki.filterTiddlers("[[First]getjson[d],[f],[2]]")).toEqual(["true"]);
		expect(wiki.filterTiddlers("[[First]getjson[d],[f],[3]]")).toEqual(["false"]);
		expect(wiki.filterTiddlers("[[First]getjson[d],[f],[4]]")).toEqual(["null"]);
	});

	it("should support the indexesjson operator", function() {
		expect(wiki.filterTiddlers("[[Second]indexesjson[]]")).toEqual(["0","1","2"]);
		expect(wiki.filterTiddlers("[[First]indexesjson[]]")).toEqual(["a","b","c","d"]);
		expect(wiki.filterTiddlers("[[First]indexesjson[a]]")).toEqual([]);
		expect(wiki.filterTiddlers("[[First]indexesjson[b]]")).toEqual([]);
		expect(wiki.filterTiddlers("[[First]indexesjson[d]]")).toEqual(["e","f"]);
		expect(wiki.filterTiddlers("[[First]indexesjson[d],[e]]")).toEqual([]);
		expect(wiki.filterTiddlers("[[First]indexesjson[d],[f]]")).toEqual(["0","1","2","3","4"]);
		expect(wiki.filterTiddlers("[[First]indexesjson[d],[f],[0]]")).toEqual([]);
		expect(wiki.filterTiddlers("[[First]indexesjson[d],[f],[1]]")).toEqual([]);
		expect(wiki.filterTiddlers("[[First]indexesjson[d],[f],[2]]")).toEqual([]);
		expect(wiki.filterTiddlers("[[First]indexesjson[d],[f],[3]]")).toEqual([]);
		expect(wiki.filterTiddlers("[[First]indexesjson[d],[f],[4]]")).toEqual([]);
	});

	it("should support the typejson operator", function() {
		expect(wiki.filterTiddlers("[[First]typejson[]]")).toEqual(["object"]);
		expect(wiki.filterTiddlers("[[First]typejson[a]]")).toEqual(["string"]);
		expect(wiki.filterTiddlers("[[First]typejson[b]]")).toEqual(["string"]);
		expect(wiki.filterTiddlers("[[First]typejson[c]]")).toEqual(["number"]);
		expect(wiki.filterTiddlers("[[First]typejson[d]]")).toEqual(["object"]);
		expect(wiki.filterTiddlers("[[First]typejson[d],[e]]")).toEqual(["string"]);
		expect(wiki.filterTiddlers("[[First]typejson[d],[f]]")).toEqual(["array"]);
		expect(wiki.filterTiddlers("[[First]typejson[d],[f],[0]]")).toEqual(["string"]);
		expect(wiki.filterTiddlers("[[First]typejson[d],[f],[1]]")).toEqual(["string"]);
		expect(wiki.filterTiddlers("[[First]typejson[d],[f],[2]]")).toEqual(["boolean"]);
		expect(wiki.filterTiddlers("[[First]typejson[d],[f],[3]]")).toEqual(["boolean"]);
		expect(wiki.filterTiddlers("[[First]typejson[d],[f],[4]]")).toEqual(["null"]);
	});

});

})();
	