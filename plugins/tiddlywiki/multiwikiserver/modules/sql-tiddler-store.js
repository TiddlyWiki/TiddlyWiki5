/*\
title: $:/plugins/tiddlywiki/multiwikiserver/sql-tiddler-store.js
type: application/javascript
module-type: library

Higher level functions to perform basic tiddler operations with a sqlite3 database.

This class is largely a wrapper for the sql-tiddler-database.js class, adding the following functionality:

* Synchronising bag and recipe names to the admin wiki
* Handling _canonical_uri tiddlers

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
	this.entityStateTiddlerPrefix = "_multiwikiserver/";
	// Create the database
	this.databasePath = options.databasePath || ":memory:";
	var SqlTiddlerDatabase = require("$:/plugins/tiddlywiki/multiwikiserver/sql-tiddler-database.js").SqlTiddlerDatabase;
	this.sqlTiddlerDatabase = new SqlTiddlerDatabase({
		databasePath: this.databasePath
	});
	this.sqlTiddlerDatabase.createTables();
	this.updateAdminWiki();
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
			text: recipeInfo.description,
			list: $tw.utils.stringifyList(this.getRecipeBags(recipeInfo.recipe_name).map(bag_name => {
				return this.entityStateTiddlerPrefix + "bags/" + bag_name;
			}))
		});
	}
};

/*
Given tiddler fields, tiddler_id and a bagname, return the tiddler fields after the following process:
- If the text field is over a threshold, modify the tiddler to use _canonical_uri
- Apply the tiddler_id as the revision field
- Apply the bag_name as the bag field
*/
SqlTiddlerStore.prototype.processOutgoingTiddler = function(tiddlerFields,tiddler_id,bag_name,recipe_name) {
	if((tiddlerFields.text || "").length > 10 * 1024 * 1024) {
		return Object.assign({},tiddlerFields,{
			revision: "" + tiddler_id,
			bag: bag_name,
			text: undefined,
			_canonical_uri: recipe_name
				? `/wiki/${recipe_name}/recipes/${recipe_name}/tiddlers/${title}`
				: `/wiki/${bag_name}/bags/${bag_name}/tiddlers/${title}`
		});
	} else {
		return Object.assign({},tiddlerFields,{
			revision: "" + tiddler_id,
			bag: bag_name
		});
	}
};


SqlTiddlerStore.prototype.saveTiddlersFromPath = function(tiddler_files_path,bag_name) {
	// Clear out the bag
	this.deleteAllTiddlersInBag(bag_name);
	// Get the tiddlers
	var path = require("path");
	var tiddlersFromPath = $tw.loadTiddlersFromPath(path.resolve($tw.boot.corePath,$tw.config.editionsPath,tiddler_files_path));
	// Save the tiddlers
	for(const tiddlersFromFile of tiddlersFromPath) {
		for(const tiddler of tiddlersFromFile.tiddlers) {
			this.saveBagTiddler(tiddler,bag_name);
		}
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

SqlTiddlerStore.prototype.createRecipe = function(recipename,bagnames,description) {
	bagnames = bagnames || [];
	description = description || "";
	this.sqlTiddlerDatabase.createRecipe(recipename,bagnames,description);
	this.saveEntityStateTiddler({
		title: "recipes/" + recipename,
		"recipe-name": recipename,
		text: description,
		list: $tw.utils.stringifyList(bagnames.map(bag_name => {
			return this.entityStateTiddlerPrefix + "bags/" + bag_name;
		}))
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
	var tiddlerInfo = this.sqlTiddlerDatabase.getBagTiddler(title,bagname);
	if(tiddlerInfo) {
		return Object.assign(
			{},
			tiddlerInfo,
			{
				tiddler: this.processOutgoingTiddler(tiddlerInfo.tiddler,tiddlerInfo.tiddler_id,bagname,null)
			});	
	} else {
		return null;
	}
};

/*
Returns {bag_name:, tiddler: {fields}, tiddler_id:}
*/
SqlTiddlerStore.prototype.getRecipeTiddler = function(title,recipename) {
	var tiddlerInfo = this.sqlTiddlerDatabase.getRecipeTiddler(title,recipename);
	if(tiddlerInfo) {
		return Object.assign(
			{},
			tiddlerInfo,
			{
				tiddler: this.processOutgoingTiddler(tiddlerInfo.tiddler,tiddlerInfo.tiddler_id,tiddlerInfo.bag_name,recipename)
			});
	} else {
		return null;
	}
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

SqlTiddlerStore.prototype.deleteAllTiddlersInBag = function(bagname) {
	return this.sqlTiddlerDatabase.deleteAllTiddlersInBag(bagname);
};

/*
Get the names of the bags in a recipe. Returns an empty array for recipes that do not exist
*/
SqlTiddlerStore.prototype.getRecipeBags = function(recipename) {
	return this.sqlTiddlerDatabase.getRecipeBags(recipename);
};

exports.SqlTiddlerStore = SqlTiddlerStore;

})();