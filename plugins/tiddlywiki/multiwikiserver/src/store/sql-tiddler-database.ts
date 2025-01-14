/*\
title: $:/plugins/tiddlywiki/multiwikiserver/store/sql-tiddler-database.js
type: application/javascript
module-type: library

Low level SQL functions to store and retrieve tiddlers in a SQLite database.

This class is intended to encapsulate all the SQL queries used to access the database.
Validation is for the most part left to the caller

\*/
"use strict";
// import { SqlEngine } from "$:/plugins/tiddlywiki/multiwikiserver/store/sql-engine";
import { PrismaClient } from "@prisma/client";
import { ok } from "assert";
const TYPEOF_ENUM = typeof "";
type TYPEOF_ENUM = typeof TYPEOF_ENUM | "null" | "nully";
function okType<T>(value: any, type: "string", msg?: string): asserts value is string;
function okType<T>(value: any, type: "number", msg?: string): asserts value is number;
function okType<T>(value: any, type: "bigint", msg?: string): asserts value is bigint;
function okType<T>(value: any, type: "boolean", msg?: string): asserts value is boolean;
function okType<T>(value: any, type: "symbol", msg?: string): asserts value is symbol;
function okType<T>(value: any, type: "object", msg?: string): asserts value is object;
function okType<T>(value: any, type: "function", msg?: string): asserts value is Function;
function okType<T>(value: any, type: "null", msg?: string): asserts value is null;
function okType<T>(value: any, type: "nully", msg?: string): asserts value is null | undefined;
function okType<T>(value: any, type: "undefined", msg?: string): asserts value is undefined;
function okType<T>(value: any, type: TYPEOF_ENUM, msg?: string) {
	switch (type) {
		case "null": ok(value === null, msg); break;
		case "nully": ok(value === null || value === undefined, msg); break;
		default: ok(typeof value === type, msg);
	}
}
function okTypeTruthy<T>(value: any, type: "string", msg?: string): asserts value is string & {};
function okTypeTruthy<T>(value: any, type: "number", msg?: string): asserts value is number & {};
function okTypeTruthy<T>(value: any, type: "bigint", msg?: string): asserts value is bigint & {};
function okTypeTruthy<T>(value: any, type: "boolean", msg?: string): asserts value is boolean & {};
function okTypeTruthy<T>(value: any, type: "symbol", msg?: string): asserts value is symbol & {};
function okTypeTruthy<T>(value: any, type: "object", msg?: string): asserts value is object & {};
function okTypeTruthy<T>(value: any, type: "function", msg?: string): asserts value is Function & {};
function okTypeTruthy<T>(value: any, type: TYPEOF_ENUM, msg?: string) {
	switch (type) {
		case "null": ok(value === null, msg); break;
		case "nully": ok(value === null || value === undefined, msg); break;
		default: ok(typeof value === type, msg);
	}
}

function okEntityType(value: any): asserts value is EntityType {
	ok(value === "bag" || value === "recipe", "Invalid entity type: " + value);
}

