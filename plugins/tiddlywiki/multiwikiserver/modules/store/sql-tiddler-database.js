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
	/** @type {SqlEngine} */
	this.engine = new SqlEngine({
		databasePath: options.databasePath,
		engine: options.engine
	});
	this.entityTypeToTableMap = {
		bag: {
			table: "bags",
			column: "bag_name"
		},
		recipe: {
			table: "recipes",
			column: "recipe_name"
		}
	};
}

SqlTiddlerDatabase.prototype.init = async function() {
	await this.engine.init();
};

SqlTiddlerDatabase.prototype.close = async function() {
	await this.engine.close();
};


SqlTiddlerDatabase.prototype.transaction = async function(fn) {
	return await this.engine.transaction(fn);
};

SqlTiddlerDatabase.prototype.createTables = async function() {
	await this.engine.runStatements([`
		-- Users table
		CREATE TABLE IF NOT EXISTS users (
			user_id INTEGER PRIMARY KEY AUTOINCREMENT,
			username TEXT UNIQUE NOT NULL,
			email TEXT UNIQUE NOT NULL,
			password TEXT NOT NULL,
			created_at TEXT DEFAULT (datetime('now')),
			last_login TEXT
		)
	`,`
		-- User Session  table
		CREATE TABLE IF NOT EXISTS sessions (
			user_id INTEGER NOT NULL,
			session_id TEXT NOT NULL,
			created_at TEXT NOT NULL,
			last_accessed TEXT NOT NULL,
			PRIMARY KEY (session_id),
			FOREIGN KEY (user_id) REFERENCES users(user_id)
		)
	`,`
		-- Groups table
		CREATE TABLE IF NOT EXISTS groups (
			group_id INTEGER PRIMARY KEY AUTOINCREMENT,
			group_name TEXT UNIQUE NOT NULL,
			description TEXT
		)
	`,`
		-- Roles table
		CREATE TABLE IF NOT EXISTS roles (
			role_id INTEGER PRIMARY KEY AUTOINCREMENT,
			role_name TEXT UNIQUE NOT NULL,
			description TEXT
		)
	`,`
		-- Permissions table
		CREATE TABLE IF NOT EXISTS permissions (
			permission_id INTEGER PRIMARY KEY AUTOINCREMENT,
			permission_name TEXT UNIQUE NOT NULL,
			description TEXT
		)
	`,`
		-- User-Group association table
		CREATE TABLE IF NOT EXISTS user_groups (
			user_id INTEGER,
			group_id INTEGER,
			PRIMARY KEY (user_id, group_id),
			FOREIGN KEY (user_id) REFERENCES users(user_id),
			FOREIGN KEY (group_id) REFERENCES groups(group_id)
		)
	`,`
		-- User-Role association table
		CREATE TABLE IF NOT EXISTS user_roles (
			user_id INTEGER,
			role_id INTEGER,
			PRIMARY KEY (user_id, role_id),
			FOREIGN KEY (user_id) REFERENCES users(user_id),
			FOREIGN KEY (role_id) REFERENCES roles(role_id)
		)
	`,`
		-- Group-Role association table
		CREATE TABLE IF NOT EXISTS group_roles (
			group_id INTEGER,
			role_id INTEGER,
			PRIMARY KEY (group_id, role_id),
			FOREIGN KEY (group_id) REFERENCES groups(group_id),
			FOREIGN KEY (role_id) REFERENCES roles(role_id)
		)
	`,`
		-- Role-Permission association table
		CREATE TABLE IF NOT EXISTS role_permissions (
			role_id INTEGER,
			permission_id INTEGER,
			PRIMARY KEY (role_id, permission_id),
			FOREIGN KEY (role_id) REFERENCES roles(role_id),
			FOREIGN KEY (permission_id) REFERENCES permissions(permission_id)
		)
	`,`
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
			description TEXT NOT NULL,
			owner_id INTEGER,
			FOREIGN KEY (owner_id) REFERENCES users(user_id)
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
	`,`
		-- ACL table (using bag/recipe ids directly)
		CREATE TABLE IF NOT EXISTS acl (
			acl_id INTEGER PRIMARY KEY AUTOINCREMENT,
			entity_name TEXT NOT NULL,
			entity_type TEXT NOT NULL CHECK (entity_type IN ('bag', 'recipe')),
			role_id INTEGER,
			permission_id INTEGER,
			FOREIGN KEY (role_id) REFERENCES roles(role_id),
			FOREIGN KEY (permission_id) REFERENCES permissions(permission_id)
		)
	`,`
		-- Indexes for performance (we can add more as needed based on query patterns)
		CREATE INDEX IF NOT EXISTS idx_tiddlers_bag_id ON tiddlers(bag_id)
	`,`
		CREATE INDEX IF NOT EXISTS idx_fields_tiddler_id ON fields(tiddler_id)
	`,`
		CREATE INDEX IF NOT EXISTS idx_recipe_bags_recipe_id ON recipe_bags(recipe_id)
	`,`
		CREATE INDEX IF NOT EXISTS idx_acl_entity_id ON acl(entity_name)
	`]);
};

