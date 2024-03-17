/*\
title: $:/plugins/tiddlywiki/multiwikiserver/store/sql-tiddler-database.js
type: application/javascript
module-type: library

Low level SQL functions to store and retrieve tiddlers in a SQLite database.

This class is intended to encapsulate all the SQL queries used to access the database.
Validation is for the most part left to the caller

\*/

(function() {

/*
Create a tiddler store. Options include:

databasePath - path to the database file (can be ":memory:" to get a temporary database)
engine - wasm | better
*/
function SqlTiddlerDatabase(options) {
	options = options || {};
	const SqlEngine = require("$:/plugins/tiddlywiki/multiwikiserver/store/sql-engine.js").SqlEngine;
	this.engine = new SqlEngine({
		databasePath: options.databasePath,
		engine: options.engine
	});
}

SqlTiddlerDatabase.prototype.close = function() {
	this.engine.close();
};


SqlTiddlerDatabase.prototype.transaction = function(fn) {
	return this.engine.transaction(fn);
};

SqlTiddlerDatabase.prototype.createTables = function() {
	this.engine.runStatements([`
		-- Bags have names and access control settings
		CREATE TABLE IF NOT EXISTS bags (
			bag_id INTEGER PRIMARY KEY AUTOINCREMENT,
			bag_name TEXT UNIQUE NOT NULL,
			accesscontrol TEXT NOT NULL,
			description TEXT NOT NULL
		)
	`,`
		-- Recipes have names...
		CREATE TABLE IF NOT EXISTS recipes (
			recipe_id INTEGER PRIMARY KEY AUTOINCREMENT,
			recipe_name TEXT UNIQUE NOT NULL,
			description TEXT NOT NULL
		)
	`,`
		-- ...and recipes also have an ordered list of bags
		CREATE TABLE IF NOT EXISTS recipe_bags (
			recipe_id INTEGER NOT NULL,
			bag_id INTEGER NOT NULL,
			position INTEGER NOT NULL,
			FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id) ON UPDATE CASCADE ON DELETE CASCADE,
			FOREIGN KEY (bag_id) REFERENCES bags(bag_id) ON UPDATE CASCADE ON DELETE CASCADE,
			UNIQUE (recipe_id, bag_id)
		)
	`,`
		-- Tiddlers are contained in bags and have titles
		CREATE TABLE IF NOT EXISTS tiddlers (
			tiddler_id INTEGER PRIMARY KEY AUTOINCREMENT,
			bag_id INTEGER NOT NULL,
			title TEXT NOT NULL,
			is_deleted BOOLEAN NOT NULL,
			attachment_blob TEXT, -- null or the name of an attachment blob
			FOREIGN KEY (bag_id) REFERENCES bags(bag_id) ON UPDATE CASCADE ON DELETE CASCADE,
			UNIQUE (bag_id, title)
		)
	`,`
		-- Tiddlers also have unordered lists of fields, each of which has a name and associated value
		CREATE TABLE IF NOT EXISTS fields (
			tiddler_id INTEGER,
			field_name TEXT NOT NULL,
			field_value TEXT NOT NULL,
			FOREIGN KEY (tiddler_id) REFERENCES tiddlers(tiddler_id) ON UPDATE CASCADE ON DELETE CASCADE,
			UNIQUE (tiddler_id, field_name)
		)
	`]);
};

SqlTiddlerDatabase.prototype.listBags = function() {
	const rows = this.engine.runStatementGetAll(`
		SELECT bag_name, accesscontrol, description
		FROM bags
		ORDER BY bag_name
	`);
	return rows;
};

SqlTiddlerDatabase.prototype.createBag = function(bagname,description,accesscontrol) {
	accesscontrol = accesscontrol || "";
	// Run the queries
	this.engine.runStatement(`
		INSERT OR IGNORE INTO bags (bag_name, accesscontrol, description)
		VALUES ($bag_name, '', '')
	`,{
		$bag_name: bagname
	});
	this.engine.runStatement(`
		UPDATE bags
		SET accesscontrol = $accesscontrol,
		description = $description 
		WHERE bag_name = $bag_name
	`,{
		$bag_name: bagname,
		$accesscontrol: accesscontrol,
		$description: description
	});
};

/*
Returns array of {recipe_name:,description:,bag_names: []}
*/
SqlTiddlerDatabase.prototype.listRecipes = function() {
	const rows = this.engine.runStatementGetAll(`
		SELECT r.recipe_name, r.description, b.bag_name, rb.position
		FROM recipes AS r
		JOIN recipe_bags AS rb ON rb.recipe_id = r.recipe_id
		JOIN bags AS b ON rb.bag_id = b.bag_id
		ORDER BY r.recipe_name, rb.position
	`);
	const results = [];
	let currentRecipeName = null, currentRecipeIndex = -1;
	for(const row of rows) {
		if(row.recipe_name !== currentRecipeName) {
			currentRecipeName = row.recipe_name;
			currentRecipeIndex += 1;
			results.push({
				recipe_name: row.recipe_name,
				description: row.description,
				bag_names: []
			});
		}
		results[currentRecipeIndex].bag_names.push(row.bag_name);
	}
	return results;
};

SqlTiddlerDatabase.prototype.createRecipe = function(recipename,bagnames,description) {
	// Run the queries
	this.engine.runStatement(`
		-- Delete existing recipe_bags entries for this recipe
		DELETE FROM recipe_bags WHERE recipe_id = (SELECT recipe_id FROM recipes WHERE recipe_name = $recipe_name)
	`,{
		$recipe_name: recipename
	});
	this.engine.runStatement(`
		-- Create the entry in the recipes table if required
		INSERT OR REPLACE INTO recipes (recipe_name, description)
		VALUES ($recipe_name, $description)
	`,{
		$recipe_name: recipename,
		$description: description
	});
	this.engine.runStatement(`
		INSERT INTO recipe_bags (recipe_id, bag_id, position)
		SELECT r.recipe_id, b.bag_id, j.key as position
		FROM recipes r
		JOIN bags b
		INNER JOIN json_each($bag_names) AS j ON j.value = b.bag_name
		WHERE r.recipe_name = $recipe_name
	`,{
		$recipe_name: recipename,
		$bag_names: JSON.stringify(bagnames)
	});
};

/*
Returns {tiddler_id:}
*/
SqlTiddlerDatabase.prototype.saveBagTiddler = function(tiddlerFields,bagname,attachment_blob) {
	attachment_blob = attachment_blob || null;
	// Update the tiddlers table
	var info = this.engine.runStatement(`
		INSERT OR REPLACE INTO tiddlers (bag_id, title, is_deleted, attachment_blob)
		VALUES (
			(SELECT bag_id FROM bags WHERE bag_name = $bag_name),
			$title,
			FALSE,
			$attachment_blob
		)
	`,{
		$title: tiddlerFields.title,
		$attachment_blob: attachment_blob,
		$bag_name: bagname
	});
	// Update the fields table
	this.engine.runStatement(`
		INSERT OR REPLACE INTO fields (tiddler_id, field_name, field_value)
		SELECT
			t.tiddler_id,
			json_each.key AS field_name,
			json_each.value AS field_value
		FROM (
			SELECT tiddler_id
			FROM tiddlers
			WHERE bag_id = (
				SELECT bag_id
				FROM bags
				WHERE bag_name = $bag_name
			) AND title = $title
		) AS t
		JOIN json_each($field_values) AS json_each
	`,{
		$title: tiddlerFields.title,
		$bag_name: bagname,
		$field_values: JSON.stringify(Object.assign({},tiddlerFields,{title: undefined}))
	});
	return {
		tiddler_id: info.lastInsertRowid
	}
};

/*
Returns {tiddler_id:,bag_name:} or null if the recipe is empty
*/
SqlTiddlerDatabase.prototype.saveRecipeTiddler = function(tiddlerFields,recipename,attachment_blob) {
	// Find the topmost bag in the recipe
	var row = this.engine.runStatementGet(`
		SELECT b.bag_name
		FROM bags AS b
		JOIN (
			SELECT rb.bag_id
			FROM recipe_bags AS rb
			WHERE rb.recipe_id = (
				SELECT recipe_id
				FROM recipes
				WHERE recipe_name = $recipe_name
			)
			ORDER BY rb.position DESC
			LIMIT 1
		) AS selected_bag
		ON b.bag_id = selected_bag.bag_id
	`,{
		$recipe_name: recipename
	});
	if(!row) {
		return null;
	}
	// Save the tiddler to the topmost bag
	var info = this.saveBagTiddler(tiddlerFields,row.bag_name,attachment_blob);
	return {
		tiddler_id: info.tiddler_id,
		bag_name: row.bag_name
	};
};

SqlTiddlerDatabase.prototype.deleteTiddler = function(title,bagname) {
	// Delete the fields of this tiddler
	this.engine.runStatement(`
		DELETE FROM fields
		WHERE tiddler_id IN (
			SELECT t.tiddler_id
			FROM tiddlers AS t
			INNER JOIN bags AS b ON t.bag_id = b.bag_id
			WHERE b.bag_name = $bag_name AND t.title = $title
		)
	`,{
		$title: title,
		$bag_name: bagname
	});
	// Mark the tiddler itself as deleted
	this.engine.runStatement(`
		INSERT OR REPLACE INTO tiddlers (bag_id, title, is_deleted, attachment_blob)
		VALUES (
			(SELECT bag_id FROM bags WHERE bag_name = $bag_name),
			$title,
			TRUE,
			NULL
		)
	`,{
		$title: title,
		$bag_name: bagname
	});
};

/*
returns {tiddler_id:,tiddler:,attachment_blob:}
*/
SqlTiddlerDatabase.prototype.getBagTiddler = function(title,bagname) {
	const rowTiddler = this.engine.runStatementGet(`
		SELECT t.tiddler_id, t.attachment_blob
		FROM bags AS b
		INNER JOIN tiddlers AS t ON b.bag_id = t.bag_id
		WHERE t.title = $title AND b.bag_name = $bag_name AND t.is_deleted = FALSE
	`,{
		$title: title,
		$bag_name: bagname
	});
	if(!rowTiddler) {
		return null;
	}
	const rows = this.engine.runStatementGetAll(`
		SELECT field_name, field_value, tiddler_id
		FROM fields
		WHERE tiddler_id = $tiddler_id
	`,{
		$tiddler_id: rowTiddler.tiddler_id
	});
	if(rows.length === 0) {
		return null;
	} else {
		return {
			tiddler_id: rows[0].tiddler_id,
			attachment_blob: rowTiddler.attachment_blob,
			tiddler: rows.reduce((accumulator,value) => {
					accumulator[value["field_name"]] = value.field_value;
					return accumulator;
				},{title: title})
		};
	}
};

/*
Returns {bag_name:, tiddler: {fields}, tiddler_id:, attachment_blob:}
*/
SqlTiddlerDatabase.prototype.getRecipeTiddler = function(title,recipename) {
	const rowTiddlerId = this.engine.runStatementGet(`	
		SELECT t.tiddler_id, t.attachment_blob, b.bag_name
		FROM bags AS b
		INNER JOIN recipe_bags AS rb ON b.bag_id = rb.bag_id
		INNER JOIN recipes AS r ON rb.recipe_id = r.recipe_id
		INNER JOIN tiddlers AS t ON b.bag_id = t.bag_id
		WHERE r.recipe_name = $recipe_name
		AND t.title = $title
		AND t.is_deleted = FALSE
		ORDER BY rb.position DESC
		LIMIT 1
	`,{
		$title: title,
		$recipe_name: recipename
	});
	if(!rowTiddlerId) {
		return null;
	}
	// Get the fields
	const rows = this.engine.runStatementGetAll(`
		SELECT field_name, field_value
		FROM fields
		WHERE tiddler_id = $tiddler_id
	`,{
		$tiddler_id: rowTiddlerId.tiddler_id
	});
	return {
		bag_name: rowTiddlerId.bag_name,
		tiddler_id: rowTiddlerId.tiddler_id,
		attachment_blob: rowTiddlerId.attachment_blob,
		tiddler: rows.reduce((accumulator,value) => {
				accumulator[value["field_name"]] = value.field_value;
				return accumulator;
			},{title: title})
	};
};

/*
Get the titles of the tiddlers in a bag. Returns an empty array for bags that do not exist
*/
SqlTiddlerDatabase.prototype.getBagTiddlers = function(bagname) {
	const rows = this.engine.runStatementGetAll(`
		SELECT DISTINCT title
		FROM tiddlers
		WHERE bag_id IN (
			SELECT bag_id
			FROM bags
			WHERE bag_name = $bag_name
		)
		AND tiddlers.is_deleted = FALSE
		ORDER BY title ASC
	`,{
		$bag_name: bagname
	});
	return rows.map(value => value.title);
};

/*
Get the titles of the tiddlers in a recipe as {title:,bag_name:}. Returns null for recipes that do not exist
*/
SqlTiddlerDatabase.prototype.getRecipeTiddlers = function(recipename) {
	const rowsCheckRecipe = this.engine.runStatementGetAll(`
		SELECT * FROM recipes WHERE recipes.recipe_name = $recipe_name
	`,{
		$recipe_name: recipename
	});
	if(rowsCheckRecipe.length === 0) {
		return null;
	}
	const rows = this.engine.runStatementGetAll(`
		SELECT title, bag_name
		FROM (
			SELECT t.title, b.bag_name, MAX(rb.position) AS position
			FROM bags AS b
			INNER JOIN recipe_bags AS rb ON b.bag_id = rb.bag_id
			INNER JOIN recipes AS r ON rb.recipe_id = r.recipe_id
			INNER JOIN tiddlers AS t ON b.bag_id = t.bag_id
			WHERE r.recipe_name = $recipe_name
			AND t.is_deleted = FALSE
			GROUP BY t.title
			ORDER BY t.title
		)
	`,{
		$recipe_name: recipename
	});
	return rows;
};

SqlTiddlerDatabase.prototype.deleteAllTiddlersInBag = function(bagname) {
	// Delete the fields
	this.engine.runStatement(`
		DELETE FROM fields
		WHERE tiddler_id IN (
			SELECT tiddler_id
			FROM tiddlers
			WHERE bag_id = (SELECT bag_id FROM bags WHERE bag_name = $bag_name)
			AND is_deleted = FALSE
		)
	`,{
		$bag_name: bagname
	});
	// Mark the tiddlers as deleted
	this.engine.runStatement(`
		UPDATE tiddlers
		SET is_deleted = TRUE
		WHERE bag_id = (SELECT bag_id FROM bags WHERE bag_name = $bag_name)
		AND is_deleted = FALSE
	`,{
		$bag_name: bagname
	});
};

/*
Get the names of the bags in a recipe. Returns an empty array for recipes that do not exist
*/
SqlTiddlerDatabase.prototype.getRecipeBags = function(recipename) {
	const rows = this.engine.runStatementGetAll(`
		SELECT bags.bag_name
		FROM bags
		JOIN (
			SELECT rb.bag_id, rb.position as position
			FROM recipe_bags AS rb
			JOIN recipes AS r ON rb.recipe_id = r.recipe_id
			WHERE r.recipe_name = $recipe_name
			ORDER BY rb.position
		) AS bag_priority ON bags.bag_id = bag_priority.bag_id
		ORDER BY position
	`,{
		$recipe_name: recipename
	});
	return rows.map(value => value.bag_name);
};

exports.SqlTiddlerDatabase = SqlTiddlerDatabase;

})();