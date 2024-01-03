/*\
title: tests-sql-tiddler-store.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the SQL tiddler store

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

if($tw.node) {

describe("SQL tiddler store", function() {
	// Create and initialise the tiddler store
	var SqlTiddlerStore = require("$:/plugins/tiddlywiki/multiwikiserver/sql-tiddler-store.js").SqlTiddlerStore;
	const sqlTiddlerStore = new SqlTiddlerStore({});
	sqlTiddlerStore.createTables();
	// Create bags and recipes
	sqlTiddlerStore.saveBag("bag-alpha");
	sqlTiddlerStore.saveBag("bag-beta");
	sqlTiddlerStore.saveBag("bag-gamma");
	sqlTiddlerStore.saveRecipe("recipe-rho",["bag-alpha","bag-beta"]);
	sqlTiddlerStore.saveRecipe("recipe-sigma",["bag-alpha","bag-gamma"]);
	// Tear down
	afterAll(function() {
		// Close the database
		sqlTiddlerStore.close();
	});
	// Run tests
	it("should save and retrieve tiddlers", function() {
		// Save tiddlers
		sqlTiddlerStore.saveTiddler({title: "Another Tiddler",text: "I'm in alpha",tags: "one two three"},"bag-alpha");
		sqlTiddlerStore.saveTiddler({title: "Hello There",text: "I'm in alpha as well",tags: "one two three"},"bag-alpha");
		sqlTiddlerStore.saveTiddler({title: "Hello There",text: "I'm in beta",tags: "four five six"},"bag-beta");
		sqlTiddlerStore.saveTiddler({title: "Hello There",text: "I'm in gamma",tags: "seven eight nine"},"bag-gamma");
		// Verify what we've got
		expect(sqlTiddlerStore.getRecipeTiddlers("recipe-rho")).toEqual([ "Another Tiddler", "Hello There"]);
		expect(sqlTiddlerStore.getRecipeTiddlers("recipe-sigma")).toEqual([ "Another Tiddler", "Hello There"]);
		expect(sqlTiddlerStore.getTiddler("Hello There","recipe-rho")).toEqual({ title: "Hello There", text: "I'm in beta", tags: "four five six" });
		expect(sqlTiddlerStore.getTiddler("Missing Tiddler","recipe-rho")).toEqual(null);
		expect(sqlTiddlerStore.getTiddler("Another Tiddler","recipe-rho")).toEqual({ title: "Another Tiddler", text: "I'm in alpha", tags: "one two three" });
		expect(sqlTiddlerStore.getTiddler("Hello There","recipe-sigma")).toEqual({ title: "Hello There", text: "I'm in gamma", tags: "seven eight nine" });
		expect(sqlTiddlerStore.getTiddler("Another Tiddler","recipe-sigma")).toEqual({ title: "Another Tiddler", text: "I'm in alpha", tags: "one two three" });
		// Delete a tiddlers to ensure the underlying tiddler in the recipe shows through
		sqlTiddlerStore.deleteTiddler("Hello There","bag-beta");
		expect(sqlTiddlerStore.getRecipeTiddlers("recipe-rho")).toEqual([ "Another Tiddler", "Hello There"]);
		expect(sqlTiddlerStore.getRecipeTiddlers("recipe-sigma")).toEqual([ "Another Tiddler", "Hello There"]);
		expect(sqlTiddlerStore.getTiddler("Hello There","recipe-beta")).toEqual(null);
		sqlTiddlerStore.deleteTiddler("Another Tiddler","bag-alpha");
		expect(sqlTiddlerStore.getRecipeTiddlers("recipe-rho")).toEqual([ "Hello There"]);
		expect(sqlTiddlerStore.getRecipeTiddlers("recipe-sigma")).toEqual([ "Hello There"]);
		// Save a recipe tiddler
		sqlTiddlerStore.saveRecipeTiddler({title: "More", text: "None"},"recipe-rho");
		expect(sqlTiddlerStore.getTiddler("More","recipe-rho")).toEqual({title: "More", text: "None"});
		
	});
});

}

})();