SqlTiddlerDatabase.prototype.listBags = async function() {
	const rows = await this.engine.runStatementGetAll(`
		SELECT bag_name, bag_id, accesscontrol, description
		FROM bags
		ORDER BY bag_name
	`);
	return rows;
};

/*
Create or update a bag
Returns the bag_id of the bag
*/
SqlTiddlerDatabase.prototype.createBag = async function(bag_name,description,accesscontrol) {
	accesscontrol = accesscontrol || "";
	// Run the queries
	var bag = await this.engine.runStatement(`
		INSERT OR IGNORE INTO bags (bag_name, accesscontrol, description)
		VALUES ($bag_name, '', '')
	`,{
		$bag_name: bag_name
	});
	const updateBags = await this.engine.runStatement(`
		UPDATE bags
		SET accesscontrol = $accesscontrol,
		description = $description 
		WHERE bag_name = $bag_name
	`,{
		$bag_name: bag_name,
		$accesscontrol: accesscontrol,
		$description: description
	});
	return updateBags.lastInsertRowid;
};

/*
Returns array of {recipe_name:,recipe_id:,description:,bag_names: []}
*/
SqlTiddlerDatabase.prototype.listRecipes = async function() {
	const rows = await this.engine.runStatementGetAll(`
		SELECT r.recipe_name, r.recipe_id, r.description, r.owner_id, b.bag_name, rb.position
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
				recipe_id: row.recipe_id,
				description: row.description,
				owner_id: row.owner_id,
        /** @type {string[]} */
				bag_names: []
			});
		}
		results[currentRecipeIndex].bag_names.push(row.bag_name);
	}
	return results;
};

/*
Create or update a recipe
Returns the recipe_id of the recipe
*/
SqlTiddlerDatabase.prototype.createRecipe = async function(recipe_name,bag_names,description) {
	// Run the queries
	await this.engine.runStatement(`
		-- Delete existing recipe_bags entries for this recipe
		DELETE FROM recipe_bags WHERE recipe_id = (SELECT recipe_id FROM recipes WHERE recipe_name = $recipe_name)
	`,{
		$recipe_name: recipe_name
	});
	const updateRecipes = await this.engine.runStatement(`
		-- Create the entry in the recipes table if required
		INSERT OR REPLACE INTO recipes (recipe_name, description)
		VALUES ($recipe_name, $description)
	`,{
		$recipe_name: recipe_name,
		$description: description
	});
	await this.engine.runStatement(`
		INSERT INTO recipe_bags (recipe_id, bag_id, position)
		SELECT r.recipe_id, b.bag_id, j.key as position
		FROM recipes r
		JOIN bags b
		INNER JOIN json_each($bag_names) AS j ON j.value = b.bag_name
		WHERE r.recipe_name = $recipe_name
	`,{
		$recipe_name: recipe_name,
		$bag_names: JSON.stringify(bag_names)
	});

	return updateRecipes.lastInsertRowid;
};

/*
Assign a recipe to a user
*/
SqlTiddlerDatabase.prototype.assignRecipeToUser = async function(recipe_name,user_id) {
	await this.engine.runStatement(`
		UPDATE recipes SET owner_id = $user_id WHERE recipe_name = $recipe_name
	`,{
		$recipe_name: recipe_name,
		$user_id: user_id
	});
};

/*
Returns {tiddler_id:}
*/
SqlTiddlerDatabase.prototype.saveBagTiddler = async function(tiddlerFields,bag_name,attachment_blob) {
	attachment_blob = attachment_blob || null;
	// Update the tiddlers table
	var info = await this.engine.runStatement(`
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
		$bag_name: bag_name
	});
	// Update the fields table
	await this.engine.runStatement(`
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
		$bag_name: bag_name,
		$field_values: JSON.stringify(Object.assign({},tiddlerFields,{title: undefined}))
	});
	return {
		tiddler_id: info.lastInsertRowid
	}
};

/*
Returns {tiddler_id:,bag_name:} or null if the recipe is empty
*/
SqlTiddlerDatabase.prototype.saveRecipeTiddler = async function(tiddlerFields,recipe_name,attachment_blob) {
	// Find the topmost bag in the recipe
	var row = await this.engine.runStatementGet(`
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
		$recipe_name: recipe_name
	});
	if(!row) {
		return null;
	}
	// Save the tiddler to the topmost bag
	var info = await this.saveBagTiddler(tiddlerFields,row.bag_name,attachment_blob);
	return {
		tiddler_id: info.tiddler_id,
		bag_name: row.bag_name
	};
};

/*
Returns {tiddler_id:} of the delete marker
*/
SqlTiddlerDatabase.prototype.deleteTiddler = async function(title,bag_name) {
	// Delete the fields of this tiddler
	await this.engine.runStatement(`
		DELETE FROM fields
		WHERE tiddler_id IN (
			SELECT t.tiddler_id
			FROM tiddlers AS t
			INNER JOIN bags AS b ON t.bag_id = b.bag_id
			WHERE b.bag_name = $bag_name AND t.title = $title
		)
	`,{
		$title: title,
		$bag_name: bag_name
	});
	// Mark the tiddler itself as deleted
	const rowDeleteMarker = await this.engine.runStatement(`
		INSERT OR REPLACE INTO tiddlers (bag_id, title, is_deleted, attachment_blob)
		VALUES (
			(SELECT bag_id FROM bags WHERE bag_name = $bag_name),
			$title,
			TRUE,
			NULL
		)
	`,{
		$title: title,
		$bag_name: bag_name
	});
	return {tiddler_id: rowDeleteMarker.lastInsertRowid};
};

