/*\
title: $:/plugins/tiddlywiki/multiwikiserver/sql-tiddler-store.js
type: application/javascript
module-type: library

Higher level functions to perform basic tiddler operations with a sqlite3 database.

This class is largely a wrapper for the sql-tiddler-database.js class, adding the following functionality:

* Synchronising bag and recipe names to the admin wiki

\*/

(function() {

/*
Create a tiddler store. Options include:

databasePath - path to the database file (can be ":memory:" to get a temporary database)
adminWiki - reference to $tw.Wiki object into which entity state tiddlers should be saved
*/
function SqlTiddlerStore(options) {
	options = options || {};
	this.adminWiki = options.adminWiki || $tw.wiki;
	this.entityStateTiddlerPrefix = "$:/state/multiwikiserver/";
	// Create the database
	this.databasePath = options.databasePath || ":memory:";
	var SqlTiddlerDatabase = require("$:/plugins/tiddlywiki/multiwikiserver/sql-tiddler-database.js").SqlTiddlerDatabase;
	this.sqlTiddlerDatabase = new SqlTiddlerDatabase({
		databasePath: this.databasePath
	});
	this.sqlTiddlerDatabase.createTables();
}

SqlTiddlerStore.prototype.close = function() {
	this.sqlTiddlerDatabase.close();
	this.sqlTiddlerDatabase = undefined;
};

SqlTiddlerStore.prototype.saveEntityStateTiddler = function(tiddler) {
	this.adminWiki.addTiddler(new $tw.Tiddler(tiddler,{title: this.entityStateTiddlerPrefix + tiddler.title}));
};

SqlTiddlerStore.prototype.updateAdminWiki = function() {
	// Update bags
	for(const bagInfo of this.listBags()) {
		this.saveEntityStateTiddler({
			title: "bags/" + bagInfo.bag_name,
			"bag-name": bagInfo.bag_name,
			text: ""
		});
	}
	// Update recipes
	for(const recipeInfo of this.listRecipes()) {
		this.saveEntityStateTiddler({
			title: "recipes/" + recipeInfo.recipe_name,
			"recipe-name": recipeInfo.recipe_name,
			text: "",
			list: $tw.utils.stringifyList(this.getRecipeBags(recipeInfo.recipe_name))
		});
	}
};

SqlTiddlerStore.prototype.logTables = function() {
	this.sqlTiddlerDatabase.logTables();
};

SqlTiddlerStore.prototype.listBags = function() {
	return this.sqlTiddlerDatabase.listBags();
};

SqlTiddlerStore.prototype.createBag = function(bagname) {
	this.sqlTiddlerDatabase.createBag(bagname);
	this.saveEntityStateTiddler({
		title: "bags/" + bagname,
		"bag-name": bagname,
		text: ""
	});
};

SqlTiddlerStore.prototype.listRecipes = function() {
	return this.sqlTiddlerDatabase.listRecipes();
};

SqlTiddlerStore.prototype.createRecipe = function(recipename,bagnames) {
	this.sqlTiddlerDatabase.createRecipe(recipename,bagnames);
	this.saveEntityStateTiddler({
		title: "recipes/" + recipename,
		"recipe-name": recipename,
		text: "",
		list: $tw.utils.stringifyList(bagnames)
	});
};

/*
Returns {tiddler_id:}
*/
SqlTiddlerStore.prototype.saveBagTiddler = function(tiddlerFields,bagname) {
	return this.sqlTiddlerDatabase.saveBagTiddler(tiddlerFields,bagname);
};

/*
Returns {tiddler_id:,bag_name:}
*/
SqlTiddlerStore.prototype.saveRecipeTiddler = function(tiddlerFields,recipename) {
	return this.sqlTiddlerDatabase.saveRecipeTiddler(tiddlerFields,recipename);
};

SqlTiddlerStore.prototype.deleteTiddler = function(title,bagname) {
	this.sqlTiddlerDatabase.deleteTiddler(title,bagname);
};

/*
returns {tiddler_id:,tiddler:}
*/
SqlTiddlerStore.prototype.getBagTiddler = function(title,bagname) {
	return this.sqlTiddlerDatabase.getBagTiddler(title,bagname);
};

/*
Returns {bag_name:, tiddler: {fields}, tiddler_id:}
*/
SqlTiddlerStore.prototype.getRecipeTiddler = function(title,recipename) {
	return this.sqlTiddlerDatabase.getRecipeTiddler(title,recipename);
};

/*
Get the titles of the tiddlers in a bag. Returns an empty array for bags that do not exist
*/
SqlTiddlerStore.prototype.getBagTiddlers = function(bagname) {
	return this.sqlTiddlerDatabase.getBagTiddlers(bagname);
};

/*
Get the titles of the tiddlers in a recipe as {title:,bag_name:}. Returns an empty array for recipes that do not exist
*/
SqlTiddlerStore.prototype.getRecipeTiddlers = function(recipename) {
	return this.sqlTiddlerDatabase.getRecipeTiddlers(recipename);
};

/*
Get the names of the bags in a recipe. Returns an empty array for recipes that do not exist
*/
SqlTiddlerStore.prototype.getRecipeBags = function(recipename) {
	return this.sqlTiddlerDatabase.getRecipeBags(recipename);
};

exports.SqlTiddlerStore = SqlTiddlerStore;

})();