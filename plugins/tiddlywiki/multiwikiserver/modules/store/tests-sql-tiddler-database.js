/*\
title: $:/plugins/tiddlywiki/multiwikiserver/store/tests-sql-tiddler-database.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the SQL tiddler database layer

\*/
/// <reference types="@types/jest" />
if($tw.node) {
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

describe("SQL tiddler database with node built-in sqlite", function () {
	void runSqlDatabaseTests("node").catch(console.error);
});

describe("SQL tiddler database with node-sqlite3-wasm", function () {
	void runSqlDatabaseTests("wasm").catch(console.error);
});

describe("SQL tiddler database with better-sqlite3", function () {
	void runSqlDatabaseTests("better").catch(console.error);
});

async function runSqlDatabaseTests(engine) {
	// Create and initialise the tiddler store
	var SqlTiddlerDatabase = require("$:/plugins/tiddlywiki/multiwikiserver/store/sql-tiddler-database.js").SqlTiddlerDatabase;
	const sqlTiddlerDatabase = new SqlTiddlerDatabase({
		engine: engine
	});
	await sqlTiddlerDatabase.createTables();
	// Tear down
	afterAll(async function() {
		// Close the database
		await sqlTiddlerDatabase.close();
	});
	// Run tests
	it("should save and retrieve tiddlers using engine: " + engine, async function() {
		// Create bags and recipes
		expect(await sqlTiddlerDatabase.createBag("bag-alpha","Bag alpha")).toEqual(1);
		expect(await sqlTiddlerDatabase.createBag("bag-beta","Bag beta")).toEqual(2);
		expect(await sqlTiddlerDatabase.createBag("bag-gamma","Bag gamma")).toEqual(3);
		expect(await sqlTiddlerDatabase.listBags()).toEqual([
			{ bag_name: 'bag-alpha', bag_id: 1, accesscontrol: '', description: "Bag alpha" },
			{ bag_name: 'bag-beta', bag_id: 2, accesscontrol: '', description: "Bag beta" },
			{ bag_name: 'bag-gamma', bag_id: 3, accesscontrol: '', description: "Bag gamma" }
		]);
		expect(await sqlTiddlerDatabase.createRecipe("recipe-rho",["bag-alpha","bag-beta"],"Recipe rho")).toEqual(1);
		expect(await sqlTiddlerDatabase.createRecipe("recipe-sigma",["bag-alpha","bag-gamma"],"Recipe sigma")).toEqual(2);
		expect(await sqlTiddlerDatabase.createRecipe("recipe-tau",["bag-alpha"],"Recipe tau")).toEqual(3);
		expect(await sqlTiddlerDatabase.createRecipe("recipe-upsilon",["bag-alpha","bag-gamma","bag-beta"],"Recipe upsilon")).toEqual(4);
		expect(await sqlTiddlerDatabase.listRecipes()).toEqual([
			{ recipe_name: 'recipe-rho', recipe_id: 1, bag_names: ["bag-alpha","bag-beta"], description: "Recipe rho", owner_id: null },
			{ recipe_name: 'recipe-sigma', recipe_id: 2, bag_names: ["bag-alpha","bag-gamma"], description: "Recipe sigma", owner_id: null },
			{ recipe_name: 'recipe-tau', recipe_id: 3, bag_names: ["bag-alpha"], description: "Recipe tau", owner_id: null },
			{ recipe_name: 'recipe-upsilon', recipe_id: 4, bag_names: ["bag-alpha","bag-gamma","bag-beta"], description: "Recipe upsilon", owner_id: null }
		]);
		expect(await sqlTiddlerDatabase.getRecipeBags("recipe-rho")).toEqual(["bag-alpha","bag-beta"]);
		expect(await sqlTiddlerDatabase.getRecipeBags("recipe-sigma")).toEqual(["bag-alpha","bag-gamma"]);
		expect(await sqlTiddlerDatabase.getRecipeBags("recipe-tau")).toEqual(["bag-alpha"]);
		expect(await sqlTiddlerDatabase.getRecipeBags("recipe-upsilon")).toEqual(["bag-alpha","bag-gamma","bag-beta"]);
		// Save tiddlers
		expect(await sqlTiddlerDatabase.saveBagTiddler({title: "Another Tiddler",text: "I'm in alpha",tags: "one two three"},"bag-alpha")).toEqual({
			tiddler_id: 1
		});
		expect(await sqlTiddlerDatabase.saveBagTiddler({title: "Hello There",text: "I'm in alpha as well",tags: "one two three"},"bag-alpha")).toEqual({
			tiddler_id: 2
		});
		expect(await sqlTiddlerDatabase.saveBagTiddler({title: "Hello There",text: "I'm in beta",tags: "four five six"},"bag-beta")).toEqual({
			tiddler_id: 3
		});
		expect(await sqlTiddlerDatabase.saveBagTiddler({title: "Hello There",text: "I'm in gamma",tags: "seven eight nine"},"bag-gamma")).toEqual({
			tiddler_id: 4
		});
		// Verify what we've got
		expect(await sqlTiddlerDatabase.getRecipeTiddlers("recipe-rho")).toEqual([ 
			{ title: 'Another Tiddler', tiddler_id: 1, bag_name: 'bag-alpha', is_deleted: 0 },
			{ title: 'Hello There', tiddler_id: 3, bag_name: 'bag-beta', is_deleted: 0 }
		]);
		expect(await sqlTiddlerDatabase.getRecipeTiddlers("recipe-sigma")).toEqual([
			{ title: 'Another Tiddler', tiddler_id: 1, bag_name: 'bag-alpha', is_deleted: 0 },
    		{ title: 'Hello There', tiddler_id: 4, bag_name: 'bag-gamma', is_deleted: 0 }
		]);
		expect((await sqlTiddlerDatabase.getRecipeTiddler("Hello There","recipe-rho"))?.tiddler).toEqual({ title: "Hello There", text: "I'm in beta", tags: "four five six" });
		expect(await sqlTiddlerDatabase.getRecipeTiddler("Missing Tiddler","recipe-rho")).toEqual(null);
		expect((await sqlTiddlerDatabase.getRecipeTiddler("Another Tiddler","recipe-rho"))?.tiddler).toEqual({ title: "Another Tiddler", text: "I'm in alpha", tags: "one two three" });
		expect((await sqlTiddlerDatabase.getRecipeTiddler("Hello There","recipe-sigma"))?.tiddler).toEqual({ title: "Hello There", text: "I'm in gamma", tags: "seven eight nine" });
		expect((await sqlTiddlerDatabase.getRecipeTiddler("Another Tiddler","recipe-sigma"))?.tiddler).toEqual({ title: "Another Tiddler", text: "I'm in alpha", tags: "one two three" });
		expect((await sqlTiddlerDatabase.getRecipeTiddler("Hello There","recipe-upsilon"))?.tiddler).toEqual({title: "Hello There",text: "I'm in beta",tags: "four five six"});
		// Delete a tiddlers to ensure the underlying tiddler in the recipe shows through
		await sqlTiddlerDatabase.deleteTiddler("Hello There","bag-beta");
		expect(await sqlTiddlerDatabase.getRecipeTiddlers("recipe-rho")).toEqual([
			{ title: 'Another Tiddler', tiddler_id: 1, bag_name: 'bag-alpha', is_deleted: 0 },
    		{ title: 'Hello There', tiddler_id: 2, bag_name: 'bag-alpha', is_deleted: 0 }
		]);
		expect(await sqlTiddlerDatabase.getRecipeTiddlers("recipe-sigma")).toEqual([ 
			{ title: 'Another Tiddler', tiddler_id: 1, bag_name: 'bag-alpha', is_deleted: 0 },
			{ title: 'Hello There', tiddler_id: 4, bag_name: 'bag-gamma', is_deleted: 0 }
		]);
		expect(await sqlTiddlerDatabase.getRecipeTiddler("Hello There","recipe-beta")).toEqual(null);
		await sqlTiddlerDatabase.deleteTiddler("Another Tiddler","bag-alpha");
		expect(await sqlTiddlerDatabase.getRecipeTiddlers("recipe-rho")).toEqual([ { title: "Hello There", tiddler_id: 2, bag_name: "bag-alpha", is_deleted: 0 } ]);
		expect(await sqlTiddlerDatabase.getRecipeTiddlers("recipe-sigma")).toEqual([ { title: "Hello There", tiddler_id: 4, bag_name: "bag-gamma", is_deleted: 0 } ]);
		// Save a recipe tiddler
		expect(await sqlTiddlerDatabase.saveRecipeTiddler({title: "More", text: "None"},"recipe-rho")).toEqual({tiddler_id: 7, bag_name: "bag-beta"});
		expect((await sqlTiddlerDatabase.getRecipeTiddler("More","recipe-rho"))?.tiddler).toEqual({title: "More", text: "None"});
	});

	it("should manage users correctly", async function() {
		console.log("should manage users correctly")
		// Create users
		const userId1 = await sqlTiddlerDatabase.createUser("john_doe", "john@example.com", "pass123");
		const userId2 = await sqlTiddlerDatabase.createUser("jane_doe", "jane@example.com", "pass123");

		// Retrieve users
		const user1 = await sqlTiddlerDatabase.getUser(userId1);
		expect(user1.user_id).toBe(userId1);
		expect(user1.username).toBe("john_doe");
		expect(user1.email).toBe("john@example.com");
		expect(user1.created_at).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/); // Match timestamp format
		expect(user1.last_login).toBeNull();

		// Update user
		await sqlTiddlerDatabase.updateUser(userId1, "john_updated", "john_updated@example.com");
		expect((await sqlTiddlerDatabase.getUser(userId1)).username).toBe("john_updated");
		expect((await sqlTiddlerDatabase.getUser(userId1)).email).toBe("john_updated@example.com");

		// List users
		const users = await sqlTiddlerDatabase.listUsers();
		expect(users.length).toBe(2);
		expect(users[0].username).toBe("jane_doe");
		expect(users[1].username).toBe("john_updated");

		// Delete user
		await sqlTiddlerDatabase.deleteUser(userId2);
		// expect(await sqlTiddlerDatabase.getUser(userId2)).toBe(null || undefined);
	});

	it("should manage groups correctly", async function() {
		console.log("should manage groups correctly")
		// Create groups
		const groupId1 = await sqlTiddlerDatabase.createGroup("Editors", "Can edit content");
		const groupId2 = await sqlTiddlerDatabase.createGroup("Viewers", "Can view content");

		// Retrieve groups
		expect(await sqlTiddlerDatabase.getGroup(groupId1)).toEqual({
			group_id: groupId1,
			group_name: "Editors",
			description: "Can edit content"
		});

		// Update group
		await sqlTiddlerDatabase.updateGroup(groupId1, "Super Editors", "Can edit all content");
		expect((await sqlTiddlerDatabase.getGroup(groupId1)).group_name).toBe("Super Editors");
		expect((await sqlTiddlerDatabase.getGroup(groupId1)).description).toBe("Can edit all content");

		// List groups
		const groups = await sqlTiddlerDatabase.listGroups();
		expect(groups.length).toBe(2);
		expect(groups[0].group_name).toBe("Super Editors");
		expect(groups[1].group_name).toBe("Viewers");

		// Delete group
		await sqlTiddlerDatabase.deleteGroup(groupId2);
		// expect(await sqlTiddlerDatabase.getGroup(groupId2)).toBe(null || undefined);
	});


	it("should manage roles correctly", async function() {
		console.log("should manage roles correctly")
		// Create roles
		const roleId1 = await sqlTiddlerDatabase.createRole("Admin" + Date.now(), "Full access");
		const roleId2 = await sqlTiddlerDatabase.createRole("Editor" + Date.now(), "Can edit content");

		// Retrieve roles
		expect(await sqlTiddlerDatabase.getRole(roleId1)).toEqual({
			role_id: roleId1,
			role_name: jasmine.stringMatching(/^Admin\d+$/),
			description: "Full access"
		});

		// Update role
		await sqlTiddlerDatabase.updateRole(roleId1, "Super Admin" + Date.now(), "God-like powers");
		expect((await sqlTiddlerDatabase.getRole(roleId1)).role_name).toMatch(/^Super Admin\d+$/);
		expect((await sqlTiddlerDatabase.getRole(roleId1)).description).toBe("God-like powers");

		// List roles
		const roles = await sqlTiddlerDatabase.listRoles();
		expect(roles.length).toBeGreaterThan(0);
		// expect(roles[0].role_name).toMatch(/^Editor\d+$/);
		// expect(roles[1].role_name).toMatch(/^Super Admin\d+$/);

		// Delete role
		await sqlTiddlerDatabase.deleteRole(roleId2);
		// expect(await sqlTiddlerDatabase.getRole(roleId2)).toBeUndefined();
	});

	it("should manage permissions correctly", async function() {
		console.log("should manage permissions correctly")
		// Create permissions
		const permissionId1 = await sqlTiddlerDatabase.createPermission("read_tiddlers" + Date.now(), "Can read tiddlers");
		const permissionId2 = await sqlTiddlerDatabase.createPermission("write_tiddlers" + Date.now(), "Can write tiddlers");

		// Retrieve permissions
		expect(await sqlTiddlerDatabase.getPermission(permissionId1)).toEqual({
			permission_id: permissionId1,
			permission_name: jasmine.stringMatching(/^read_tiddlers\d+$/),
			description: "Can read tiddlers"
		});

		// Update permission
		await sqlTiddlerDatabase.updatePermission(permissionId1, "read_all_tiddlers" + Date.now(), "Can read all tiddlers");
		expect((await sqlTiddlerDatabase.getPermission(permissionId1)).permission_name).toMatch(/^read_all_tiddlers\d+$/);
		expect((await sqlTiddlerDatabase.getPermission(permissionId1)).description).toBe("Can read all tiddlers");

		// List permissions
		const permissions = await sqlTiddlerDatabase.listPermissions();
		expect(permissions.length).toBeGreaterThan(0);
		expect(permissions[0].permission_name).toMatch(/^read_all_tiddlers\d+$/);
		expect(permissions[1].permission_name).toMatch(/^write_tiddlers\d+$/);

		// Delete permission
		await sqlTiddlerDatabase.deletePermission(permissionId2);
		// expect(await sqlTiddlerDatabase.getPermission(permissionId2)).toBeUndefined();
	});
}

})();

}