/*
returns {tiddler_id:,tiddler:,attachment_blob:}
*/
SqlTiddlerDatabase.prototype.getBagTiddler = async function(title,bag_name) {
	const rowTiddler = await this.engine.runStatementGet(`
		SELECT t.tiddler_id, t.attachment_blob
		FROM bags AS b
		INNER JOIN tiddlers AS t ON b.bag_id = t.bag_id
		WHERE t.title = $title AND b.bag_name = $bag_name AND t.is_deleted = FALSE
	`,{
		$title: title,
		$bag_name: bag_name
	});
	if(!rowTiddler) {
		return null;
	}
	const rows = await this.engine.runStatementGetAll(`
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
SqlTiddlerDatabase.prototype.getRecipeTiddler = async function(title,recipe_name) {
	const rowTiddlerId = await this.engine.runStatementGet(`	
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
		$recipe_name: recipe_name
	});
	if(!rowTiddlerId) {
		return null;
	}
	// Get the fields
	const rows = await this.engine.runStatementGetAll(`
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
Checks if a user has permission to access a recipe
*/
SqlTiddlerDatabase.prototype.hasRecipePermission = async function(userId, recipeName, permissionName) {
	try {
		// check if the user is the owner of the entity
		const recipe = await this.engine.runStatementGet(`
			SELECT owner_id 
			FROM recipes 
			WHERE recipe_name = $recipe_name
			`, {
				$recipe_name: recipeName
			});

		if(!!recipe?.owner_id && recipe?.owner_id === userId) {
			return true;
		} else {
			var permission = await this.checkACLPermission(userId, "recipe", recipeName, permissionName, recipe?.owner_id)
			return permission;
		}
			
	} catch (error) {
		console.error(error)
		return false
	}
};

/*
Checks if a user has permission to access a bag
*/
SqlTiddlerDatabase.prototype.hasBagPermission = async function(userId, bagName, permissionName) {
	return await this.checkACLPermission(userId, "bag", bagName, permissionName)
};
/**
 * @overload
 * @param {string} entityType 
 * @param {string} entityName 
 * @param {false} [fetchAll] 
 * @returns {Promise<Record<string, any>>}
 * 
 * @overload
 * @param {string} entityType
 * @param {string} entityName
 * @param {true} fetchAll
 * @returns {Promise<Record<string, any>[]>}
 */
SqlTiddlerDatabase.prototype.getACLByName = async function(entityType, entityName, fetchAll) {
	const entityInfo = this.entityTypeToTableMap[entityType];
	if (!entityInfo) {
		throw new Error("Invalid entity type: " + entityType);
	}

	// First, check if there's an ACL record for the entity and get the permission_id
	var checkACLExistsQuery = `
		SELECT acl.*, permissions.permission_name
		FROM acl
		LEFT JOIN permissions ON acl.permission_id = permissions.permission_id
		WHERE acl.entity_type = $entity_type
		AND acl.entity_name = $entity_name
	`;

	if (!fetchAll) {
		checkACLExistsQuery += ' LIMIT 1'
	}

	const aclRecord = await this.engine[fetchAll ? 'runStatementGetAll' : 'runStatementGet'](checkACLExistsQuery, {
		$entity_type: entityType,
		$entity_name: entityName
	});

	return aclRecord;
}

SqlTiddlerDatabase.prototype.checkACLPermission = async function(userId, entityType, entityName, permissionName, ownerId) {
	try {
		// if the entityName starts with "$:/", we'll assume its a system bag/recipe, then grant the user permission
		if(entityName.startsWith("$:/")) {
			return true;
		}

		const aclRecords = await this.getACLByName(entityType, entityName, true);
		const aclRecord = aclRecords.find(record => record.permission_name === permissionName);

		// If no ACL record exists, return true for hasPermission
		if ((!aclRecord && !ownerId && aclRecords.length === 0) || ((!!aclRecord && !!ownerId) && ownerId === userId)) {
			return true;
		}

		// If ACL record exists, check for user permission using the retrieved permission_id
		const checkPermissionQuery = `
			SELECT *
			FROM users u
			JOIN user_roles ur ON u.user_id = ur.user_id
			JOIN roles r ON ur.role_id = r.role_id
			JOIN acl a ON r.role_id = a.role_id
			WHERE u.user_id = $user_id
			AND a.entity_type = $entity_type
			AND a.entity_name = $entity_name
			AND a.permission_id = $permission_id
			LIMIT 1
		`;

		const result = await this.engine.runStatementGet(checkPermissionQuery, {
			$user_id: userId,
			$entity_type: entityType,
			$entity_name: entityName,
			$permission_id: aclRecord?.permission_id
		});
		
		let hasPermission = result !== undefined;

		return hasPermission;
			
	} catch (error) {
		console.error(error);
		return false
	}
};

/**
 * Returns the ACL records for an entity (bag or recipe)
 */
SqlTiddlerDatabase.prototype.getEntityAclRecords = async function(entityName) {
	const checkACLExistsQuery = `
		SELECT *
		FROM acl
		WHERE entity_name = $entity_name
	`;

	const aclRecords = await this.engine.runStatementGetAll(checkACLExistsQuery, {
		$entity_name: entityName
	});

	return aclRecords
}

/*
Get the entity by name
*/
SqlTiddlerDatabase.prototype.getEntityByName = async function(entityType, entityName) {
	const entityInfo = this.entityTypeToTableMap[entityType];
	if (entityInfo) {
	return await this.engine.runStatementGet(`SELECT * FROM ${entityInfo.table} WHERE ${entityInfo.column} = $entity_name`, {
		$entity_name: entityName
		});
	}
	return null;
}

/*
Get the titles of the tiddlers in a bag. Returns an empty array for bags that do not exist
*/
SqlTiddlerDatabase.prototype.getBagTiddlers = async function(bag_name) {
	const rows = await this.engine.runStatementGetAll(`
		SELECT DISTINCT title, tiddler_id
		FROM tiddlers
		WHERE bag_id IN (
			SELECT bag_id
			FROM bags
			WHERE bag_name = $bag_name
		)
		AND tiddlers.is_deleted = FALSE
		ORDER BY title ASC
	`,{
		$bag_name: bag_name
	});
	return rows;
};

/*
Get the tiddler_id of the newest tiddler in a bag. Returns null for bags that do not exist
*/
SqlTiddlerDatabase.prototype.getBagLastTiddlerId = async function(bag_name) {
	const row = await this.engine.runStatementGet(`
		SELECT tiddler_id
		FROM tiddlers
		WHERE bag_id IN (
			SELECT bag_id
			FROM bags
			WHERE bag_name = $bag_name
		)
		ORDER BY tiddler_id DESC
		LIMIT 1
	`,{
		$bag_name: bag_name
	});
	if(row) {
		return row.tiddler_id;
	} else {
		return null;
	}
};

/*
Get the metadata of the tiddlers in a recipe as an array [{title:,tiddler_id:,bag_name:,is_deleted:}],
sorted in ascending order of tiddler_id.

Options include:

limit: optional maximum number of results to return
last_known_tiddler_id: tiddler_id of the last known update. Only returns tiddlers that have been created, modified or deleted since
include_deleted: boolean, defaults to false

Returns null for recipes that do not exist
*/
SqlTiddlerDatabase.prototype.getRecipeTiddlers = async function(recipe_name,options) {
	options = options || {};
	// Get the recipe ID
	const rowsCheckRecipe = await this.engine.runStatementGet(`
		SELECT recipe_id FROM recipes WHERE recipes.recipe_name = $recipe_name
	`,{
		$recipe_name: recipe_name
	});
	if(!rowsCheckRecipe) {
		return null;
	}
	const recipe_id = rowsCheckRecipe.recipe_id;
	// Compose the query to get the tiddlers
	const params = {
		$recipe_id: recipe_id
	}
	if(options.limit) {
		params.$limit = options.limit.toString();
	}
	if(options.last_known_tiddler_id) {
		params.$last_known_tiddler_id = options.last_known_tiddler_id;
	}
	const rows = await this.engine.runStatementGetAll(`
		SELECT title, tiddler_id, is_deleted, bag_name
		FROM (
			SELECT t.title, t.tiddler_id, t.is_deleted, b.bag_name, MAX(rb.position) AS position
			FROM bags AS b
			INNER JOIN recipe_bags AS rb ON b.bag_id = rb.bag_id
			INNER JOIN tiddlers AS t ON b.bag_id = t.bag_id
			WHERE rb.recipe_id = $recipe_id
			${options.include_deleted ? "" : "AND t.is_deleted = FALSE"}
			${options.last_known_tiddler_id ? "AND tiddler_id > $last_known_tiddler_id" : ""}
			GROUP BY t.title
			ORDER BY t.title, tiddler_id DESC
			${options.limit ? "LIMIT $limit" : ""}
		)
	`,params);
	return rows;
};

/*
Get the tiddler_id of the newest tiddler in a recipe. Returns null for recipes that do not exist
*/
SqlTiddlerDatabase.prototype.getRecipeLastTiddlerId = async function(recipe_name) {
	const row = await this.engine.runStatementGet(`
		SELECT t.title, t.tiddler_id, b.bag_name, MAX(rb.position) AS position
		FROM bags AS b
		INNER JOIN recipe_bags AS rb ON b.bag_id = rb.bag_id
		INNER JOIN recipes AS r ON rb.recipe_id = r.recipe_id
		INNER JOIN tiddlers AS t ON b.bag_id = t.bag_id
		WHERE r.recipe_name = $recipe_name
		GROUP BY t.title
		ORDER BY t.tiddler_id DESC
		LIMIT 1
	`,{
		$recipe_name: recipe_name
	});
	if(row) {
		return row.tiddler_id;
	} else {
		return null;
	}
};

SqlTiddlerDatabase.prototype.deleteAllTiddlersInBag = async function(bag_name) {
	// Delete the fields
	await this.engine.runStatement(`
		DELETE FROM fields
		WHERE tiddler_id IN (
			SELECT tiddler_id
			FROM tiddlers
			WHERE bag_id = (SELECT bag_id FROM bags WHERE bag_name = $bag_name)
			AND is_deleted = FALSE
		)
	`,{
		$bag_name: bag_name
	});
	// Mark the tiddlers as deleted
	await this.engine.runStatement(`
		UPDATE tiddlers
		SET is_deleted = TRUE
		WHERE bag_id = (SELECT bag_id FROM bags WHERE bag_name = $bag_name)
		AND is_deleted = FALSE
	`,{
		$bag_name: bag_name
	});
};

/*
Get the names of the bags in a recipe. Returns an empty array for recipes that do not exist
*/
SqlTiddlerDatabase.prototype.getRecipeBags = async function(recipe_name) {
	const rows = await this.engine.runStatementGetAll(`
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
		$recipe_name: recipe_name
	});
	return rows.map(value => value.bag_name);
};