type EntityType = "bag" | "recipe";
type TiddlerFields = Record<string, string>
/*
Create a tiddler store. Options include:
	
databasePath - path to the database file (can be ":memory:" to get a temporary database)
engine - wasm | better
*/
export class SqlTiddlerDatabase {
	engine: PrismaTxnClient;
	connection: PrismaClient;
	constructor(options: {
		databasePath?: string,
		engine?: "node" | "wasm" | "better"
	} = {}) {

		if (options.databasePath === ":memory:") {
			throw new Error("In-memory databases are not supported");
		}

		$tw.utils.createFileDirectories(options.databasePath);

		this.connection = this.engine = new PrismaClient({
			datasourceUrl: `file:${options.databasePath}`,
		});

	}
	async close() {
		await this.connection.$disconnect();
	}
	// async transaction<T>(fn: (prisma: PrismaTxnClient) => Promise<T>): Promise<T> {
	// 	return await this.engine.$transaction(fn);
	// }
	// async createTables() {
	// 	throw new Error("Not implemented");
	// }
	async listBags() {
		return await this.engine.bags.findMany({
			select: { bag_name: true, bag_id: true, accesscontrol: true, description: true },
			orderBy: { bag_name: "asc" }
		});
		// const rows = await this.engine.runStatementGetAll(`
		// 	SELECT bag_name, bag_id, accesscontrol, description
		// 	FROM bags
		// 	ORDER BY bag_name
		// `);
		// return rows;
	}
	/*
	Create or update a bag
	Returns the bag_id of the bag
	*/
	async createBag(bag_name: string, description: string, accesscontrol = "") {
		// ignore if the bag already exists
		const bag = await this.engine.bags.upsert({
			create: { bag_name, description, accesscontrol },
			update: { description, accesscontrol },
			where: { bag_name },
		});
		return bag.bag_id;
	}
	/*
	Returns array of {recipe_name:,recipe_id:,description:,bag_names: []}
	*/
	async listRecipes() {
		const rows = await this.engine.recipes.findMany({
			select: {
				recipe_name: true,
				recipe_id: true,
				description: true,
				owner_id: true,
				recipe_bags: { select: { bag: { select: { bag_name: true } } } }
			}
		});
		return rows.map(row => {
			return {
				recipe_name: row.recipe_name,
				recipe_id: row.recipe_id,
				description: row.description,
				owner_id: row.owner_id,
				bag_names: row.recipe_bags.map(value => value.bag.bag_name)
			};
		});

		// 	const rows = await this.engine.runStatementGetAll(`
		// 	SELECT r.recipe_name, r.recipe_id, r.description, r.owner_id, b.bag_name, rb.position
		// 	FROM recipes AS r
		// 	JOIN recipe_bags AS rb ON rb.recipe_id = r.recipe_id
		// 	JOIN bags AS b ON rb.bag_id = b.bag_id
		// 	ORDER BY r.recipe_name, rb.position
		// `);
		// 	const results = [];
		// 	let currentRecipeName = null, currentRecipeIndex = -1;
		// 	for (const row of rows) {
		// 		if (row.recipe_name !== currentRecipeName) {
		// 			currentRecipeName = row.recipe_name;
		// 			currentRecipeIndex += 1;
		// 			results.push({
		// 				recipe_name: row.recipe_name,
		// 				recipe_id: row.recipe_id,
		// 				description: row.description,
		// 				owner_id: row.owner_id,
		// 				/** @type {string[]} */
		// 				bag_names: []
		// 			});
		// 		}
		// 		results[currentRecipeIndex].bag_names.push(row.bag_name);
		// 	}
		// 	return results;
	}
	/*
	Create or update a recipe
	Returns the recipe_id of the recipe
	*/
	async createRecipe(recipe_name: string, bag_names: string[], description: string) {
		// deleting this will also delete the recipe_bags records
		await this.engine.recipes.deleteMany({
			where: { recipe_name }
		});
		const updateRecipes = await this.engine.recipes.create({
			data: {
				recipe_name,
				description,
				recipe_bags: {
					create: bag_names.map((bag_name, position) => ({
						position,
						bag: { connect: { bag_name } }
					}))
				}
			}
		});
		return updateRecipes.recipe_id;

		// 	// Run the queries
		// 	await this.engine.runStatement(`
		// 	-- Delete existing recipe_bags entries for this recipe
		// 	DELETE FROM recipe_bags WHERE recipe_id = (SELECT recipe_id FROM recipes WHERE recipe_name = $recipe_name)
		// `, {
		// 		$recipe_name: recipe_name
		// 	});
		// 	const updateRecipes = await this.engine.runStatement(`
		// 	-- Create the entry in the recipes table if required
		// 	INSERT OR REPLACE INTO recipes (recipe_name, description)
		// 	VALUES ($recipe_name, $description)
		// `, {
		// 		$recipe_name: recipe_name,
		// 		$description: description
		// 	});
		// 	await this.engine.runStatement(`
		// 	INSERT INTO recipe_bags (recipe_id, bag_id, position)
		// 	SELECT r.recipe_id, b.bag_id, j.key as position
		// 	FROM recipes r
		// 	JOIN bags b
		// 	INNER JOIN json_each($bag_names) AS j ON j.value = b.bag_name
		// 	WHERE r.recipe_name = $recipe_name
		// `, {
		// 		$recipe_name: recipe_name,
		// 		$bag_names: JSON.stringify(bag_names)
		// 	});
		// 	return updateRecipes.lastInsertRowid;
	}
	/*
	Assign a recipe to a user
	*/
	async assignRecipeToUser(recipe_name: string, user_id: number) {
		await this.engine.recipes.update({
			where: { recipe_name },
			data: { owner_id: user_id }
		});
		// 	await this.engine.runStatement(`
		// 	UPDATE recipes SET owner_id = $user_id WHERE recipe_name = $recipe_name
		// `, {
		// 		$recipe_name: recipe_name,
		// 		$user_id: user_id
		// 	});
	}
	/*
	Returns {tiddler_id:}
	*/
	async saveBagTiddler(tiddlerFields: { [s: string]: string; }, bag_name: string, attachment_blob: string) {
		// fields are deleted at the same time (cascade)
		await this.engine.tiddlers.deleteMany({
			where: { bag: { bag_name }, title: tiddlerFields.title },
		});
		const tiddler = await this.engine.tiddlers.create({
			data: {
				// this makes sure the bag exists
				bag: { connect: { bag_name } },
				title: tiddlerFields.title,
				is_deleted: false,
				attachment_blob,
				fields: {
					create: Object.entries(tiddlerFields).map(([field_name, field_value]) => {
						if (field_value === null) field_value = "";
						if (field_value === undefined) field_value = "";

						switch (typeof field_value) {
							case "string":
								break;
							case "number":
							case "boolean":
							case "bigint":
								field_value = (field_value as any).toString();
								break;
							default:
								$tw.utils.error("Invalid field value type: " + typeof field_value);
						}
						return { field_name, field_value };
					})
				}
			}
		});
		return { tiddler_id: tiddler.tiddler_id };
		// 	attachment_blob = attachment_blob || null;
		// 	// Update the tiddlers table
		// 	var info = await this.engine.runStatement(`
		// 	INSERT OR REPLACE INTO tiddlers (bag_id, title, is_deleted, attachment_blob)
		// 	VALUES (
		// 		(SELECT bag_id FROM bags WHERE bag_name = $bag_name),
		// 		$title,
		// 		FALSE,
		// 		$attachment_blob
		// 	)
		// `, {
		// 		$title: tiddlerFields.title,
		// 		$attachment_blob: attachment_blob,
		// 		$bag_name: bag_name
		// 	});
		// 	// Update the fields table
		// 	await this.engine.runStatement(`
		// 	INSERT OR REPLACE INTO fields (tiddler_id, field_name, field_value)
		// 	SELECT
		// 		t.tiddler_id,
		// 		json_each.key AS field_name,
		// 		json_each.value AS field_value
		// 	FROM (
		// 		SELECT tiddler_id
		// 		FROM tiddlers
		// 		WHERE bag_id = (
		// 			SELECT bag_id
		// 			FROM bags
		// 			WHERE bag_name = $bag_name
		// 		) AND title = $title
		// 	) AS t
		// 	JOIN json_each($field_values) AS json_each
		// `, {
		// 		$title: tiddlerFields.title,
		// 		$bag_name: bag_name,
		// 		$field_values: JSON.stringify(Object.assign({}, tiddlerFields, { title: undefined }))
		// 	});
		// 	return {
		// 		tiddler_id: info.lastInsertRowid
		// 	};
	}
	/*
	Returns {tiddler_id:,bag_name:} or null if the recipe is empty
	*/
	async saveRecipeTiddler(tiddlerFields: TiddlerFields, recipe_name: string, attachment_blob: string) {
		// Find the topmost bag in the recipe
		const bag = await this.engine.recipe_bags.findFirst({
			where: { recipe: { recipe_name } },
			select: { bag: { select: { bag_name: true } } },
			orderBy: { position: "desc" }
		});
		if (!bag) {
			return null;
		}
		// Save the tiddler to the topmost bag
		const info = await this.saveBagTiddler(tiddlerFields, bag.bag.bag_name, attachment_blob);
		return {
			tiddler_id: info.tiddler_id,
			bag_name: bag.bag.bag_name
		};
		// 	// Find the topmost bag in the recipe
		// 	var row = await this.engine.runStatementGet(`
		// 	SELECT b.bag_name
		// 	FROM bags AS b
		// 	JOIN (
		// 		SELECT rb.bag_id
		// 		FROM recipe_bags AS rb
		// 		WHERE rb.recipe_id = (
		// 			SELECT recipe_id
		// 			FROM recipes
		// 			WHERE recipe_name = $recipe_name
		// 		)
		// 		ORDER BY rb.position DESC
		// 		LIMIT 1
		// 	) AS selected_bag
		// 	ON b.bag_id = selected_bag.bag_id
		// `, {
		// 		$recipe_name: recipe_name
		// 	});
		// 	if (!row) {
		// 		return null;
		// 	}
		// 	// Save the tiddler to the topmost bag
		// 	var info = await this.saveBagTiddler(tiddlerFields, row.bag_name, attachment_blob);
		// 	return {
		// 		tiddler_id: info.tiddler_id,
		// 		bag_name: row.bag_name
		// 	};
	}
	/*
	Returns {tiddler_id:} of the delete marker
	*/
	async deleteTiddler(title: string, bag_name: string) {

		// fields are deleted at the same time (cascade)
		// use deleteMany so we can filter by bag_name directly
		await this.engine.tiddlers.deleteMany({
			where: { bag: { bag_name }, title },
		})
		// create the delete marker
		const rowDeleteMarker = await this.engine.tiddlers.create({
			data: {
				is_deleted: true,
				attachment_blob: null,
				title,
				bag: { connect: { bag_name } }
			}
		});
		return { tiddler_id: rowDeleteMarker.tiddler_id };
		// 	// Delete the fields of this tiddler
		// 	await this.engine.runStatement(`
		// 	DELETE FROM fields
		// 	WHERE tiddler_id IN (
		// 		SELECT t.tiddler_id
		// 		FROM tiddlers AS t
		// 		INNER JOIN bags AS b ON t.bag_id = b.bag_id
		// 		WHERE b.bag_name = $bag_name AND t.title = $title
		// 	)
		// `, {
		// 		$title: title,
		// 		$bag_name: bag_name
		// 	});
		// 	// Mark the tiddler itself as deleted
		// 	const rowDeleteMarker = await this.engine.runStatement(`
		// 	INSERT OR REPLACE INTO tiddlers (bag_id, title, is_deleted, attachment_blob)
		// 	VALUES (
		// 		(SELECT bag_id FROM bags WHERE bag_name = $bag_name),
		// 		$title,
		// 		TRUE,
		// 		NULL
		// 	)
		// `, {
		// 		$title: title,
		// 		$bag_name: bag_name
		// 	});
		// 	return { tiddler_id: rowDeleteMarker.lastInsertRowid };
	}
	/*
	returns {tiddler_id:,tiddler:,attachment_blob:}
	*/
	async getBagTiddler(title: string, bag_name: string) {
		const { bag_id } = await this.engine.bags.findUniqueOrThrow({
			where: { bag_name },
			select: { bag_id: true }
		});
		const tiddler = await this.engine.tiddlers.findUnique({
			where: { bag_id_title: { bag_id, title } },
			include: { fields: true }
		});
		if (!tiddler) {
			return null;
		}
		return {
			tiddler_id: tiddler.tiddler_id,
			attachment_blob: tiddler.attachment_blob,
			tiddler: tiddler.fields.reduce((accumulator, value) => {
				accumulator[value.field_name] = value.field_value;
				return accumulator;
			}, { title } as TiddlerFields)
		};
		// 	const rowTiddler = await this.engine.runStatementGet(`
		// 	SELECT t.tiddler_id, t.attachment_blob
		// 	FROM bags AS b
		// 	INNER JOIN tiddlers AS t ON b.bag_id = t.bag_id
		// 	WHERE t.title = $title AND b.bag_name = $bag_name AND t.is_deleted = FALSE
		// `, {
		// 		$title: title,
		// 		$bag_name: bag_name
		// 	});
		// 	if (!rowTiddler) {
		// 		return null;
		// 	}
		// 	const rows = await this.engine.runStatementGetAll(`
		// 	SELECT field_name, field_value, tiddler_id
		// 	FROM fields
		// 	WHERE tiddler_id = $tiddler_id
		// `, {
		// 		$tiddler_id: rowTiddler.tiddler_id
		// 	});
		// 	if (rows.length === 0) {
		// 		return null;
		// 	} else {
		// 		return {
		// 			bag_name: bag_name,
		// 			tiddler_id: rows[0].tiddler_id,
		// 			attachment_blob: rowTiddler.attachment_blob,
		// 			tiddler: rows.reduce((accumulator, value) => {
		// 				accumulator[value["field_name"]] = value.field_value;
		// 				return accumulator;
		// 			}, { title: title })
		// 		};
		// 	}
	}
	/*
	Returns {bag_name:, tiddler: {fields}, tiddler_id:, attachment_blob:}
	*/
	async getRecipeTiddler(title: string, recipe_name: string) {
		const row = await this.engine.recipe_bags.findFirst({
			// where: the first recipe_bag containing this tiddler, in descending order
			where: { recipe: { recipe_name }, bag: { tiddlers: { some: { title } } } },
			orderBy: { position: "desc" },
			// select: the tiddler and its fields
			select: {
				bag: {
					select: {
						bag_name: true,
						tiddlers: {
							where: { title },
							include: { fields: true }
						}
					}
				},
			},
		});
		if (!row) {
			return null;
		}
		const tiddler = row.bag.tiddlers[0];

		return {
			bag_name: row.bag.bag_name,
			tiddler_id: tiddler.tiddler_id,
			attachment_blob: tiddler.attachment_blob,
			tiddler: tiddler.fields.reduce((accumulator, value) => {
				accumulator[value.field_name] = value.field_value;
				return accumulator;
			}, { title } as TiddlerFields)
		};
		// 	const rowTiddlerId = await this.engine.runStatementGet(`	
		// 	SELECT t.tiddler_id, t.attachment_blob, b.bag_name
		// 	FROM bags AS b
		// 	INNER JOIN recipe_bags AS rb ON b.bag_id = rb.bag_id
		// 	INNER JOIN recipes AS r ON rb.recipe_id = r.recipe_id
		// 	INNER JOIN tiddlers AS t ON b.bag_id = t.bag_id
		// 	WHERE r.recipe_name = $recipe_name
		// 	AND t.title = $title
		// 	AND t.is_deleted = FALSE
		// 	ORDER BY rb.position DESC
		// 	LIMIT 1
		// `, {
		// 		$title: title,
		// 		$recipe_name: recipe_name
		// 	});
		// 	if (!rowTiddlerId) {
		// 		return null;
		// 	}
		// 	// Get the fields
		// 	const rows = await this.engine.runStatementGetAll(`
		// 	SELECT field_name, field_value
		// 	FROM fields
		// 	WHERE tiddler_id = $tiddler_id
		// `, {
		// 		$tiddler_id: rowTiddlerId.tiddler_id
		// 	});
		// 	return {
		// 		bag_name: rowTiddlerId.bag_name,
		// 		tiddler_id: rowTiddlerId.tiddler_id,
		// 		attachment_blob: rowTiddlerId.attachment_blob,
		// 		tiddler: rows.reduce((accumulator, value) => {
		// 			accumulator[value["field_name"]] = value.field_value;
		// 			return accumulator;
		// 		}, { title: title })
		// 	};
	}
	/*
	Checks if a user has permission to access a recipe
	*/
	async hasRecipePermission(user_id: number | undefined, recipe_name: string, permissionName: string) {
		const recipe = await this.engine.recipes.findUnique({
			where: { recipe_name }, select: { owner_id: true }
		});
		return await this.checkACLPermission(
			user_id, "recipe", recipe_name, permissionName, recipe?.owner_id ?? undefined
		);
		// try {
		// 	// check if the user is the owner of the entity
		// 	const recipe = await this.engine.runStatementGet(`
		// 	SELECT owner_id 
		// 	FROM recipes 
		// 	WHERE recipe_name = $recipe_name
		// 	`, {
		// 		$recipe_name: recipeName
		// 	});

		// 	if (!!recipe?.owner_id && recipe?.owner_id === userId) {
		// 		return true;
		// 	} else {
		// 		var permission = await this.checkACLPermission(userId, "recipe", recipeName, permissionName, recipe?.owner_id);
		// 		return permission;
		// 	}

		// } catch (error) {
		// 	console.error(error);
		// 	return false;
		// }
	}
	/*
	Checks if a user has permission to access a bag
	*/
	async hasBagPermission(userId: number, bagName: string, permissionName: string) {
		return await this.checkACLPermission(userId, "bag", bagName, permissionName, undefined);
	}
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
	async getACLByName(entityType: EntityType, entityName: string, fetchAll: boolean) {
		okEntityType(entityType);
		okTypeTruthy(entityName, "string", "No entityName provided");
		okType(fetchAll, "boolean", "fetchAll must be a boolean");

		return await this.engine.acl.findMany({
			where: { entity_type: entityType, entity_name: entityName },
			include: { permission: true },
			take: fetchAll ? undefined : 1,
		});

		// 	const entityInfo = this.entityTypeToTableMap[entityType];
		// 	if (!entityInfo) {
		// 		throw new Error("Invalid entity type: " + entityType);
		// 	}

		// 	// First, check if there's an ACL record for the entity and get the permission_id
		// 	var checkACLExistsQuery = `
		// 	SELECT acl.*, permissions.permission_name
		// 	FROM acl
		// 	LEFT JOIN permissions ON acl.permission_id = permissions.permission_id
		// 	WHERE acl.entity_type = $entity_type
		// 	AND acl.entity_name = $entity_name
		// `;

		// 	if (!fetchAll) {
		// 		checkACLExistsQuery += ' LIMIT 1';
		// 	}

		// 	const aclRecord = await this.engine[fetchAll ? 'runStatementGetAll' : 'runStatementGet'](checkACLExistsQuery, {
		// 		$entity_type: entityType,
		// 		$entity_name: entityName
		// 	});

		// 	return aclRecord;
	}
	async checkACLPermission(
		user_id: number | undefined,
		entityType: EntityType,
		entityName: string,
		permissionName: string,
		ownerId: number | undefined
	) {
		if(user_id === undefined) return false;
		
		okType(user_id, "number", "No user_id provided");
		okEntityType(entityType);
		okTypeTruthy(entityName, "string", "No entityName provided");
		okTypeTruthy(permissionName, "string", "No permissionName provided");
		ok(typeof ownerId === "number" || ownerId === undefined);

		// if the entityName starts with "$:/", we'll assume its a system bag/recipe, then grant the user permission
		if (entityName.startsWith("$:/")) return true;
		const aclRecords = await this.getACLByName(entityType, entityName, true);
		const aclRecord = aclRecords.find(record => record.permission?.permission_name === permissionName);

		// If no ACL record exists, return true for hasPermission
		if (!aclRecord && !ownerId && aclRecords.length === 0
			|| !!aclRecord && !!ownerId && ownerId === user_id) {
			return true;
		}

		if (!aclRecord?.permission?.permission_id) return false;

		const result = await this.engine.users.findUnique({
			where: {
				user_id, 
				user_roles: {
					some: {
						role: {
							acls: {
								some: {
									entity_type: entityType,
									entity_name: entityName,
									permission_id: aclRecord.permission.permission_id
								}
							}
						}
					}
				}
			},
			select: {
				user_id: true,
			}
		});
		return !!result;

		// 	// If ACL record exists, check for user permission using the retrieved permission_id
		// 	const checkPermissionQuery = `
		// 	SELECT *
		// 	FROM users u
		// 	JOIN user_roles ur ON u.user_id = ur.user_id
		// 	JOIN roles r ON ur.role_id = r.role_id
		// 	JOIN acl a ON r.role_id = a.role_id
		// 	WHERE u.user_id = $user_id
		// 	AND a.entity_type = $entity_type
		// 	AND a.entity_name = $entity_name
		// 	AND a.permission_id = $permission_id
		// 	LIMIT 1
		// `;

		// 	const result = await this.engine.runStatementGet(checkPermissionQuery, {
		// 		$user_id: userId,
		// 		$entity_type: entityType,
		// 		$entity_name: entityName,
		// 		$permission_id: aclRecord?.permission_id
		// 	});
	}
	/**
	 * Returns the ACL records for an entity (bag or recipe)
	 */
	async getEntityAclRecords(entity_name: string) {
		return await this.engine.acl.findMany({
			where: { entity_name },
		});
		// 	const checkACLExistsQuery = `
		// 	SELECT *
		// 	FROM acl
		// 	WHERE entity_name = $entity_name
		// `;
		// 	const aclRecords = await this.engine.runStatementGetAll(checkACLExistsQuery, {
		// 		$entity_name: entityName
		// 	});
		// 	return aclRecords;
	}

