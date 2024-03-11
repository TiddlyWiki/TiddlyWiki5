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

	it("should return a saved tiddler within a bag", function() {
		expect(store.createBag("bag-alpha", "Bag alpha")).toEqual(null);
		var saveBagResult = store.saveBagTiddler({
			title: "Another Tiddler",
			text:  "I'm in alpha",
			tags:  "one two three"
		}, "bag-alpha");

		expect(new Set(Object.keys(saveBagResult))).toEqual(new Set(["tiddler_id"]));
		expect(typeof(saveBagResult.tiddler_id)).toBe("number");

		expect(store.getBagTiddlers("bag-alpha")).toEqual(["Another Tiddler"]);

		var getBagTiddlerResult = store.getBagTiddler("Another Tiddler","bag-alpha");
		expect(typeof(getBagTiddlerResult.tiddler_id)).toBe("number");
		delete getBagTiddlerResult.tiddler_id;

		// these fields may eventually be removed, so don't depend on their presence
		delete getBagTiddlerResult.tiddler.revision;
		delete getBagTiddlerResult.tiddler.bag;

		expect(getBagTiddlerResult).toEqual({ attachment_blob: null, tiddler: {title: "Another Tiddler", text: "I'm in alpha", tags: "one two three"} });
	});

	it("should return a single recipe after creating that recipe", function() {
		expect(store.createBag("bag-alpha","Bag alpha")).toEqual(null);
		expect(store.createBag("bag-beta","Bag beta")).toEqual(null);
		expect(store.createRecipe("recipe-rho",["bag-alpha","bag-beta"],"Recipe rho")).toEqual(null);

		expect(store.listRecipes()).toEqual([
			{ recipe_name: "recipe-rho", bag_names: ["bag-alpha","bag-beta"], description: "Recipe rho" }
		]);
	});

	it("should return a recipe's bags after creating that recipe", function() {
		expect(store.createBag("bag-alpha","Bag alpha")).toEqual(null);
		expect(store.createBag("bag-beta","Bag beta")).toEqual(null);
		expect(store.createRecipe("recipe-rho",["bag-alpha","bag-beta"],"Recipe rho")).toEqual(null);

		expect(store.getRecipeBags("recipe-rho")).toEqual(["bag-alpha","bag-beta"]);
	});

	it("should return a saved tiddler within a recipe", function() {
		expect(store.createBag("bag-alpha","Bag alpha")).toEqual(null);
		expect(store.createBag("bag-beta","Bag beta")).toEqual(null);
		expect(store.createRecipe("recipe-rho",["bag-alpha","bag-beta"],"Recipe rho")).toEqual(null);

		var saveRecipeResult = store.saveRecipeTiddler({
			title: "Another Tiddler",
			text:  "I'm in rho"
		},"recipe-rho");

		expect(new Set(Object.keys(saveRecipeResult))).toEqual(new Set(["tiddler_id", "bag_name"]));
		expect(typeof(saveRecipeResult.tiddler_id)).toBe("number");
		expect(saveRecipeResult.bag_name).toBe("bag-beta");

		expect(store.getRecipeTiddlers("recipe-rho")).toEqual([{title: "Another Tiddler", bag_name: "bag-beta"}]);

		var getRecipeTiddlerResult = store.getRecipeTiddler("Another Tiddler","recipe-rho");
		expect(typeof(getRecipeTiddlerResult.tiddler_id)).toBe("number");
		delete getRecipeTiddlerResult.tiddler_id;

		// these fields may eventually be removed, so don't depend on their presence
		delete getRecipeTiddlerResult.tiddler.revision;
		delete getRecipeTiddlerResult.tiddler.bag;

		expect(getRecipeTiddlerResult).toEqual({ attachment_blob: null, bag_name: "bag-beta", tiddler: {title: "Another Tiddler", text: "I'm in rho"} });
	});

	it("should return no tiddlers after the only one has been deleted", function() {
		expect(store.createBag("bag-alpha","Bag alpha")).toEqual(null);

		store.saveBagTiddler({
			title: "Another Tiddler",
			text:  "I'm in alpha",
			tags:  "one two three"
		}, "bag-alpha");

		store.deleteTiddler("Another Tiddler","bag-alpha");
		expect(store.getBagTiddlers("bag-alpha")).toEqual([]);
	});
}

}

})();