/*
Get the attachment value of a bag, if any exist
*/
SqlTiddlerDatabase.prototype.getBagTiddlerAttachmentBlob = async function(title,bag_name) {
	const row = await this.engine.runStatementGet(`
		SELECT t.attachment_blob
		FROM bags AS b
		INNER JOIN tiddlers AS t ON b.bag_id = t.bag_id
		WHERE t.title = $title AND b.bag_name = $bag_name AND t.is_deleted = FALSE
	`, {
		$title: title,
		$bag_name: bag_name
	});
	return row ? row.attachment_blob : null;
};

/*
Get the attachment value of a recipe, if any exist
*/
SqlTiddlerDatabase.prototype.getRecipeTiddlerAttachmentBlob = async function(title,recipe_name) {
	const row = await this.engine.runStatementGet(`
		SELECT t.attachment_blob
		FROM bags AS b
		INNER JOIN recipe_bags AS rb ON b.bag_id = rb.bag_id
		INNER JOIN recipes AS r ON rb.recipe_id = r.recipe_id
		INNER JOIN tiddlers AS t ON b.bag_id = t.bag_id
		WHERE r.recipe_name = $recipe_name AND t.title = $title AND t.is_deleted = FALSE
		ORDER BY rb.position DESC
		LIMIT 1
	`, {
		$title: title,
		$recipe_name: recipe_name
	});
	return row ? row.attachment_blob : null;
};