	/*
	Get the entity by name
	*/
	async getEntityByName(entityType: EntityType, entityName: string) {
		okEntityType(entityType);
		okTypeTruthy(entityName, "string", "No entityName provided");
		// they have to be separated for typechecking, but the code is the same
		switch (entityType) {
			case "recipe": return await this.engine.recipes.findUnique({
				where: { recipe_name: entityName },
			});
			case "bag": return await this.engine.bags.findUnique({
				where: { bag_name: entityName },
			});
		}
		// const entityTypeToTableMap = {
		// 	bag: {
		// 		table: "bags",
		// 		column: "bag_name"
		// 	},
		// 	recipe: {
		// 		table: "recipes",
		// 		column: "recipe_name"
		// 	}
		// } as const;
		// const entityInfo = this.entityTypeToTableMap[entityType];
		// if (entityInfo) {
		// 	return await this.engine.runStatementGet(`SELECT * FROM ${entityInfo.table} WHERE ${entityInfo.column} = $entity_name`, {
		// 		$entity_name: entityName
		// 	});
		// }
		// return null;
	}
	/*
	Get the titles of the tiddlers in a bag. Returns an empty array for bags that do not exist
	*/
	async getBagTiddlers(bag_name: string) {
		const rows = await this.engine.tiddlers.findMany({
			where: { bag: { bag_name }, is_deleted: false },
			select: { title: true, tiddler_id: true },
			orderBy: { title: "asc" }
		});
		return rows;
		// 	const rows = await this.engine.runStatementGetAll(`
		// 	SELECT DISTINCT title, tiddler_id
		// 	FROM tiddlers
		// 	WHERE bag_id IN (
		// 		SELECT bag_id
		// 		FROM bags
		// 		WHERE bag_name = $bag_name
		// 	)
		// 	AND tiddlers.is_deleted = FALSE
		// 	ORDER BY title ASC
		// `, {
		// 		$bag_name: bag_name
		// 	});
		// 	return rows;
	}
	/*
	Get the tiddler_id of the newest tiddler in a bag. Returns null for bags that do not exist
	*/
	async getBagLastTiddlerId(bag_name: string) {
		const row = await this.engine.tiddlers.findFirst({
			where: { bag: { bag_name } },
			select: { tiddler_id: true },
			orderBy: { tiddler_id: "desc" }
		});
		return row?.tiddler_id ?? null;
		// 	const row = await this.engine.runStatementGet(`
		// 	SELECT tiddler_id
		// 	FROM tiddlers
		// 	WHERE bag_id IN (
		// 		SELECT bag_id
		// 		FROM bags
		// 		WHERE bag_name = $bag_name
		// 	)
		// 	ORDER BY tiddler_id DESC
		// 	LIMIT 1
		// `, {
		// 		$bag_name: bag_name
		// 	});
		// 	if (row) {
		// 		return row.tiddler_id;
		// 	} else {
		// 		return null;
		// 	}
	}
	/**
	Get the metadata of the tiddlers in a recipe as an array [{title:,tiddler_id:,bag_name:,is_deleted:}],
	sorted in ascending order of tiddler_id.
  
	Options include:
  
	limit: optional maximum number of results to return
	last_known_tiddler_id: tiddler_id of the last known update. Only returns tiddlers that have been created, modified or deleted since
	include_deleted: boolean, defaults to false
  
	Returns null for recipes that do not exist
  
	@returns {}
	*/
	async getRecipeTiddlers(recipe_name: string, options: {
		limit?: number,
		last_known_tiddler_id?: number,
		include_deleted?: boolean
	} = {}): Promise<{
		bag_name: string
		title: string
		tiddler_id: number
		is_deleted: boolean
	}[] | null> {

		const tiddlers = await this.engine.tiddlers.findMany({
			// all tiddlers in a bag that are in the recipe
			where: {
				bag: { recipe_bags: { some: { recipe: { recipe_name } } } },
				tiddler_id: options.last_known_tiddler_id ? {
					gt: options.last_known_tiddler_id
				} : undefined,
				is_deleted: options.include_deleted ? undefined : false
			},
			select: {
				title: true,
				tiddler_id: true,
				is_deleted: true,
				bag: {
					select: {
						bag_name: true,
						recipe_bags: {
							select: { position: true, recipe_id: true },
							where: { recipe: { recipe_name } }
						}
					}
				}
			}
		});

		const tiddlerMap = new Map<string, { tiddler: typeof tiddlers[number], position: number }>();
		for (const tiddler of tiddlers) {
			if (!tiddler.bag.recipe_bags.length)
				$tw.utils.warning(`Tiddler '${tiddler.title}' is not in the recipe '${recipe_name}'???`);
			if (tiddler.bag.recipe_bags.length > 1)
				$tw.utils.warning(`Tiddler bag '${tiddler.bag.bag_name}' is specified multiple times in the recipe '${recipe_name}'???`);

			const { position } = tiddler.bag.recipe_bags.sort((a, b) => b.position - a.position)[0];
			const current = tiddlerMap.get(tiddler.title);
			if (current) if (current.position > position) continue;
			tiddlerMap.set(tiddler.title, { position, tiddler });
		}

		return [...tiddlerMap.values()].map(({ tiddler }) => ({
			title: tiddler.title,
			tiddler_id: tiddler.tiddler_id,
			is_deleted: tiddler.is_deleted,
			bag_name: tiddler.bag.bag_name,
		}));



		// 	// Get the recipe ID
		// 	const rowsCheckRecipe = await this.engine.runStatementGet(`
		// 	SELECT recipe_id FROM recipes WHERE recipes.recipe_name = $recipe_name
		// `, {
		// 		$recipe_name: recipe_name
		// 	});
		// 	if (!rowsCheckRecipe) {
		// 		return null;
		// 	}
		// 	const recipe_id = rowsCheckRecipe.recipe_id;
		// 	// Compose the query to get the tiddlers
		// 	const params = {
		// 		$recipe_id: recipe_id
		// 	};
		// 	if (options.limit) {
		// 		params.$limit = options.limit.toString();
		// 	}
		// 	if (options.last_known_tiddler_id) {
		// 		params.$last_known_tiddler_id = options.last_known_tiddler_id;
		// 	}
		// 	/**	 * @type {any}	 */
		// 	const rows = await this.engine.runStatementGetAll(`
		// 	SELECT title, tiddler_id, is_deleted, bag_name
		// 	FROM (
		// 		SELECT t.title, t.tiddler_id, t.is_deleted, b.bag_name, MAX(rb.position) AS position
		// 		FROM bags AS b
		// 		INNER JOIN recipe_bags AS rb ON b.bag_id = rb.bag_id
		// 		INNER JOIN tiddlers AS t ON b.bag_id = t.bag_id
		// 		WHERE rb.recipe_id = $recipe_id
		// 		${options.include_deleted ? "" : "AND t.is_deleted = FALSE"}
		// 		${options.last_known_tiddler_id ? "AND tiddler_id > $last_known_tiddler_id" : ""}
		// 		GROUP BY t.title
		// 		ORDER BY t.title, tiddler_id DESC
		// 		${options.limit ? "LIMIT $limit" : ""}
		// 	)
		// `, params);

		// 	return rows;
	}
	/*
	Get the tiddler_id of the newest tiddler in a recipe. Returns null for recipes that do not exist
	*/
	async getRecipeLastTiddlerId(recipe_name: string) {
		// the old code was returning the latest tiddler_id out of every bag in the recipe, 
		// not just the latest visible tiddler_id, so we'll do the same for now
		const row = await this.engine.tiddlers.findFirst({
			where: { bag: { recipe_bags: { some: { recipe: { recipe_name } } } } },
			orderBy: { tiddler_id: "desc" },
			select: { tiddler_id: true }
		});
		return row?.tiddler_id ?? null;
		// 	const row = await this.engine.runStatementGet(`
		// 	SELECT t.title, t.tiddler_id, b.bag_name, MAX(rb.position) AS position
		// 	FROM bags AS b
		// 	INNER JOIN recipe_bags AS rb ON b.bag_id = rb.bag_id
		// 	INNER JOIN recipes AS r ON rb.recipe_id = r.recipe_id
		// 	INNER JOIN tiddlers AS t ON b.bag_id = t.bag_id
		// 	WHERE r.recipe_name = $recipe_name
		// 	GROUP BY t.title
		// 	ORDER BY t.tiddler_id DESC
		// 	LIMIT 1
		// `, {
		// 		$recipe_name: recipe_name
		// 	});
		// 	if (row) {
		// 		return row.tiddler_id;
		// 	} else {
		// 		return null;
		// 	}
	}
	async deleteAllTiddlersInBag(bag_name: string) {
		const { bag_id } = await this.engine.bags.findUniqueOrThrow({
			where: { bag_name },
			select: { bag_id: true },
		});
		const tiddlers = await this.engine.tiddlers.findMany({
			where: { bag: { bag_name } },
		})
		await this.engine.tiddlers.deleteMany({
			where: { bag: { bag_name } },
		})
		// create the delete marker
		await this.engine.tiddlers.createManyAndReturn({
			data: tiddlers.map(({ title }) => ({
				title,
				bag_id,
				is_deleted: true,
				attachment_blob: null,
			})),
			select: { tiddler_id: true, title: true }
		});

		// await this.engine.tiddlers.deleteMany({
		// 	where: { bag: { bag_name } }
		// });
		// await this.engine.tiddlers.createMany({
		// 	data: [{ title: "$:/status/IsReadOnly", is_deleted: false, bag: { connect: { bag_name } } }]
		// })
		// 	// Delete the fields
		// 	await this.engine.runStatement(`
		// 	DELETE FROM fields
		// 	WHERE tiddler_id IN (
		// 		SELECT tiddler_id
		// 		FROM tiddlers
		// 		WHERE bag_id = (SELECT bag_id FROM bags WHERE bag_name = $bag_name)
		// 		AND is_deleted = FALSE
		// 	)
		// `, {
		// 		$bag_name: bag_name
		// 	});
		// 	// Mark the tiddlers as deleted
		// 	await this.engine.runStatement(`
		// 	UPDATE tiddlers
		// 	SET is_deleted = TRUE
		// 	WHERE bag_id = (SELECT bag_id FROM bags WHERE bag_name = $bag_name)
		// 	AND is_deleted = FALSE
		// `, {
		// 		$bag_name: bag_name
		// 	});
	}
	/*
	Get the names of the bags in a recipe. Returns an empty array for recipes that do not exist
	*/
	async getRecipeBags(recipe_name: string) {
		const rows = await this.engine.recipe_bags.findMany({
			where: { recipe: { recipe_name } },
			select: { bag: { select: { bag_name: true } } },
			orderBy: { position: "asc" }
		});
		return rows.map(e => e.bag.bag_name);
		// 	const rows = await this.engine.runStatementGetAll(`
		// 	SELECT bags.bag_name
		// 	FROM bags
		// 	JOIN (
		// 		SELECT rb.bag_id, rb.position as position
		// 		FROM recipe_bags AS rb
		// 		JOIN recipes AS r ON rb.recipe_id = r.recipe_id
		// 		WHERE r.recipe_name = $recipe_name
		// 		ORDER BY rb.position
		// 	) AS bag_priority ON bags.bag_id = bag_priority.bag_id
		// 	ORDER BY position
		// `, {
		// 		$recipe_name: recipe_name
		// 	});
		// 	return rows.map(value => value.bag_name);

	}
	/*
	Get the attachment value of a bag, if any exist
	*/
	async getBagTiddlerAttachmentBlob(title: string, bag_name: string) {
		const row = await this.engine.tiddlers.findFirst({
			where: { bag: { bag_name }, title },
			select: { attachment_blob: true }
		});
		return row?.attachment_blob ?? null;
		// 	const row = await this.engine.runStatementGet(`
		// 	SELECT t.attachment_blob
		// 	FROM bags AS b
		// 	INNER JOIN tiddlers AS t ON b.bag_id = t.bag_id
		// 	WHERE t.title = $title AND b.bag_name = $bag_name AND t.is_deleted = FALSE
		// `, {
		// 		$title: title,
		// 		$bag_name: bag_name
		// 	});
		// 	return row ? row.attachment_blob : null;
	}
	async getRecipeTiddlerBag({ title, recipe_name }: { title: string; recipe_name: string; }) {
		const bag = await this.engine.recipe_bags.findFirst({
			// where: the first recipe_bag containing this tiddler, in descending order
			where: { recipe: { recipe_name }, bag: { tiddlers: { some: { title } } } },
			orderBy: { position: "desc" },
			// select: the bag_id
			select: { bag_id: true },
		});
		return bag;
	}
	/*
	Get the attachment value of a recipe, if any exist
	*/
	async getRecipeTiddlerAttachmentBlob(title: string, recipe_name: string) {
		const bag = await this.getRecipeTiddlerBag({ title, recipe_name });
		if (!bag) return null;

		const tiddler = await this.engine.tiddlers.findUnique({
			where: { bag_id_title: { bag_id: bag.bag_id, title } },
			select: { attachment_blob: true }
		});

		return tiddler?.attachment_blob ?? null;
		// 	const row = await this.engine.runStatementGet(`
		// 	SELECT t.attachment_blob
		// 	FROM bags AS b
		// 	INNER JOIN recipe_bags AS rb ON b.bag_id = rb.bag_id
		// 	INNER JOIN recipes AS r ON rb.recipe_id = r.recipe_id
		// 	INNER JOIN tiddlers AS t ON b.bag_id = t.bag_id
		// 	WHERE r.recipe_name = $recipe_name AND t.title = $title AND t.is_deleted = FALSE
		// 	ORDER BY rb.position DESC
		// 	LIMIT 1
		// `, {
		// 		$title: title,
		// 		$recipe_name: recipe_name
		// 	});
		// 	return row ? row.attachment_blob : null;
	}
	// User CRUD operations
	async createUser(username: string, email: string, password: string) {
		const result = await this.engine.users.create({
			data: {
				username,
				email,
				password
			},
			select: {
				user_id: true
			}
		});
		return result.user_id;
		// 	const result = await this.engine.runStatement(`
		// 		INSERT INTO users (username, email, password)
		// 		VALUES ($username, $email, $password)
		// `, {
		// 		$username: username,
		// 		$email: email,
		// 		$password: password
		// 	});
		// 	return result.lastInsertRowid;
	}
	async getUser(user_id: number) {
		okType(user_id, "number", "No userId provided");
		return await this.engine.users.findUnique({
			where: { user_id }
		});
		// 	return await this.engine.runStatementGet(`
		// 		SELECT * FROM users WHERE user_id = $userId
		// `, {
		// 		$userId: userId
		// 	});
	}
	async getUserByUsername(username: string) {
		return await this.engine.users.findFirst({
			where: { username },
		});
		// 	return await this.engine.runStatementGet(`
		// 		SELECT * FROM users WHERE username = $username
		// `, {
		// 		$username: username
		// 	});
	}
	async getUserByEmail(email: string) {
		return await this.engine.users.findFirst({
			where: { email },
		});
		// 	return await this.engine.runStatementGet(`
		// 		SELECT * FROM users WHERE email = $email
		// `, {
		// 		$email: email
		// 	});
	}
	async listUsersByRoleId(role_id: number) {
		return await this.engine.users.findMany({
			where: { user_roles: { some: { role_id } } },
			orderBy: { username: "asc" }
		});
		// 	return await this.engine.runStatementGetAll(`
		// 		SELECT u.*
		// 		FROM users u
		// 		JOIN user_roles ur ON u.user_id = ur.user_id
		// 		WHERE ur.role_id = $roleId
		// 		ORDER BY u.username
		// `, {
		// 		$roleId: roleId
		// 	});
	}
	async updateUser(user_id: number, username: string, email: string, role_id?: number) {
		const existingUser = await this.engine.users.findFirst({
			where: { user_id: { not: user_id }, email },
		});
		if (existingUser) {
			return {
				success: false,
				message: "Email address already in use by another user."
			};
		}
		await this.engine.users.update({
			where: { user_id },
			data: { username, email }
		});
		if (typeof role_id === "number") {
			await this.engine.user_roles.deleteMany({
				where: { user_id }
			});
			await this.engine.user_roles.create({
				data: { user_id, role_id }
			});
		}
		return {
			success: true,
			message: "User profile and role updated successfully."
		};

		// });
		// 		const existingUser = await this.engine.runStatementGet(`
		// 		SELECT user_id FROM users
		// 		WHERE email = $email AND user_id != $userId
		// `, {
		// 			$email: email,
		// 			$userId: userId
		// 		});

		// 		if (existingUser) {
		// 			return {
		// 				success: false,
		// 				message: "Email address already in use by another user."
		// 			};
		// 		}

		// 		try {
		// 			await this.engine.transaction(async () => {
		// 				// Update user information
		// 				await this.engine.runStatement(`
		// 				UPDATE users
		// 				SET username = $username, email = $email
		// 				WHERE user_id = $userId
		// 			`, {
		// 					$userId: userId,
		// 					$username: username,
		// 					$email: email
		// 				});

		// 				if (roleId) {
		// 					// Remove all existing roles for the user
		// 					await this.engine.runStatement(`
		// 					DELETE FROM user_roles
		// 					WHERE user_id = $userId
		// 				`, {
		// 						$userId: userId
		// 					});

		// 					// Add the new role
		// 					await this.engine.runStatement(`
		// 					INSERT INTO user_roles (user_id, role_id)
		// 					VALUES ($userId, $roleId)
		// 				`, {
		// 						$userId: userId,
		// 						$roleId: roleId
		// 					});
		// 				}
		// 			});

		// 			return {
		// 				success: true,
		// 				message: "User profile and role updated successfully."
		// 			};
		// 		} catch (error) {
		// 			return {
		// 				success: false,
		// 				message: "Failed to update user profile: " + error.message
		// 			};
		// 		}
	}
	async updateUserPassword(user_id: number, password: string) {
		await this.engine.users.update({
			where: { user_id },
			data: { password }
		});
		// try {
		// 	await this.engine.runStatement(`
		// 		UPDATE users
		// 		SET password = $newHash
		// 		WHERE user_id = $userId
		// `, {
		// 		$userId: userId,
		// 		$newHash: newHash,
		// 	});

		// 	return {
		// 		success: true,
		// 		message: "Password updated successfully."
		// 	};
		// } catch (error) {
		// 	return {
		// 		success: false,
		// 		message: "Failed to update password: " + error.message
		// 	};
		// }
	}
	async deleteUser(user_id: number) {
		await this.engine.users.delete({
			where: { user_id }
		});
		// 	await this.engine.runStatement(`
		// 		DELETE FROM users WHERE user_id = $userId
		// `, {
		// 		$userId: userId
		// 	});
	}
	async listUsers() {
		return await this.engine.users.findMany({
			orderBy: { username: "asc" }
		});
		// 	return await this.engine.runStatementGetAll(`
		// 		SELECT * FROM users ORDER BY username
		// `);
	}
	async createOrUpdateUserSession(user_id: number, session_id: string) {
		const currentTimestamp = new Date().toISOString();
		// First, try to update an existing session
		const updateResult = await this.engine.sessions.updateMany({
			where: { user_id },
			data: {
				session_id,
				last_accessed: currentTimestamp
			},
		});
		// If no existing session was updated, create a new one
		if (updateResult.count === 0) {
			await this.engine.sessions.create({
				data: {
					user_id,
					session_id,
					created_at: currentTimestamp,
					last_accessed: currentTimestamp
				}
			});
		}
		return session_id;

		// await this.engine.sessions.upsert({
		// 	create: {
		// 		user_id,
		// 		session_id,
		// 		created_at: currentTimestamp,
		// 		last_accessed: currentTimestamp
		// 	},
		// 	update: {
		// 		session_id,
		// 		last_accessed: currentTimestamp
		// 	},
		// 	where: { user_id },
		// });

		// 	const currentTimestamp = new Date().toISOString();

		// 	// First, try to update an existing session
		// 	const updateResult = await this.engine.runStatement(`
		// 		UPDATE sessions
		// 		SET session_id = $sessionId, last_accessed = $timestamp
		// 		WHERE user_id = $userId
		// `, {
		// 		$userId: userId,
		// 		$sessionId: sessionId,
		// 		$timestamp: currentTimestamp
		// 	});

		// 	// If no existing session was updated, create a new one
		// 	if (updateResult.changes === 0) {
		// 		await this.engine.runStatement(`
		// 				INSERT INTO sessions (user_id, session_id, created_at, last_accessed)
		// 				VALUES ($userId, $sessionId, $timestamp, $timestamp)
		// 		`, {
		// 			$userId: userId,
		// 			$sessionId: sessionId,
		// 			$timestamp: currentTimestamp
		// 		});
		// 	}

		// 	return sessionId;
	}
	async createUserSession(user_id: number, session_id: string) {
		const currentTimestamp = new Date().toISOString();
		await this.engine.sessions.create({
			data: {
				user_id,
				session_id,
				created_at: currentTimestamp,
				last_accessed: currentTimestamp
			}
		});
		// 	await this.engine.runStatement(`
		// 		INSERT INTO sessions (user_id, session_id, created_at, last_accessed)
		// 		VALUES ($userId, $sessionId, $timestamp, $timestamp)
		// `, {
		// 		$userId: userId,
		// 		$sessionId: sessionId,
		// 		$timestamp: currentTimestamp
		// 	});
		return session_id;
	}
	/**
	 * @typedef {Object} User
	 * @property {number} user_id
	 * @property {string} username
	 * @property {string} email
	 * @property {string} [password]
	 * @property {string} created_at
	 * @property {string} last_login
	*/

