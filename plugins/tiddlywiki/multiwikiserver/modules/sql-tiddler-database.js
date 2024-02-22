/*\
title: $:/plugins/tiddlywiki/multiwikiserver/sql-tiddler-database.js
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
	// Initialise the statement cache
	this.statements = Object.create(null); // Hashmap by SQL text of statement objects
	// Create the database file directories if needed
	if(options.databasePath) {
		$tw.utils.createFileDirectories(options.databasePath);
	}
	// Choose engine
	this.engine = options.engine || "wasm"; // wasm | better
	// Create the database
	const databasePath = options.databasePath || ":memory:";
	let Database;
	console.log(`Creating SQL engine ${this.engine}`)
	switch(this.engine) {
		case "wasm":
			({ Database } = require("node-sqlite3-wasm"));
			break;
		case "better":
			Database = require("better-sqlite3");
			break;
	}
	this.db = new Database(databasePath,{
		verbose: undefined && console.log
	});
	this.transactionDepth = 0;
}

SqlTiddlerDatabase.prototype.close = function() {
	for(const sql in this.statements) {
		this.statements[sql].finalize();
	}
	this.statements = Object.create(null);
	this.db.close();
	this.db = undefined;
};

SqlTiddlerDatabase.prototype.normaliseParams = function(params) {
	params = params || {};
	const result = Object.create(null);
	for(const paramName in params) {
		if(this.engine !== "wasm" && paramName.startsWith("$")) {
			result[paramName.slice(1)] = params[paramName];
		} else {
			result[paramName] = params[paramName];
		}
	}
	return result;
};

SqlTiddlerDatabase.prototype.prepareStatement = function(sql) {
	if(!(sql in this.statements)) {
		this.statements[sql] = this.db.prepare(sql);
	}
	return this.statements[sql];
};

SqlTiddlerDatabase.prototype.runStatement = function(sql,params) {
	params = this.normaliseParams(params);
	const statement = this.prepareStatement(sql);
	return statement.run(params);
};

SqlTiddlerDatabase.prototype.runStatementGet = function(sql,params) {
	params = this.normaliseParams(params);
	const statement = this.prepareStatement(sql);
	return statement.get(params);
};

SqlTiddlerDatabase.prototype.runStatementGetAll = function(sql,params) {
	params = this.normaliseParams(params);
	const statement = this.prepareStatement(sql);
	return statement.all(params);
};

SqlTiddlerDatabase.prototype.runStatements = function(sqlArray) {
	for(const sql of sqlArray) {
		this.runStatement(sql);
	}
};

SqlTiddlerDatabase.prototype.createTables = function() {
	this.runStatements([`
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

SqlTiddlerDatabase.prototype.logTables = function() {
	var self = this;
	function sqlLogTable(table) {
		console.log(`TABLE ${table}:`);
		let statement = self.db.prepare(`select * from ${table}`);
		for(const row of statement.all()) {
			console.log(row);
		}
	}
	const tables = ["recipes","bags","recipe_bags","tiddlers","fields"];
	for(const table of tables) {
		sqlLogTable(table);
	}
};

SqlTiddlerDatabase.prototype.listBags = function() {
	const rows = this.runStatementGetAll(`
		SELECT bag_name, accesscontrol, description
		FROM bags
		ORDER BY bag_name
	`);
	return rows;
};

SqlTiddlerDatabase.prototype.createBag = function(bagname,description) {
	// Run the queries
	this.runStatement(`
		INSERT OR IGNORE INTO bags (bag_name, accesscontrol, description)
		VALUES ($bag_name, '', '')
	`,{
		$bag_name: bagname
	});
	this.runStatement(`
		UPDATE bags
		SET accesscontrol = $accesscontrol,
		description = $description 
		WHERE bag_name = $bag_name
	`,{
		$bag_name: bagname,
		$accesscontrol: "[some access control stuff]",
		$description: description
	});
};

/*
Returns array of {recipe_name:,description:,bag_names: []}
*/
SqlTiddlerDatabase.prototype.listRecipes = function() {
	const rows = this.runStatementGetAll(`
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
	this.runStatement(`
		-- Delete existing recipe_bags entries for this recipe
		DELETE FROM recipe_bags WHERE recipe_id = (SELECT recipe_id FROM recipes WHERE recipe_name = $recipe_name)
	`,{
		$recipe_name: recipename
	});
	this.runStatement(`
		-- Create the entry in the recipes table if required
		INSERT OR REPLACE INTO recipes (recipe_name, description)
		VALUES ($recipe_name, $description)
	`,{
		$recipe_name: recipename,
		$description: description
	});
	this.runStatement(`
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
SqlTiddlerDatabase.prototype.saveBagTiddler = function(tiddlerFields,bagname) {
	// Update the tiddlers table
	var info = this.runStatement(`
		INSERT OR REPLACE INTO tiddlers (bag_id, title)
		VALUES (
			(SELECT bag_id FROM bags WHERE bag_name = $bag_name),
			$title
		)
	`,{
		$title: tiddlerFields.title,
		$bag_name: bagname
	});
	// Update the fields table
	this.runStatement(`
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
SqlTiddlerDatabase.prototype.saveRecipeTiddler = function(tiddlerFields,recipename) {
	// Find the topmost bag in the recipe
	var row = this.runStatementGet(`
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
	var info = this.saveBagTiddler(tiddlerFields,row.bag_name);
	return {
		tiddler_id: info.tiddler_id,
		bag_name: row.bag_name
	};
};

SqlTiddlerDatabase.prototype.deleteTiddler = function(title,bagname) {
	// Run the queries
	this.runStatement(`
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
	this.runStatement(`
		DELETE FROM tiddlers
		WHERE bag_id = (
			SELECT bag_id
			FROM bags
			WHERE bag_name = $bag_name
		) AND title = $title
	`,{
		$title: title,
		$bag_name: bagname
	});
};

/*
returns {tiddler_id:,tiddler:}
*/
SqlTiddlerDatabase.prototype.getBagTiddler = function(title,bagname) {
	const rows = this.runStatementGetAll(`
		SELECT field_name, field_value, tiddler_id
		FROM fields
		WHERE tiddler_id = (
			SELECT t.tiddler_id
			FROM bags AS b
			INNER JOIN tiddlers AS t ON b.bag_id = t.bag_id
			WHERE t.title = $title AND b.bag_name = $bag_name
		)
	`,{
		$title: title,
		$bag_name: bagname
	});
	if(rows.length === 0) {
		return null;
	} else {
		return {
			tiddler_id: rows[0].tiddler_id,
			tiddler: rows.reduce((accumulator,value) => {
					accumulator[value["field_name"]] = value.field_value;
					return accumulator;
				},{title: title})
		};
	}
};

/*
Returns {bag_name:, tiddler: {fields}, tiddler_id:}
*/
SqlTiddlerDatabase.prototype.getRecipeTiddler = function(title,recipename) {
	const rowTiddlerId = this.runStatementGet(`	
		SELECT t.tiddler_id, b.bag_name
		FROM bags AS b
		INNER JOIN recipe_bags AS rb ON b.bag_id = rb.bag_id
		INNER JOIN recipes AS r ON rb.recipe_id = r.recipe_id
		INNER JOIN tiddlers AS t ON b.bag_id = t.bag_id
		WHERE r.recipe_name = $recipe_name
		AND t.title = $title
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
	const rows = this.runStatementGetAll(`
		SELECT field_name, field_value
		FROM fields
		WHERE tiddler_id = $tiddler_id
	`,{
		$tiddler_id: rowTiddlerId.tiddler_id
	});
	return {
		bag_name: rowTiddlerId.bag_name,
		tiddler_id: rowTiddlerId.tiddler_id,
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
	const rows = this.runStatementGetAll(`
		SELECT DISTINCT title
		FROM tiddlers
		WHERE bag_id IN (
			SELECT bag_id
			FROM bags
			WHERE bag_name = $bag_name
		)
		ORDER BY title ASC
	`,{
		$bag_name: bagname
	});
	return rows.map(value => value.title);
};

/*
Get the titles of the tiddlers in a recipe as {title:,bag_name:}. Returns an empty array for recipes that do not exist
*/
SqlTiddlerDatabase.prototype.getRecipeTiddlers = function(recipename) {
	const rows = this.runStatementGetAll(`
		SELECT title, bag_name
		FROM (
			SELECT t.title, b.bag_name, MAX(rb.position) AS position
			FROM bags AS b
			INNER JOIN recipe_bags AS rb ON b.bag_id = rb.bag_id
			INNER JOIN recipes AS r ON rb.recipe_id = r.recipe_id
			INNER JOIN tiddlers AS t ON b.bag_id = t.bag_id
			WHERE r.recipe_name = $recipe_name
			GROUP BY t.title
			ORDER BY t.title
		)
	`,{
		$recipe_name: recipename
	});
	return rows;
};

SqlTiddlerDatabase.prototype.deleteAllTiddlersInBag = function(bagname) {
	this.runStatement(`
		DELETE FROM tiddlers
		WHERE bag_id IN (
			SELECT bag_id
			FROM bags
			WHERE bag_name = $bag_name
		)
	`,{
		$bag_name: bagname
	});
};

/*
Get the names of the bags in a recipe. Returns an empty array for recipes that do not exist
*/
SqlTiddlerDatabase.prototype.getRecipeBags = function(recipename) {
	const rows = this.runStatementGetAll(`
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

/*
Execute the given function in a transaction, committing if successful but rolling back if an error occurs.  Returns whatever the given function returns.

Calls to this function can be safely nested, but only the top-most call will actually take place in a transaction.
*/
SqlTiddlerDatabase.prototype.transaction = function(fn) {
	const alreadyInTransaction = this.transactionDepth > 0;
	this.transactionDepth++;
	if(alreadyInTransaction) {
		return fn();
	} else {
		try {
			this.runStatement(`BEGIN TRANSACTION`);
			var result = fn();
			this.runStatement(`COMMIT TRANSACTION`);
		} catch(e) {
			this.runStatement(`ROLLBACK TRANSACTION`);
		} finally {
			this.transactionDepth--;
		}
		return result;
	}
};

exports.SqlTiddlerDatabase = SqlTiddlerDatabase;

})();