// User CRUD operations
SqlTiddlerDatabase.prototype.createUser = async function(username, email, password) {
	const result = await this.engine.runStatement(`
			INSERT INTO users (username, email, password)
			VALUES ($username, $email, $password)
	`, {
			$username: username,
			$email: email,
			$password: password
	});
	return result.lastInsertRowid;
};

SqlTiddlerDatabase.prototype.getUser = async function(userId) {
	return await this.engine.runStatementGet(`
			SELECT * FROM users WHERE user_id = $userId
	`, {
			$userId: userId
	});
};

SqlTiddlerDatabase.prototype.getUserByUsername = async function(username) {
	return await this.engine.runStatementGet(`
			SELECT * FROM users WHERE username = $username
	`, {
			$username: username
	});
};

SqlTiddlerDatabase.prototype.getUserByEmail = async function(email) {
	return await this.engine.runStatementGet(`
			SELECT * FROM users WHERE email = $email
	`, {
			$email: email
	});
};

SqlTiddlerDatabase.prototype.listUsersByRoleId = async function(roleId) {
	return await this.engine.runStatementGetAll(`
			SELECT u.*
			FROM users u
			JOIN user_roles ur ON u.user_id = ur.user_id
			WHERE ur.role_id = $roleId
			ORDER BY u.username
	`, {
			$roleId: roleId
	});
};

SqlTiddlerDatabase.prototype.updateUser = async function (userId, username, email, roleId) {
	const existingUser = await this.engine.runStatementGet(`
		SELECT user_id FROM users
		WHERE email = $email AND user_id != $userId
`, {
		$email: email,
		$userId: userId
	});

	if (existingUser.length > 0) {
		return {
			success: false,
			message: "Email address already in use by another user."
		};
	}

	try {
		await this.engine.transaction(async () => {
			// Update user information
			await this.engine.runStatement(`
				UPDATE users
				SET username = $username, email = $email
				WHERE user_id = $userId
			`, {
				$userId: userId,
				$username: username,
				$email: email
			});

			if (roleId) {
				// Remove all existing roles for the user
				await this.engine.runStatement(`
					DELETE FROM user_roles
					WHERE user_id = $userId
				`, {
					$userId: userId
				});

				// Add the new role
				await this.engine.runStatement(`
					INSERT INTO user_roles (user_id, role_id)
					VALUES ($userId, $roleId)
				`, {
					$userId: userId,
					$roleId: roleId
				});
			}
		});

		return {
			success: true,
			message: "User profile and role updated successfully."
		};
	} catch (error) {
		return {
			success: false,
			message: "Failed to update user profile: " + error.message
		};
	}
};