	async findUserBySessionId(session_id: string) {
		const session = await this.engine.sessions.findUnique({
			where: { session_id },
			select: { last_accessed: true, user: true }
		});
		if (!session) return null;
		const lastAccessed = new Date(session.last_accessed);
		const expirationTime = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
		if ((+new Date() - +lastAccessed) > expirationTime) {
			await this.deleteSession(session_id);
			return null;
		}
		// Update the last_accessed timestamp
		const currentTimestamp = new Date().toISOString();
		await this.engine.sessions.update({
			where: { session_id },
			data: { last_accessed: currentTimestamp }
		});
		return session.user;

		// 	// First, get the user_id from the sessions table
		// 	const sessionResult = await this.engine.runStatementGet(`
		// 		SELECT user_id, last_accessed
		// 		FROM sessions
		// 		WHERE session_id = $sessionId
		// `, {
		// 		$sessionId: sessionId
		// 	});

		// 	if (!sessionResult) {
		// 		return null; // Session not found
		// 	}

		// 	const lastAccessed = new Date(sessionResult.last_accessed);
		// 	const expirationTime = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
		// 	if (new Date() - lastAccessed > expirationTime) {
		// 		// Session has expired
		// 		await this.deleteSession(sessionId);
		// 		return null;
		// 	}

		// 	// Update the last_accessed timestamp
		// 	const currentTimestamp = new Date().toISOString();
		// 	await this.engine.runStatement(`
		// 		UPDATE sessions
		// 		SET last_accessed = $timestamp
		// 		WHERE session_id = $sessionId
		// `, {
		// 		$sessionId: sessionId,
		// 		$timestamp: currentTimestamp
		// 	});
		// 	/** @type {any} */
		// 	const userResult = await this.engine.runStatementGet(`
		// 		SELECT *
		// 		FROM users
		// 		WHERE user_id = $userId
		// `, {
		// 		$userId: sessionResult.user_id
		// 	});

		// 	if (!userResult) {
		// 		return null;
		// 	}

		// 	return userResult;
	}
	async deleteSession(session_id: string) {
		await this.engine.sessions.delete({
			where: { session_id }
		});
		// 	await this.engine.runStatement(`
		// 		DELETE FROM sessions
		// 		WHERE session_id = $sessionId
		// `, {
		// 		$sessionId: sessionId
		// 	});
	}
	async deleteUserSessions(user_id: number) {
		await this.engine.sessions.deleteMany({
			where: { user_id }
		});
		// 	await this.engine.runStatement(`
		// 		DELETE FROM sessions
		// 		WHERE user_id = $userId
		// `, {
		// 		$userId: userId
		// 	});
	}
	// Set the user as an admin
	async setUserAdmin(user_id: number) {
		const admin = await this.getRoleByName("ADMIN");
		if (admin) {
			await this.addRoleToUser(user_id, admin.role_id);
		}
		// var admin = await this.getRoleByName("ADMIN");
		// if (admin) {
		// 	await this.addRoleToUser(userId, admin.role_id);
		// }

	}
	// Group CRUD operations
	async createGroup(group_name: string, description: string) {
		const result = await this.engine.groups.create({
			data: {
				group_name,
				description
			},
			select: { group_id: true }
		});
		return result.group_id;
		// 	const result = await this.engine.runStatement(`
		// 		INSERT INTO groups (group_name, description)
		// 		VALUES ($groupName, $description)
		// `, {
		// 		$groupName: groupName,
		// 		$description: description
		// 	});
		// 	return result.lastInsertRowid;
	}
	async getGroup(groupId: number) {
		return await this.engine.groups.findUnique({
			where: { group_id: groupId }
		});
		// 	return await this.engine.runStatementGet(`
		// 		SELECT * FROM groups WHERE group_id = $groupId
		// `, {
		// 		$groupId: groupId
		// 	});
	}
	async updateGroup(groupId: number, groupName: string, description: string) {
		await this.engine.groups.update({
			where: { group_id: groupId },
			data: { group_name: groupName, description }
		});
		// 	await this.engine.runStatement(`
		// 		UPDATE groups
		// 		SET group_name = $groupName, description = $description
		// 		WHERE group_id = $groupId
		// `, {
		// 		$groupId: groupId,
		// 		$groupName: groupName,
		// 		$description: description
		// 	});
	}
	async deleteGroup(groupId: number) {
		return await this.engine.groups.delete({
			where: { group_id: groupId }
		});
		// 	await this.engine.runStatement(`
		// 		DELETE FROM groups WHERE group_id = $groupId
		// `, {
		// 		$groupId: groupId
		// 	});
	}
	async listGroups() {
		return await this.engine.groups.findMany({
			orderBy: { group_name: "asc" }
		});
		// 	return await this.engine.runStatementGetAll(`
		// 		SELECT * FROM groups ORDER BY group_name
		// `);
	}
	// Role CRUD operations
	async createRole(roleName: string, description: string) {
		const result = await this.engine.roles.create({
			data: {
				role_name: roleName,
				description
			},
			select: { role_id: true }
		});
		// 	const result = await this.engine.runStatement(`
		// 		INSERT OR IGNORE INTO roles (role_name, description)
		// 		VALUES ($roleName, $description)
		// `, {
		// 		$roleName: roleName,
		// 		$description: description
		// 	});
		// 	return result.lastInsertRowid;
	}
	async getRole(roleId: number) {
		return await this.engine.roles.findUnique({
			where: { role_id: roleId }
		});
		// 	return await this.engine.runStatementGet(`
		// 		SELECT * FROM roles WHERE role_id = $roleId
		// `, {
		// 		$roleId: roleId
		// 	});
	}
	async getRoleByName(roleName: string) {
		return await this.engine.roles.findFirst({
			where: { role_name: roleName }
		});
		// 	return await this.engine.runStatementGet(`
		// 		SELECT * FROM roles WHERE role_name = $roleName
		// `, {
		// 		$roleName: roleName
		// 	});
	}
	async updateRole(roleId: number, roleName: string, description: string) {
		await this.engine.roles.update({
			where: { role_id: roleId },
			data: { role_name: roleName, description }
		});
		// 	await this.engine.runStatement(`
		// 		UPDATE roles
		// 		SET role_name = $roleName, description = $description
		// 		WHERE role_id = $roleId
		// `, {
		// 		$roleId: roleId,
		// 		$roleName: roleName,
		// 		$description: description
		// 	});
	}
	async deleteRole(roleId: number) {
		await this.engine.roles.delete({
			where: { role_id: roleId }
		});
		// 	await this.engine.runStatement(`
		// 		DELETE FROM roles WHERE role_id = $roleId
		// `, {
		// 		$roleId: roleId
		// 	});
	}
	async listRoles() {
		return await this.engine.roles.findMany({
			orderBy: { role_name: "asc" }
		});
		// 	return await this.engine.runStatementGetAll(`
		// 		SELECT * FROM roles ORDER BY role_name DESC
		// `);
	}
	// Permission CRUD operations
	async createPermission(permissionName: string, description: string) {
		const result = await this.engine.permissions.create({
			data: {
				permission_name: permissionName,
				description
			},
			select: { permission_id: true }
		});
		return result.permission_id;
		// 	const result = await this.engine.runStatement(`
		// 	INSERT OR IGNORE INTO permissions (permission_name, description)
		// 	VALUES ($permissionName, $description)
		// `, {
		// 		$permissionName: permissionName,
		// 		$description: description
		// 	});
		// 	return result.lastInsertRowid;
	}
	async getPermission(permissionId: number) {
		return await this.engine.permissions.findUnique({
			where: { permission_id: permissionId }
		});
		// 	return await this.engine.runStatementGet(`
		// 		SELECT * FROM permissions WHERE permission_id = $permissionId
		// `, {
		// 		$permissionId: permissionId
		// 	});
	}
	async getPermissionByName(permissionName: string) {
		return await this.engine.permissions.findFirst({
			where: { permission_name: permissionName }
		});
		// return await this.engine.runStatementGet(`
		// 		SELECT * FROM permissions WHERE permission_name = $permissionName
		// `, {
		// 		$permissionName: permissionName
		// 	});
	}
	async updatePermission(permissionId: number, permissionName: string, description: string) {
		await this.engine.permissions.update({
			where: { permission_id: permissionId },
			data: { permission_name: permissionName, description }
		});
		// 	await this.engine.runStatement(`
		// 		UPDATE permissions
		// 		SET permission_name = $permissionName, description = $description
		// 		WHERE permission_id = $permissionId
		// `, {
		// 		$permissionId: permissionId,
		// 		$permissionName: permissionName,
		// 		$description: description
		// 	});
	}
	async deletePermission(permissionId: number) {
		await this.engine.permissions.delete({
			where: { permission_id: permissionId }
		});
		// 	await this.engine.runStatement(`
		// 		DELETE FROM permissions WHERE permission_id = $permissionId
		// `, {
		// 		$permissionId: permissionId
		// 	});
	}
	async listPermissions() {
		return await this.engine.permissions.findMany({
			orderBy: { permission_name: "asc" }
		});
		// 	return await this.engine.runStatementGetAll(`
		// 		SELECT * FROM permissions ORDER BY permission_name
		// `);
	}
	// ACL CRUD operations
	async createACL(entityName: string, entityType: EntityType, roleId: number, permissionId: number) {
		if (entityName.startsWith("$:/")) return;
		// No idea why this was insert or replace into because the only thing unique is the acl_id,
		// which is not include in this call, so it would never replace.
		await this.engine.acl.create({
			data: {
				entity_name: entityName,
				entity_type: entityType,
				role_id: roleId,
				permission_id: permissionId
			}
		});
		// if (!entityName.startsWith("$:/")) {
		// 	const result = await this.engine.runStatement(`
		// 	INSERT OR IGNORE INTO acl (entity_name, entity_type, role_id, permission_id)
		// 	VALUES ($entityName, $entityType, $roleId, $permissionId)
		// `,
		// 		{
		// 			$entityName: entityName,
		// 			$entityType: entityType,
		// 			$roleId: roleId,
		// 			$permissionId: permissionId
		// 		});
		// 	return result.lastInsertRowid;
		// }
	}
	async getACL(aclId: number) {
		return await this.engine.acl.findUnique({
			where: { acl_id: aclId }
		});
		// 	return await this.engine.runStatementGet(`
		// 		SELECT * FROM acl WHERE acl_id = $aclId
		// `, {
		// 		$aclId: aclId
		// 	});
	}
	async updateACL(aclId: number, entityId: string, entityType: EntityType, roleId: number, permissionId: number) {
		await this.engine.acl.update({
			where: { acl_id: aclId },
			data: {
				entity_name: entityId,
				entity_type: entityType,
				role_id: roleId,
				permission_id: permissionId
			}
		});
		// 	await this.engine.runStatement(`
		// 		UPDATE acl
		// 		SET entity_name = $entityId, entity_type = $entityType, 
		// 				role_id = $roleId, permission_id = $permissionId
		// 		WHERE acl_id = $aclId
		// `, {
		// 		$aclId: aclId,
		// 		$entityId: entityId,
		// 		$entityType: entityType,
		// 		$roleId: roleId,
		// 		$permissionId: permissionId
		// 	});
	}
	async deleteACL(aclId: number) {
		await this.engine.acl.delete({
			where: { acl_id: aclId }
		});
		// 	await this.engine.runStatement(`
		// 		DELETE FROM acl WHERE acl_id = $aclId
		// `, {
		// 		$aclId: aclId
		// 	});
	}
	async listACLs() {
		return await this.engine.acl.findMany({
			orderBy: [{ entity_type: "asc" }, { entity_name: "asc" }]
		});
		// 	return await this.engine.runStatementGetAll(`
		// 		SELECT * FROM acl ORDER BY entity_type, entity_name
		// `);
	}
	// Association management functions
	async addUserToGroup(userId: number, groupId: number) {
		await this.engine.user_groups.create({
			data: {
				user_id: userId,
				group_id: groupId
			},
		});
		// 	await this.engine.runStatement(`
		// 		INSERT OR IGNORE INTO user_groups (user_id, group_id)
		// 		VALUES ($userId, $groupId)
		// `, {
		// 		$userId: userId,
		// 		$groupId: groupId
		// 	});
	}
	async isUserInGroup(userId: number, groupId: number) {
		const result = await this.engine.user_groups.findFirst({
			where: { user_id: userId, group_id: groupId }
		});
		return !!result;
		// 	const result = await this.engine.runStatementGet(`
		// 		SELECT 1 FROM user_groups
		// 		WHERE user_id = $userId AND group_id = $groupId
		// `, {
		// 		$userId: userId,
		// 		$groupId: groupId
		// 	});
		// 	return result !== undefined;
	}
	async removeUserFromGroup(userId: number, groupId: number) {
		await this.engine.user_groups.delete({
			where: { user_id_group_id: { user_id: userId, group_id: groupId } }
		});

		// 	await this.engine.runStatement(`
		// 		DELETE FROM user_groups
		// 		WHERE user_id = $userId AND group_id = $groupId
		// `, {
		// 		$userId: userId,
		// 		$groupId: groupId
		// 	});
	}
	async addRoleToUser(userId: number, roleId: number) {
		await this.engine.user_roles.create({
			data: {
				user_id: userId,
				role_id: roleId
			}
		});
		// 	await this.engine.runStatement(`
		// 		INSERT OR IGNORE INTO user_roles (user_id, role_id)
		// 		VALUES ($userId, $roleId)
		// `, {
		// 		$userId: userId,
		// 		$roleId: roleId
		// 	});
	}
	async removeRoleFromUser(userId: number, roleId: number) {
		await this.engine.user_roles.delete({
			where: { user_id_role_id: { user_id: userId, role_id: roleId } }
		});
		// 	await this.engine.runStatement(`
		// 		DELETE FROM user_roles
		// 		WHERE user_id = $userId AND role_id = $roleId
		// `, {
		// 		$userId: userId,
		// 		$roleId: roleId
		// 	});
	}
	async addRoleToGroup(groupId: number, roleId: number) {
		await this.engine.group_roles.create({
			data: {
				group_id: groupId,
				role_id: roleId
			}
		});
		// 	await this.engine.runStatement(`
		// 		INSERT OR IGNORE INTO group_roles (group_id, role_id)
		// 		VALUES ($groupId, $roleId)
		// `, {
		// 		$groupId: groupId,
		// 		$roleId: roleId
		// 	});
	}
	async removeRoleFromGroup(groupId: number, roleId: number) {
		await this.engine.group_roles.delete({
			where: { group_id_role_id: { group_id: groupId, role_id: roleId } }
		});
		// 	await this.engine.runStatement(`
		// 		DELETE FROM group_roles
		// 		WHERE group_id = $groupId AND role_id = $roleId
		// `, {
		// 		$groupId: groupId,
		// 		$roleId: roleId
		// 	});
	}
	async addPermissionToRole(roleId: number, permissionId: number) {
		await this.engine.role_permissions.create({
			data: {
				role_id: roleId,
				permission_id: permissionId
			}
		});
		// 	await this.engine.runStatement(`
		// 		INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
		// 		VALUES ($roleId, $permissionId)
		// `, {
		// 		$roleId: roleId,
		// 		$permissionId: permissionId
		// 	});
	}
	async removePermissionFromRole(roleId: number, permissionId: number) {
		await this.engine.role_permissions.delete({
			where: { role_id_permission_id: { role_id: roleId, permission_id: permissionId } }
		});
		// 	await this.engine.runStatement(`
		// 		DELETE FROM role_permissions
		// 		WHERE role_id = $roleId AND permission_id = $permissionId
		// `, {
		// 		$roleId: roleId,
		// 		$permissionId: permissionId
		// 	});
	}
	async getUserRoles(userId: number) {
		return await this.engine.user_roles.findFirst({
			where: { user_id: userId },
			select: { role: { select: { role_name: true } } }
		}).then(e => e && ({ role_name: e.role.role_name }));
		// 	const query = `
		// 		SELECT r.role_id, r.role_name
		// 		FROM user_roles ur
		// 		JOIN roles r ON ur.role_id = r.role_id
		// 		WHERE ur.user_id = $userId
		// 		LIMIT 1
		// `;
		// 	return await this.engine.runStatementGet(query, { $userId: userId });
	}
	async deleteUserRolesByRoleId(roleId: number) {
		await this.engine.user_roles.deleteMany({
			where: { role_id: roleId }
		});
		// 	await this.engine.runStatement(`
		// 		DELETE FROM user_roles
		// 		WHERE role_id = $roleId
		// `, {
		// 		$roleId: roleId
		// 	});
	}
	async deleteUserRolesByUserId(userId: number) {
		await this.engine.user_roles.deleteMany({
			where: { user_id: userId }
		});
		// 	await this.engine.runStatement(`
		// 		DELETE FROM user_roles
		// 		WHERE user_id = $userId
		// `, {
		// 		$userId: userId
		// 	});
	}
	async isRoleInUse(roleId: number) {
		// Check if the role is assigned to any users
		// 	const userRoleCheck = await this.engine.runStatementGet(`
		// 	SELECT 1
		// 	FROM user_roles
		// 	WHERE role_id = $roleId
		// 	LIMIT 1
		// `, {
		// 		$roleId: roleId
		// 	});
		const userRoleCheck = await this.engine.user_roles.findFirst({
			where: { role_id: roleId }
		});

		if (userRoleCheck) {
			return true;
		}

		// Check if the role is used in any ACLs
		// 	const aclRoleCheck = await this.engine.runStatementGet(`
		// 	SELECT 1
		// 	FROM acl
		// 	WHERE role_id = $roleId
		// 	LIMIT 1
		// `, {
		// 		$roleId: roleId
		// 	});
		const aclRoleCheck = await this.engine.acl.findFirst({
			where: { role_id: roleId }
		});

		if (aclRoleCheck) {
			return true;
		}

		// If we've reached this point, the role is not in use
		return false;
	}
	async getRoleById(roleId: number) {
		return await this.engine.roles.findUnique({
			where: { role_id: roleId }
		});
		// 	const role = await this.engine.runStatementGet(`
		// 	SELECT role_id, role_name, description
		// 	FROM roles
		// 	WHERE role_id = $roleId
		// `, {
		// 		$roleId: roleId
		// 	});

		// return role;
	}
}
