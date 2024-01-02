/*\
title: $:/plugins/tiddlywiki/sqlite3store/test-sql-functions.js
type: application/javascript

Test harness for the functions in sql-functions.js

\*/

$tw.testSqlFunctions = function() {

// Deep equal

function deepEqual(obj1, obj2) {
	if (obj1 === undefined && obj2 === undefined) {
		return true;
	}
	if (obj1 === undefined || obj2 === undefined) {
		return false;
	}
	if (obj1 === obj2) {
		return true;
	}
	if (isPrimitive(obj1) && isPrimitive(obj2)) {
		return obj1 === obj2;
	}
	if (Object.keys(obj1).length !== Object.keys(obj2).length) {
		return false;
	}
	for (let key in obj1) {
		if (!(key in obj2)) {
			return false;
		}
		if (!deepEqual(obj1[key], obj2[key])) {
			return false;
		}
	}
	return true;
}

function isPrimitive(obj) {
	return (obj !== Object(obj));
}

let tests = [];

// Define a test
function test(name, fn) {
	tests.push({
		name: name,
		fn: fn
	});
}

// Run all the tests
function run() {
	while(tests.length > 0) {
		const test = tests.shift();
		try {
			test.fn();
			console.log("✅", test.name);
		} catch (e) {
			console.log("❌", test.name);
			console.log(e.stack);
		}
	}
}

let assert = {
	equal: function(obj1,obj2,message) {
		if(!deepEqual(obj1,obj2)) {
			throw new Error("" + (message || "assert.equal failed"));
		}
	}
}

// Define the tests

test("Instantiate the database", function () {
	const sqlFunctions = new $tw.SqlFunctions();
	test("Write a tiddler and retrieve it", function() {
		// Utilities
		function checkExists(title,result,message) {
			const exists = sqlFunctions.sqlTiddlerExists(title);
			assert.equal(exists,result,message);
		}
		function checkTiddler(title,result,message) {
			const tiddler = sqlFunctions.sqlGetTiddler(title);
			assert.equal(tiddler,result,message);
		}
		function checkShadowSource(title,result,message) {
			const tiddler = sqlFunctions.sqlGetShadowSource(title);
			assert.equal(tiddler,result,message);
		}
		function checkAllTitles(result,message) {
			const titles = sqlFunctions.sqlAllTitles();
			assert.equal(titles,result,message + " (sqlAllTitles)");
			const accumulator = [];
			sqlFunctions.sqlEachTiddler(function(tiddlerFields,title) {
				accumulator.push(title);
			});
			assert.equal(accumulator,result,message + " (sqlEachTiddler)");
		}
		function checkAllShadowTitles(result,message) {
			const titles = sqlFunctions.sqlAllShadowTitles();
			assert.equal(titles,result,message);
		}
		// Set priorities for the plugins we'll use
		sqlFunctions.sqlSetPluginPriorities([]);
		// Save and verify an ordinary tiddler
		sqlFunctions.sqlSaveTiddler({
			title: "HelloThere",
			text: "This is a tiddler"
		});
		checkExists("HelloThere",true,"Check the tiddler exists");
		checkTiddler("HelloThere",{
			title: "HelloThere",
			text: "This is a tiddler"
		},"Retrieve the tiddler");
		checkShadowSource("HelloThere",null,"Check that the shadow source is correct");
		// Delete the tiddler and check it no longer exists
		sqlFunctions.sqlDeleteTiddler("HelloThere");
		checkTiddler("HelloThere",undefined,"Try to retrieve the deleted tiddler");
		checkExists("HelloThere",false,"Check the tiddler doesn't exist");
		checkAllTitles([],"Check that the title list is correct");
		checkAllShadowTitles([],"Check that the shadow title list is correct");
		// Save and verify a shadow tiddler
		sqlFunctions.sqlSetPluginPriorities(["myplugin"]);
		sqlFunctions.sqlSaveTiddler({
			title: "HelloThere",
			text: "This is a shadow tiddler"
		},"myplugin");
		// Check that the shadow tiddler exists and has the expected value
		checkExists("HelloThere",false,"Check the shadow tiddler does not exist");
		checkTiddler("HelloThere",{
			title: "HelloThere",
			text: "This is a shadow tiddler"
		},"Retrieve the tiddler");
		checkShadowSource("HelloThere","myplugin","Check that the shadow source is correct");
		sqlFunctions.sqlLogTables();
		checkAllShadowTitles(["HelloThere"],"Check that the shadow title list is correct");
		// Save an ordinary tiddler over the top and check it can be retrieved
		sqlFunctions.sqlSaveTiddler({
			title: "HelloThere",
			text: "This is a tiddler"
		});
		checkExists("HelloThere",true,"Check the tiddler exists");
		checkTiddler("HelloThere",{
			title: "HelloThere",
			text: "This is a tiddler"
		},"Retrieve the tiddler");
		checkAllTitles(["HelloThere"],"Check that the title list is correct");
		checkShadowSource("HelloThere","myplugin","Check that the shadow source is correct");
		checkAllShadowTitles(["HelloThere"],"Check that the shadow title list is correct");
		// Delete the ordinary tiddler and check that the shadow tiddler is still available
		sqlFunctions.sqlDeleteTiddler("HelloThere");
		checkTiddler("HelloThere",{
			title: "HelloThere",
			text: "This is a shadow tiddler"
		},"Try to retrieve the shadow tiddler exposed by the deleted tiddler");
		checkShadowSource("HelloThere","myplugin","Check that the shadow source is correct");
		checkAllShadowTitles(["HelloThere"],"Check that the shadow title list is correct");
	});
});

// Run the tests
run();

};
//# sourceURL=$:/plugins/tiddlywiki/sqlite3store/test-sql-functions.js