SqlTiddlerDatabase.prototype.updateUserPassword = async function (userId, newHash) {
	try {
		await this.engine.runStatement(`
				UPDATE users
				SET password = $newHash
				WHERE user_id = $userId
		`, {
			$userId: userId,
			$newHash: newHash,
		});

		return {
			success: true,
			message: "Password updated successfully."
		};
	} catch (error) {
		return {
			success: false,
			message: "Failed to update password: " + error.message
		};
	}
};

SqlTiddlerDatabase.prototype.deleteUser = async function(userId) {
	await this.engine.runStatement(`
			DELETE FROM users WHERE user_id = $userId
	`, {
			$userId: userId
	});
};

SqlTiddlerDatabase.prototype.listUsers = async function() {
	return await this.engine.runStatementGetAll(`
			SELECT * FROM users ORDER BY username
	`);
};

SqlTiddlerDatabase.prototype.createOrUpdateUserSession = async function(userId, sessionId) {
	const currentTimestamp = new Date().toISOString();

	// First, try to update an existing session
	const updateResult = await this.engine.runStatement(`
			UPDATE sessions
			SET session_id = $sessionId, last_accessed = $timestamp
			WHERE user_id = $userId
	`, {
			$userId: userId,
			$sessionId: sessionId,
			$timestamp: currentTimestamp
	});

	// If no existing session was updated, create a new one
	if (updateResult.changes === 0) {
			await this.engine.runStatement(`
					INSERT INTO sessions (user_id, session_id, created_at, last_accessed)
					VALUES ($userId, $sessionId, $timestamp, $timestamp)
			`, {
					$userId: userId,
					$sessionId: sessionId,
					$timestamp: currentTimestamp
			});
	}

	return sessionId;
};

SqlTiddlerDatabase.prototype.createUserSession = async function(userId, sessionId) {
	const currentTimestamp = new Date().toISOString();
	await this.engine.runStatement(`
			INSERT INTO sessions (user_id, session_id, created_at, last_accessed)
			VALUES ($userId, $sessionId, $timestamp, $timestamp)
	`, {
			$userId: userId,
			$sessionId: sessionId,
			$timestamp: currentTimestamp
	});

	return sessionId;
};


/**
 * @typedef {Object} User
 * @property {number} user_id
 * @property {string} username
 * @property {string} email
 * @property {string} [password]
 * @property {string} created_at
 * @property {string} last_login
*/
/**
 * 
 * @param {any} sessionId 
 * @returns {Promise<User | null>}
 */
SqlTiddlerDatabase.prototype.findUserBySessionId = async function(sessionId) {
	// First, get the user_id from the sessions table
	const sessionResult = await this.engine.runStatementGet(`
			SELECT user_id, last_accessed
			FROM sessions
			WHERE session_id = $sessionId
	`, {
			$sessionId: sessionId
	});

	if (!sessionResult) {
			return null; // Session not found
	}

	const lastAccessed = new Date(sessionResult.last_accessed);
	const expirationTime = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
	if (new Date() - lastAccessed > expirationTime) {
			// Session has expired
			await this.deleteSession(sessionId);
			return null;
	}

	// Update the last_accessed timestamp
	const currentTimestamp = new Date().toISOString();
	await this.engine.runStatement(`
			UPDATE sessions
			SET last_accessed = $timestamp
			WHERE session_id = $sessionId
	`, {
			$sessionId: sessionId,
			$timestamp: currentTimestamp
	});
	/** @type {any} */
	const userResult = await this.engine.runStatementGet(`
			SELECT *
			FROM users
			WHERE user_id = $userId
	`, {
			$userId: sessionResult.user_id
	});

	if (!userResult) {
			return null;
	}

	return userResult;
};

SqlTiddlerDatabase.prototype.deleteSession = async function(sessionId) {
	await this.engine.runStatement(`
			DELETE FROM sessions
			WHERE session_id = $sessionId
	`, {
			$sessionId: sessionId
	});
};

SqlTiddlerDatabase.prototype.deleteUserSessions = async function(userId) {
	await this.engine.runStatement(`
			DELETE FROM sessions
			WHERE user_id = $userId
	`, {
			$userId: userId
	});
};

// Set the user as an admin
SqlTiddlerDatabase.prototype.setUserAdmin = async function(userId) {
	var admin = await this.getRoleByName("ADMIN");
	if(admin) {	
		await this.addRoleToUser(userId, admin.role_id);
	}
};

// Group CRUD operations
SqlTiddlerDatabase.prototype.createGroup = async function(groupName, description) {
	const result = await this.engine.runStatement(`
			INSERT INTO groups (group_name, description)
			VALUES ($groupName, $description)
	`, {
			$groupName: groupName,
			$description: description
	});
	return result.lastInsertRowid;
};

SqlTiddlerDatabase.prototype.getGroup = async function(groupId) {
	return await this.engine.runStatementGet(`
			SELECT * FROM groups WHERE group_id = $groupId
	`, {
			$groupId: groupId
	});
};

