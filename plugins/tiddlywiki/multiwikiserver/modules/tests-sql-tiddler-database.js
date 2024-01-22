/*\
title: tests-sql-tiddler-database.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the SQL tiddler database layer

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

if($tw.node) {

describe("SQL tiddler store", function() {
	// Create and initialise the tiddler store
	var SqlTiddlerDatabase = require("$:/plugins/tiddlywiki/multiwikiserver/sql-tiddler-database.js").SqlTiddlerDatabase;
	const sqlTiddlerDatabase = new SqlTiddlerDatabase({
		adminWiki: new $tw.Wiki()
	});
	sqlTiddlerDatabase.createTables();
	// Create bags and recipes
	sqlTiddlerDatabase.createBag("bag-alpha");
	sqlTiddlerDatabase.createBag("bag-beta");
	sqlTiddlerDatabase.createBag("bag-gamma");
	sqlTiddlerDatabase.createRecipe("recipe-rho",["bag-alpha","bag-beta"]);
	sqlTiddlerDatabase.createRecipe("recipe-sigma",["bag-alpha","bag-gamma"]);
	sqlTiddlerDatabase.createRecipe("recipe-tau",["bag-alpha"]);
	sqlTiddlerDatabase.createRecipe("recipe-upsilon",["bag-alpha","bag-gamma","bag-beta"]);
	// Tear down
	afterAll(function() {
		// Close the database
		sqlTiddlerDatabase.close();
	});
	// Run tests
	it("should save and retrieve tiddlers", function() {
		// Save tiddlers
		sqlTiddlerDatabase.saveBagTiddler({title: "Another Tiddler",text: "I'm in alpha",tags: "one two three"},"bag-alpha");
		sqlTiddlerDatabase.saveBagTiddler({title: "Hello There",text: "I'm in alpha as well",tags: "one two three"},"bag-alpha");
		sqlTiddlerDatabase.saveBagTiddler({title: "Hello There",text: "I'm in beta",tags: "four five six"},"bag-beta");
		sqlTiddlerDatabase.saveBagTiddler({title: "Hello There",text: "I'm in gamma",tags: "seven eight nine"},"bag-gamma");
		// Verify what we've got
		expect(sqlTiddlerDatabase.getRecipeTiddlers("recipe-rho")).toEqual([ 
			{ title: 'Another Tiddler', bag_name: 'bag-alpha' },
			{ title: 'Hello There', bag_name: 'bag-beta' }
		]);
		expect(sqlTiddlerDatabase.getRecipeTiddlers("recipe-sigma")).toEqual([
			{ title: 'Another Tiddler', bag_name: 'bag-alpha' },
    		{ title: 'Hello There', bag_name: 'bag-gamma' }
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
			{ title: 'Another Tiddler', bag_name: 'bag-alpha' },
    		{ title: 'Hello There', bag_name: 'bag-alpha' }
		]);
		expect(sqlTiddlerDatabase.getRecipeTiddlers("recipe-sigma")).toEqual([ 
			{ title: 'Another Tiddler', bag_name: 'bag-alpha' },
			{ title: 'Hello There', bag_name: 'bag-gamma' }
		]);
		expect(sqlTiddlerDatabase.getRecipeTiddler("Hello There","recipe-beta")).toEqual(null);
		sqlTiddlerDatabase.deleteTiddler("Another Tiddler","bag-alpha");
		expect(sqlTiddlerDatabase.getRecipeTiddlers("recipe-rho")).toEqual([ { title: 'Hello There', bag_name: 'bag-alpha' } ]);
		expect(sqlTiddlerDatabase.getRecipeTiddlers("recipe-sigma")).toEqual([ { title: 'Hello There', bag_name: 'bag-gamma' } ]);
		// Save a recipe tiddler
		expect(sqlTiddlerDatabase.saveRecipeTiddler({title: "More", text: "None"},"recipe-rho")).toEqual({tiddler_id: 5, bag_name: 'bag-beta'});
		expect(sqlTiddlerDatabase.getRecipeTiddler("More","recipe-rho").tiddler).toEqual({title: "More", text: "None"});
		
	});
});

}

})();
