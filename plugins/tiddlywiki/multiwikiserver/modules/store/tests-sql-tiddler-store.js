/*\
title: $:/plugins/tiddlywiki/multiwikiserver/await store/tests-sql-tiddler-await store.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the SQL tiddler await store layer

\*/
if($tw.node) {
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

describe("SQL tiddler await store with node-sqlite3-wasm", function() {
	runSqlStoreTests("wasm");
});

describe("SQL tiddler await store with better-sqlite3", function() {
	runSqlStoreTests("better");
});

function runSqlStoreTests(engine) {
	var SqlTiddlerStore = require("$:/plugins/tiddlywiki/multiwikiserver/store/sql-tiddler-store.js").SqlTiddlerStore;

	var store;

	beforeEach(async function() {
		store = new SqlTiddlerStore({
			databasePath: ":memory:",
			engine: engine
		});
		await store.initCheck();
	});

	afterEach(async function() {
		await store.close();
		store = null;
	});

	it("should return empty results without failure on an empty await store", async function() {
		expect(await store.listBags()).toEqual([]);
		expect(await store.listRecipes()).toEqual([]);
	});

	it("should return a single bag after creating a bag", async function() {
		expect(await store.createBag("bag-alpha", "Bag alpha")).toEqual(null);
		expect(await store.listBags()).toEqual([{
			bag_name: "bag-alpha",
			bag_id: 1,
			accesscontrol: "",
			description: "Bag alpha"
		}]);
	});

	it("should return empty results after failing to create a bag with an invalid name", async function() {
		expect(await store.createBag("bag alpha", "Bag alpha")).toEqual({
			message: "Invalid character(s)"
		});
		expect(await store.listBags()).toEqual([]);
	});

	it("should return a bag with new description after re-creating", async function() {
		expect(await store.createBag("bag-alpha", "Bag alpha")).toEqual(null);
		expect(await store.createBag("bag-alpha", "Different description")).toEqual(null);
		expect(await store.listBags()).toEqual([{
			bag_name: "bag-alpha",
			bag_id: 1,
			accesscontrol: "",
			description: "Different description"
		}]);
	});

	it("should return a saved tiddler within a bag", async function() {
		expect(await store.createBag("bag-alpha", "Bag alpha")).toEqual(null);
		var saveBagResult = await store.saveBagTiddler({
			title: "Another Tiddler",
			text:  "I'm in alpha",
			tags:  "one two three"
		}, "bag-alpha");

		expect(new Set(Object.keys(saveBagResult))).toEqual(new Set(["tiddler_id"]));
		expect(typeof(saveBagResult.tiddler_id)).toBe("number");

		expect(await store.getBagTiddlers("bag-alpha")).toEqual([{title: "Another Tiddler", tiddler_id: 1}]);

		var getBagTiddlerResult = await store.getBagTiddler("Another Tiddler","bag-alpha");
		expect(typeof(getBagTiddlerResult.tiddler_id)).toBe("number");
		delete getBagTiddlerResult.tiddler_id;
		expect(getBagTiddlerResult).toEqual({ attachment_blob: null, tiddler: {title: "Another Tiddler", text: "I'm in alpha", tags: "one two three"} });
	});

	it("should return a single recipe after creating that recipe", async function() {
		expect(await store.createBag("bag-alpha","Bag alpha")).toEqual(null);
		expect(await store.createBag("bag-beta","Bag beta")).toEqual(null);
		expect(await store.createRecipe("recipe-rho",["bag-alpha","bag-beta"],"Recipe rho")).toEqual(null);

		expect(await store.listRecipes()).toEqual([
			{ recipe_name: "recipe-rho", recipe_id: 1, bag_names: ["bag-alpha","bag-beta"], description: "Recipe rho", owner_id: null }
		]);
	});

	it("should return a recipe's bags after creating that recipe", async function() {
		expect(await store.createBag("bag-alpha","Bag alpha")).toEqual(null);
		expect(await store.createBag("bag-beta","Bag beta")).toEqual(null);
		expect(await store.createRecipe("recipe-rho",["bag-alpha","bag-beta"],"Recipe rho")).toEqual(null);

		expect(await store.getRecipeBags("recipe-rho")).toEqual(["bag-alpha","bag-beta"]);
	});

	it("should return a saved tiddler within a recipe", async function() {
		expect(await store.createBag("bag-alpha","Bag alpha")).toEqual(null);
		expect(await store.createBag("bag-beta","Bag beta")).toEqual(null);
		expect(await store.createRecipe("recipe-rho",["bag-alpha","bag-beta"],"Recipe rho")).toEqual(null);

		var saveRecipeResult = await store.saveRecipeTiddler({
			title: "Another Tiddler",
			text:  "I'm in rho"
		},"recipe-rho");

		expect(new Set(Object.keys(saveRecipeResult))).toEqual(new Set(["tiddler_id", "bag_name"]));
		expect(typeof(saveRecipeResult.tiddler_id)).toBe("number");
		expect(saveRecipeResult.bag_name).toBe("bag-beta");

		expect(await store.getRecipeTiddlers("recipe-rho")).toEqual([{title: "Another Tiddler", tiddler_id: 1, bag_name: "bag-beta", is_deleted: 0 }]);

		var getRecipeTiddlerResult = await store.getRecipeTiddler("Another Tiddler","recipe-rho");
		expect(typeof(getRecipeTiddlerResult.tiddler_id)).toBe("number");
		delete getRecipeTiddlerResult.tiddler_id;
		expect(getRecipeTiddlerResult).toEqual({ attachment_blob: null, bag_name: "bag-beta", tiddler: {title: "Another Tiddler", text: "I'm in rho"} });
	});

	it("should return no tiddlers after the only one has been deleted", async function() {
		expect(await store.createBag("bag-alpha","Bag alpha")).toEqual(null);

		await store.saveBagTiddler({
			title: "Another Tiddler",
			text:  "I'm in alpha",
			tags:  "one two three"
		}, "bag-alpha");

		await store.deleteTiddler("Another Tiddler","bag-alpha");
		expect(await store.getBagTiddlers("bag-alpha")).toEqual([]);
	});
}

})();

}
