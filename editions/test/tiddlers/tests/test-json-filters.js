/*\
title: test-json-filters.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the JSON filters and the format:json operator

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
		text: '["une","deux","trois",["quatre","cinq"]]',
		type: "application/json"
	},{
		title: "Third",
		text: "This is not JSON",
		type: "text/vnd.tiddlywiki"
	}];
	wiki.addTiddlers(tiddlers);

	it("should support the getindex operator", function() {
		expect(wiki.filterTiddlers("[{First}getindex[b]]")).toEqual([]);
	});

	it("should support the jsonget operator", function() {
		expect(wiki.filterTiddlers("[{Third}jsonget[]]")).toEqual(["This is not JSON"]);
		expect(wiki.filterTiddlers("[{Second}jsonget[]]")).toEqual(["une","deux","trois","quatre","cinq"]);
		expect(wiki.filterTiddlers("[{First}jsonget[]]")).toEqual(["one","","1.618","four","five","six","true","false","null"]);
		expect(wiki.filterTiddlers("[{First}jsonget[a]]")).toEqual(["one"]);
		expect(wiki.filterTiddlers("[{First}jsonget[a],[fixed]]")).toEqual([]);
		expect(wiki.filterTiddlers("[{First}jsonget[b]]")).toEqual([""]);
		expect(wiki.filterTiddlers("[{First}jsonget[c]]")).toEqual(["1.618"]);
		expect(wiki.filterTiddlers("[{First}jsonget[missing-property]]")).toEqual([]);
		expect(wiki.filterTiddlers("[{First}jsonget[d]]")).toEqual(["four","five","six","true","false","null"]);
		expect(wiki.filterTiddlers("[{First}jsonget[d],[e]]")).toEqual(["four"]);
		expect(wiki.filterTiddlers("[{First}jsonget[d],[f]]")).toEqual(["five","six","true","false","null"]);
		expect(wiki.filterTiddlers("[{First}jsonget[d],[f],[0]]")).toEqual(["five"]);
		expect(wiki.filterTiddlers("[{First}jsonget[d],[f],[1]]")).toEqual(["six"]);
		expect(wiki.filterTiddlers("[{First}jsonget[d],[f],[2]]")).toEqual(["true"]);
		expect(wiki.filterTiddlers("[{First}jsonget[d],[f],[3]]")).toEqual(["false"]);
		expect(wiki.filterTiddlers("[{First}jsonget[d],[f],[4]]")).toEqual(["null"]);
	});

	it("should support the jsonextract operator", function() {
		expect(wiki.filterTiddlers("[{Third}jsonextract[]]")).toEqual(['"This is not JSON"']);
		expect(wiki.filterTiddlers("[{First}jsonextract[]]")).toEqual(['{"a":"one","b":"","c":1.618,"d":{"e":"four","f":["five","six",true,false,null]}}']);
		expect(wiki.filterTiddlers("[{First}jsonextract[a]]")).toEqual(['"one"']);
		expect(wiki.filterTiddlers("[{First}jsonextract[b]]")).toEqual(['""']);
		expect(wiki.filterTiddlers("[{First}jsonextract[missing-property]]")).toEqual([]);
		expect(wiki.filterTiddlers("[{First}jsonextract[d]]")).toEqual(['{"e":"four","f":["five","six",true,false,null]}']);
		expect(wiki.filterTiddlers("[{First}jsonextract[d]jsonextract[f]]")).toEqual(['["five","six",true,false,null]']);
		expect(wiki.filterTiddlers("[{First}jsonextract[d],[e]]")).toEqual(['"four"']);
		expect(wiki.filterTiddlers("[{First}jsonextract[d],[f]]")).toEqual(['["five","six",true,false,null]']);
		expect(wiki.filterTiddlers("[{First}jsonextract[d],[f],[0]]")).toEqual(['"five"']);
		expect(wiki.filterTiddlers("[{First}jsonextract[d],[f],[1]]")).toEqual(['"six"']);
		expect(wiki.filterTiddlers("[{First}jsonextract[d],[f],[2]]")).toEqual(["true"]);
		expect(wiki.filterTiddlers("[{First}jsonextract[d],[f],[3]]")).toEqual(["false"]);
		expect(wiki.filterTiddlers("[{First}jsonextract[d],[f],[4]]")).toEqual(["null"]);
	});

	it("should support the jsonindexes operator", function() {
		expect(wiki.filterTiddlers("[{Second}jsonindexes[]]")).toEqual(["0","1","2","3"]);
		expect(wiki.filterTiddlers("[{First}jsonindexes[]]")).toEqual(["a","b","c","d"]);
		expect(wiki.filterTiddlers("[{First}jsonindexes[a]]")).toEqual([]);
		expect(wiki.filterTiddlers("[{First}jsonindexes[b]]")).toEqual([]);
		expect(wiki.filterTiddlers("[{First}jsonindexes[d]]")).toEqual(["e","f"]);
		expect(wiki.filterTiddlers("[{First}jsonindexes[d],[e]]")).toEqual([]);
		expect(wiki.filterTiddlers("[{First}jsonindexes[d],[f]]")).toEqual(["0","1","2","3","4"]);
		expect(wiki.filterTiddlers("[{First}jsonindexes[d],[f],[0]]")).toEqual([]);
		expect(wiki.filterTiddlers("[{First}jsonindexes[d],[f],[1]]")).toEqual([]);
		expect(wiki.filterTiddlers("[{First}jsonindexes[d],[f],[2]]")).toEqual([]);
		expect(wiki.filterTiddlers("[{First}jsonindexes[d],[f],[3]]")).toEqual([]);
		expect(wiki.filterTiddlers("[{First}jsonindexes[d],[f],[4]]")).toEqual([]);
	});

	it("should support the jsontype operator", function() {
		expect(wiki.filterTiddlers("[{Third}jsontype[]]")).toEqual(["string"]);
		expect(wiki.filterTiddlers("[{First}jsontype[]]")).toEqual(["object"]);
		expect(wiki.filterTiddlers("[{First}jsontype[a]]")).toEqual(["string"]);
		expect(wiki.filterTiddlers("[{First}jsontype[b]]")).toEqual(["string"]);
		expect(wiki.filterTiddlers("[{First}jsontype[c]]")).toEqual(["number"]);
		expect(wiki.filterTiddlers("[{First}jsontype[d]]")).toEqual(["object"]);
		expect(wiki.filterTiddlers("[{First}jsontype[d],[e]]")).toEqual(["string"]);
		expect(wiki.filterTiddlers("[{First}jsontype[d],[f]]")).toEqual(["array"]);
		expect(wiki.filterTiddlers("[{First}jsontype[d],[f],[0]]")).toEqual(["string"]);
		expect(wiki.filterTiddlers("[{First}jsontype[d],[f],[1]]")).toEqual(["string"]);
		expect(wiki.filterTiddlers("[{First}jsontype[d],[f],[2]]")).toEqual(["boolean"]);
		expect(wiki.filterTiddlers("[{First}jsontype[d],[f],[3]]")).toEqual(["boolean"]);
		expect(wiki.filterTiddlers("[{First}jsontype[d],[f],[4]]")).toEqual(["null"]);
	});

	it("should support the jsonset operator", function() {
		expect(wiki.filterTiddlers("[{First}jsonset[]]")).toEqual(['{"a":"one","b":"","c":1.618,"d":{"e":"four","f":["five","six",true,false,null]}}']);
		expect(wiki.filterTiddlers("[{First}jsonset[],[Antelope]]")).toEqual(['"Antelope"']);
		expect(wiki.filterTiddlers("[{First}jsonset:number[],[not a number]]")).toEqual(['0']);
		expect(wiki.filterTiddlers("[{First}jsonset[id],[Antelope]]")).toEqual(['{"a":"one","b":"","c":1.618,"d":{"e":"four","f":["five","six",true,false,null]},"id":"Antelope"}']);
		expect(wiki.filterTiddlers("[{First}jsonset:notatype[id],[Antelope]]")).toEqual(['{"a":"one","b":"","c":1.618,"d":{"e":"four","f":["five","six",true,false,null]},"id":"Antelope"}']);
		expect(wiki.filterTiddlers("[{First}jsonset:boolean[id],[false]]")).toEqual(['{"a":"one","b":"","c":1.618,"d":{"e":"four","f":["five","six",true,false,null]},"id":false}']);
		expect(wiki.filterTiddlers("[{First}jsonset:boolean[id],[Antelope]]")).toEqual(['{"a":"one","b":"","c":1.618,"d":{"e":"four","f":["five","six",true,false,null]}}']);
		expect(wiki.filterTiddlers("[{First}jsonset:number[id],[42]]")).toEqual(['{"a":"one","b":"","c":1.618,"d":{"e":"four","f":["five","six",true,false,null]},"id":42}']);
		expect(wiki.filterTiddlers("[{First}jsonset:null[id]]")).toEqual(['{"a":"one","b":"","c":1.618,"d":{"e":"four","f":["five","six",true,false,null]},"id":null}']);
		expect(wiki.filterTiddlers("[{First}jsonset:array[d],[f],[5]]")).toEqual(['{"a":"one","b":"","c":1.618,"d":{"e":"four","f":["five","six",true,false,null,[]]}}']);
		expect(wiki.filterTiddlers("[{First}jsonset:object[d],[f],[5]]")).toEqual(['{"a":"one","b":"","c":1.618,"d":{"e":"four","f":["five","six",true,false,null,{}]}}']);
		expect(wiki.filterTiddlers("[{First}jsonset[missing],[id],[Antelope]]")).toEqual(['{"a":"one","b":"","c":1.618,"d":{"e":"four","f":["five","six",true,false,null]}}']);
		expect(wiki.filterTiddlers("[{First}jsonset:json[\"Antelope\"]]")).toEqual(['"Antelope"']);
		expect(wiki.filterTiddlers("[{First}jsonset:json[id],[{\"a\":313}]]")).toEqual(['{"a":"one","b":"","c":1.618,"d":{"e":"four","f":["five","six",true,false,null]},"id":{"a":313}}']);
		expect(wiki.filterTiddlers("[{First}jsonset:json[notjson]]")).toEqual(['{"a":"one","b":"","c":1.618,"d":{"e":"four","f":["five","six",true,false,null]}}']);
	});

	it("should support the format:json operator", function() {
		expect(wiki.filterTiddlers("[{First}format:json[]]")).toEqual(["{\"a\":\"one\",\"b\":\"\",\"c\":1.618,\"d\":{\"e\":\"four\",\"f\":[\"five\",\"six\",true,false,null]}}"]);
		expect(wiki.filterTiddlers("[{First}format:json[4]]")).toEqual(["{\n    \"a\": \"one\",\n    \"b\": \"\",\n    \"c\": 1.618,\n    \"d\": {\n        \"e\": \"four\",\n        \"f\": [\n            \"five\",\n            \"six\",\n            true,\n            false,\n            null\n        ]\n    }\n}"]);
		expect(wiki.filterTiddlers("[{First}format:json[  ]]")).toEqual(["{\n  \"a\": \"one\",\n  \"b\": \"\",\n  \"c\": 1.618,\n  \"d\": {\n    \"e\": \"four\",\n    \"f\": [\n      \"five\",\n      \"six\",\n      true,\n      false,\n      null\n    ]\n  }\n}"]);
	});

});

})();
