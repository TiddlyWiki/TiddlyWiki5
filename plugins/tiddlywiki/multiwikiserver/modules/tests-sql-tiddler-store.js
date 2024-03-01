/*\
title: tests-sql-tiddler-store.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the SQL tiddler store layer

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

if($tw.node) {

describe("SQL tiddler store with node-sqlite3-wasm", function() {
	runSqlStoreTests("wasm");
});

describe("SQL tiddler store with better-sqlite3", function() {
	runSqlStoreTests("better");
});

function runSqlStoreTests(engine) {
	var SqlTiddlerStore = require("$:/plugins/tiddlywiki/multiwikiserver/sql-tiddler-store.js").SqlTiddlerStore;

	var store;

	beforeEach(function() {
		store = new SqlTiddlerStore({
			databasePath: ":memory:",
			engine: engine
		});
	});

	afterEach(function() {
		store.close();
		store = null;
	});

	it("should return empty results without failure on an empty store", function() {
		expect(store.listBags()).toEqual([]);
		expect(store.listRecipes()).toEqual([]);
	});

	it("should return a single bag after creating a bag", function() {
		expect(store.createBag("bag-alpha", "Bag alpha")).toEqual(null);
		expect(store.listBags()).toEqual([{
			bag_name: "bag-alpha",
			accesscontrol: "",
			description: "Bag alpha"
		}]);
	});

	it("should return empty results after failing to create a bag with an invalid name", function() {
		expect(store.createBag("bag alpha", "Bag alpha")).toEqual({
			message: "Invalid character(s)"
		});
		expect(store.listBags()).toEqual([]);
	});

	it("should return a bag with new description after re-creating", function() {
		expect(store.createBag("bag-alpha", "Bag alpha")).toEqual(null);
		expect(store.createBag("bag-alpha", "Different description")).toEqual(null);
		expect(store.listBags()).toEqual([{
			bag_name: "bag-alpha",
			accesscontrol: "",
			description: "Different description"
		}]);
	});
}

}

})();