SqlTiddlerDatabase.prototype.updateGroup = async function(groupId, groupName, description) {
	await this.engine.runStatement(`
			UPDATE groups
			SET group_name = $groupName, description = $description
			WHERE group_id = $groupId
	`, {
			$groupId: groupId,
			$groupName: groupName,
			$description: description
	});
};

SqlTiddlerDatabase.prototype.deleteGroup = async function(groupId) {
	await this.engine.runStatement(`
			DELETE FROM groups WHERE group_id = $groupId
	`, {
			$groupId: groupId
	});
};

SqlTiddlerDatabase.prototype.listGroups = async function() {
	return await this.engine.runStatementGetAll(`
			SELECT * FROM groups ORDER BY group_name
	`);
};

// Role CRUD operations
SqlTiddlerDatabase.prototype.createRole = async function(roleName, description) {
	const result = await this.engine.runStatement(`
			INSERT OR IGNORE INTO roles (role_name, description)
			VALUES ($roleName, $description)
	`, {
			$roleName: roleName,
			$description: description
	});
	return result.lastInsertRowid;
};

SqlTiddlerDatabase.prototype.getRole = async function(roleId) {
	return await this.engine.runStatementGet(`
			SELECT * FROM roles WHERE role_id = $roleId
	`, {
			$roleId: roleId
	});
};

SqlTiddlerDatabase.prototype.getRoleByName = async function(roleName) {
	return await this.engine.runStatementGet(`
			SELECT * FROM roles WHERE role_name = $roleName
	`, {
			$roleName: roleName
	});
}

SqlTiddlerDatabase.prototype.updateRole = async function(roleId, roleName, description) {
	await this.engine.runStatement(`
			UPDATE roles
			SET role_name = $roleName, description = $description
			WHERE role_id = $roleId
	`, {
			$roleId: roleId,
			$roleName: roleName,
			$description: description
	});
};

SqlTiddlerDatabase.prototype.deleteRole = async function(roleId) {
	await this.engine.runStatement(`
			DELETE FROM roles WHERE role_id = $roleId
	`, {
			$roleId: roleId
	});
};

SqlTiddlerDatabase.prototype.listRoles = async function() {
	return await this.engine.runStatementGetAll(`
			SELECT * FROM roles ORDER BY role_name DESC
	`);
};

// Permission CRUD operations
SqlTiddlerDatabase.prototype.createPermission = async function(permissionName, description) {
	const result = await this.engine.runStatement(`
		INSERT OR IGNORE INTO permissions (permission_name, description)
		VALUES ($permissionName, $description)
	`, {
			$permissionName: permissionName,
			$description: description
	});
	return result.lastInsertRowid;
};

SqlTiddlerDatabase.prototype.getPermission = async function(permissionId) {
	return await this.engine.runStatementGet(`
			SELECT * FROM permissions WHERE permission_id = $permissionId
	`, {
			$permissionId: permissionId
	});
};

SqlTiddlerDatabase.prototype.getPermissionByName = async function(permissionName) {
	return await this.engine.runStatementGet(`
			SELECT * FROM permissions WHERE permission_name = $permissionName
	`, {
			$permissionName: permissionName
	});
};

SqlTiddlerDatabase.prototype.updatePermission = async function(permissionId, permissionName, description) {
	await this.engine.runStatement(`
			UPDATE permissions
			SET permission_name = $permissionName, description = $description
			WHERE permission_id = $permissionId
	`, {
			$permissionId: permissionId,
			$permissionName: permissionName,
			$description: description
	});
};

SqlTiddlerDatabase.prototype.deletePermission = async function(permissionId) {
	await this.engine.runStatement(`
			DELETE FROM permissions WHERE permission_id = $permissionId
	`, {
			$permissionId: permissionId
	});
};

SqlTiddlerDatabase.prototype.listPermissions = async function() {
	return await this.engine.runStatementGetAll(`
			SELECT * FROM permissions ORDER BY permission_name
	`);
};

// ACL CRUD operations
SqlTiddlerDatabase.prototype.createACL = async function(entityName, entityType, roleId, permissionId) {
	if(!entityName.startsWith("$:/")) {
		const result = await this.engine.runStatement(`
			INSERT OR IGNORE INTO acl (entity_name, entity_type, role_id, permission_id)
			VALUES ($entityName, $entityType, $roleId, $permissionId)
		`, 
		{
			$entityName: entityName,
			$entityType: entityType,
			$roleId: roleId,
			$permissionId: permissionId
		});
		return result.lastInsertRowid;
	}
};

SqlTiddlerDatabase.prototype.getACL = async function(aclId) {
	return await this.engine.runStatementGet(`
			SELECT * FROM acl WHERE acl_id = $aclId
	`, {
			$aclId: aclId
	});
};

SqlTiddlerDatabase.prototype.updateACL = async function(aclId, entityId, entityType, roleId, permissionId) {
	await this.engine.runStatement(`
			UPDATE acl
			SET entity_name = $entityId, entity_type = $entityType, 
					role_id = $roleId, permission_id = $permissionId
			WHERE acl_id = $aclId
	`, {
			$aclId: aclId,
			$entityId: entityId,
			$entityType: entityType,
			$roleId: roleId,
			$permissionId: permissionId
	});
};

