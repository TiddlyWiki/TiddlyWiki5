/*\
title: $:/plugins/tiddlywiki/multiwikiserver/store/tests-sql-tiddler-database.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the SQL tiddler database layer

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

if($tw.node) {

describe("SQL tiddler database with node-sqlite3-wasm", function() {
	runSqlDatabaseTests("wasm");
});

describe("SQL tiddler database with better-sqlite3", function() {
	runSqlDatabaseTests("better");
});

function runSqlDatabaseTests(engine) {
	// Create and initialise the tiddler store
	var SqlTiddlerDatabase = require("$:/plugins/tiddlywiki/multiwikiserver/store/sql-tiddler-database.js").SqlTiddlerDatabase;
	const sqlTiddlerDatabase = new SqlTiddlerDatabase({
		engine: engine
	});
	sqlTiddlerDatabase.createTables();
	// Tear down
	afterAll(function() {
		// Close the database
		sqlTiddlerDatabase.close();
	});
	// Run tests
	it("should save and retrieve tiddlers using engine: " + engine, function() {
		// Create bags and recipes
		expect(sqlTiddlerDatabase.createBag("bag-alpha","Bag alpha")).toEqual(1);
		expect(sqlTiddlerDatabase.createBag("bag-beta","Bag beta")).toEqual(2);
		expect(sqlTiddlerDatabase.createBag("bag-gamma","Bag gamma")).toEqual(3);
		expect(sqlTiddlerDatabase.listBags()).toEqual([
			{ bag_name: 'bag-alpha', bag_id: 1, accesscontrol: '', description: "Bag alpha" },
			{ bag_name: 'bag-beta', bag_id: 2, accesscontrol: '', description: "Bag beta" },
			{ bag_name: 'bag-gamma', bag_id: 3, accesscontrol: '', description: "Bag gamma" }
		]);
		expect(sqlTiddlerDatabase.createRecipe("recipe-rho",["bag-alpha","bag-beta"],"Recipe rho")).toEqual(1);
		expect(sqlTiddlerDatabase.createRecipe("recipe-sigma",["bag-alpha","bag-gamma"],"Recipe sigma")).toEqual(2);
		expect(sqlTiddlerDatabase.createRecipe("recipe-tau",["bag-alpha"],"Recipe tau")).toEqual(3);
		expect(sqlTiddlerDatabase.createRecipe("recipe-upsilon",["bag-alpha","bag-gamma","bag-beta"],"Recipe upsilon")).toEqual(4);
		expect(sqlTiddlerDatabase.listRecipes()).toEqual([
			{ recipe_name: 'recipe-rho', recipe_id: 1, bag_names: ["bag-alpha","bag-beta"], description: "Recipe rho" },
			{ recipe_name: 'recipe-sigma', recipe_id: 2, bag_names: ["bag-alpha","bag-gamma"], description: "Recipe sigma" },
			{ recipe_name: 'recipe-tau', recipe_id: 3, bag_names: ["bag-alpha"], description: "Recipe tau" },
			{ recipe_name: 'recipe-upsilon', recipe_id: 4, bag_names: ["bag-alpha","bag-gamma","bag-beta"], description: "Recipe upsilon" }
		]);
		expect(sqlTiddlerDatabase.getRecipeBags("recipe-rho")).toEqual(["bag-alpha","bag-beta"]);
		expect(sqlTiddlerDatabase.getRecipeBags("recipe-sigma")).toEqual(["bag-alpha","bag-gamma"]);
		expect(sqlTiddlerDatabase.getRecipeBags("recipe-tau")).toEqual(["bag-alpha"]);
		expect(sqlTiddlerDatabase.getRecipeBags("recipe-upsilon")).toEqual(["bag-alpha","bag-gamma","bag-beta"]);
		// Save tiddlers
		expect(sqlTiddlerDatabase.saveBagTiddler({title: "Another Tiddler",text: "I'm in alpha",tags: "one two three"},"bag-alpha")).toEqual({
			tiddler_id: 1
		});
		expect(sqlTiddlerDatabase.saveBagTiddler({title: "Hello There",text: "I'm in alpha as well",tags: "one two three"},"bag-alpha")).toEqual({
			tiddler_id: 2
		});
		expect(sqlTiddlerDatabase.saveBagTiddler({title: "Hello There",text: "I'm in beta",tags: "four five six"},"bag-beta")).toEqual({
			tiddler_id: 3
		});
		expect(sqlTiddlerDatabase.saveBagTiddler({title: "Hello There",text: "I'm in gamma",tags: "seven eight nine"},"bag-gamma")).toEqual({
			tiddler_id: 4
		});
		// Verify what we've got
		expect(sqlTiddlerDatabase.getRecipeTiddlers("recipe-rho")).toEqual([ 
			{ title: 'Another Tiddler', tiddler_id: 1, bag_name: 'bag-alpha' },
			{ title: 'Hello There', tiddler_id: 3, bag_name: 'bag-beta' }
		]);
		expect(sqlTiddlerDatabase.getRecipeTiddlers("recipe-sigma")).toEqual([
			{ title: 'Another Tiddler', tiddler_id: 1, bag_name: 'bag-alpha' },
    		{ title: 'Hello There', tiddler_id: 4, bag_name: 'bag-gamma' }
		]);
		expect(sqlTiddlerDatabase.getRecipeTiddler("Hello There","recipe-rho").tiddler).toEqual({ title: "Hello There", text: "I'm in beta", tags: "four five six" });
		expect(sqlTiddlerDatabase.getRecipeTiddler("Missing Tiddler","recipe-rho")).toEqual(null);
		expect(sqlTiddlerDatabase.getRecipeTiddler("Another Tiddler","recipe-rho").tiddler).toEqual({ title: "Another Tiddler", text: "I'm in alpha", tags: "one two three" });
		expect(sqlTiddlerDatabase.getRecipeTiddler("Hello There","recipe-sigma").tiddler).toEqual({ title: "Hello There", text: "I'm in gamma", tags: "seven eight nine" });
		expect(sqlTiddlerDatabase.getRecipeTiddler("Another Tiddler","recipe-sigma").tiddler).toEqual({ title: "Another Tiddler", text: "I'm in alpha", tags: "one two three" });
		expect(sqlTiddlerDatabase.getRecipeTiddler("Hello There","recipe-upsilon").tiddler).toEqual({title: "Hello There",text: "I'm in beta",tags: "four five six"});
		// Delete a tiddlers to ensure the underlying tiddler in the recipe shows through
		sqlTiddlerDatabase.deleteTiddler("Hello There","bag-beta");
		expect(sqlTiddlerDatabase.getRecipeTiddlers("recipe-rho")).toEqual([
			{ title: 'Another Tiddler', tiddler_id: 1, bag_name: 'bag-alpha' },
    		{ title: 'Hello There', tiddler_id: 2, bag_name: 'bag-alpha' }
		]);
		expect(sqlTiddlerDatabase.getRecipeTiddlers("recipe-sigma")).toEqual([ 
			{ title: 'Another Tiddler', tiddler_id: 1, bag_name: 'bag-alpha' },
			{ title: 'Hello There', tiddler_id: 4, bag_name: 'bag-gamma' }
		]);
		expect(sqlTiddlerDatabase.getRecipeTiddler("Hello There","recipe-beta")).toEqual(null);
		sqlTiddlerDatabase.deleteTiddler("Another Tiddler","bag-alpha");
		expect(sqlTiddlerDatabase.getRecipeTiddlers("recipe-rho")).toEqual([ { title: 'Hello There', tiddler_id: 2, bag_name: 'bag-alpha' } ]);
		expect(sqlTiddlerDatabase.getRecipeTiddlers("recipe-sigma")).toEqual([ { title: 'Hello There', tiddler_id: 4, bag_name: 'bag-gamma' } ]);
		// Save a recipe tiddler
		expect(sqlTiddlerDatabase.saveRecipeTiddler({title: "More", text: "None"},"recipe-rho")).toEqual({tiddler_id: 7, bag_name: 'bag-beta'});
		expect(sqlTiddlerDatabase.getRecipeTiddler("More","recipe-rho").tiddler).toEqual({title: "More", text: "None"});
	});
}

}

})();
