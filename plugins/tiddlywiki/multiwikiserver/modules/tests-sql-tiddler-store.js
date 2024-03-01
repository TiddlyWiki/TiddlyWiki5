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
}

}

})();