SqlTiddlerDatabase.prototype.deleteACL = async function(aclId) {
	await this.engine.runStatement(`
			DELETE FROM acl WHERE acl_id = $aclId
	`, {
			$aclId: aclId
	});
};

SqlTiddlerDatabase.prototype.listACLs = async function() {
	return await this.engine.runStatementGetAll(`
			SELECT * FROM acl ORDER BY entity_type, entity_name
	`);
};

// Association management functions
SqlTiddlerDatabase.prototype.addUserToGroup = async function(userId, groupId) {
	await this.engine.runStatement(`
			INSERT OR IGNORE INTO user_groups (user_id, group_id)
			VALUES ($userId, $groupId)
	`, {
			$userId: userId,
			$groupId: groupId
	});
};

SqlTiddlerDatabase.prototype.isUserInGroup = async function(userId, groupId) {
	const result = await this.engine.runStatementGet(`
			SELECT 1 FROM user_groups
			WHERE user_id = $userId AND group_id = $groupId
	`, {
			$userId: userId,
			$groupId: groupId
	});
	return result !== undefined;
};

SqlTiddlerDatabase.prototype.removeUserFromGroup = async function(userId, groupId) {
	await this.engine.runStatement(`
			DELETE FROM user_groups
			WHERE user_id = $userId AND group_id = $groupId
	`, {
			$userId: userId,
			$groupId: groupId
	});
};

SqlTiddlerDatabase.prototype.addRoleToUser = async function(userId, roleId) {
	await this.engine.runStatement(`
			INSERT OR IGNORE INTO user_roles (user_id, role_id)
			VALUES ($userId, $roleId)
	`, {
			$userId: userId,
			$roleId: roleId
	});
};

SqlTiddlerDatabase.prototype.removeRoleFromUser = async function(userId, roleId) {
	await this.engine.runStatement(`
			DELETE FROM user_roles
			WHERE user_id = $userId AND role_id = $roleId
	`, {
			$userId: userId,
			$roleId: roleId
	});
};

SqlTiddlerDatabase.prototype.addRoleToGroup = async function(groupId, roleId) {
	await this.engine.runStatement(`
			INSERT OR IGNORE INTO group_roles (group_id, role_id)
			VALUES ($groupId, $roleId)
	`, {
			$groupId: groupId,
			$roleId: roleId
	});
};

SqlTiddlerDatabase.prototype.removeRoleFromGroup = async function(groupId, roleId) {
	await this.engine.runStatement(`
			DELETE FROM group_roles
			WHERE group_id = $groupId AND role_id = $roleId
	`, {
			$groupId: groupId,
			$roleId: roleId
	});
};

SqlTiddlerDatabase.prototype.addPermissionToRole = async function(roleId, permissionId) {
	await this.engine.runStatement(`
			INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
			VALUES ($roleId, $permissionId)
	`, {
			$roleId: roleId,
			$permissionId: permissionId
	});
};

SqlTiddlerDatabase.prototype.removePermissionFromRole = async function(roleId, permissionId) {
	await this.engine.runStatement(`
			DELETE FROM role_permissions
			WHERE role_id = $roleId AND permission_id = $permissionId
	`, {
			$roleId: roleId,
			$permissionId: permissionId
	});
};

SqlTiddlerDatabase.prototype.getUserRoles = async function(userId) {
	const query = `
			SELECT r.role_id, r.role_name
			FROM user_roles ur
			JOIN roles r ON ur.role_id = r.role_id
			WHERE ur.user_id = $userId
			LIMIT 1
	`;
	
	return await this.engine.runStatementGet(query, { $userId: userId });
};

SqlTiddlerDatabase.prototype.deleteUserRolesByRoleId = async function(roleId) {
	await this.engine.runStatement(`
			DELETE FROM user_roles
			WHERE role_id = $roleId
	`, {
			$roleId: roleId
	});
};

SqlTiddlerDatabase.prototype.deleteUserRolesByUserId = async function(userId) {
	await this.engine.runStatement(`
			DELETE FROM user_roles
			WHERE user_id = $userId
	`, {
			$userId: userId
	});
};

SqlTiddlerDatabase.prototype.isRoleInUse = async function(roleId) {
	// Check if the role is assigned to any users
	const userRoleCheck = await this.engine.runStatementGet(`
		SELECT 1
		FROM user_roles
		WHERE role_id = $roleId
		LIMIT 1
	`, {
		$roleId: roleId
	});

	if(userRoleCheck) {
		return true;
	}

	// Check if the role is used in any ACLs
	const aclRoleCheck = await this.engine.runStatementGet(`
		SELECT 1
		FROM acl
		WHERE role_id = $roleId
		LIMIT 1
	`, {
		$roleId: roleId
	});

	if(aclRoleCheck) {
		return true;
	}

	// If we've reached this point, the role is not in use
	return false;
};

SqlTiddlerDatabase.prototype.getRoleById = async function(roleId) {
	const role = await this.engine.runStatementGet(`
		SELECT role_id, role_name, description
		FROM roles
		WHERE role_id = $roleId
	`, {
		$roleId: roleId
	});

	return role;
};

exports.SqlTiddlerDatabase = SqlTiddlerDatabase;

})();
