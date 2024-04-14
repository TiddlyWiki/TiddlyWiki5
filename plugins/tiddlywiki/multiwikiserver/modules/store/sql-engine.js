/*\
title: $:/plugins/tiddlywiki/multiwikiserver/store/sql-engine.js
type: application/javascript
module-type: library

Low level functions to work with the SQLite engine, either via better-sqlite3 or node-sqlite3-wasm.

This class is intended to encapsulate all engine-specific logic.

\*/

(function() {

/*
Create a database engine. Options include:

databasePath - path to the database file (can be ":memory:" or missing to get a temporary database)
engine - wasm | better
*/
function SqlEngine(options) {
	options = options || {};
	// Initialise transaction mechanism
	this.transactionDepth = 0;
	// Initialise the statement cache
	this.statements = Object.create(null); // Hashmap by SQL text of statement objects
	// Choose engine
	this.engine = options.engine || "better"; // wasm | better
	// Create the database file directories if needed
	if(options.databasePath) {
		$tw.utils.createFileDirectories(options.databasePath);
	}
	// Create the database
	const databasePath = options.databasePath || ":memory:";
	let Database;
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
	// Turn on WAL mode for better-sqlite3
	if(this.engine === "better") {
		// See https://github.com/WiseLibs/better-sqlite3/blob/master/docs/performance.md
		this.db.pragma("journal_mode = WAL");
	}
}

SqlEngine.prototype.close = function() {
	for(const sql in this.statements) {
		if(this.statements[sql].finalize) {
			this.statements[sql].finalize();
		}
	}
	this.statements = Object.create(null);
	this.db.close();
	this.db = undefined;
};

SqlEngine.prototype.normaliseParams = function(params) {
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

SqlEngine.prototype.prepareStatement = function(sql) {
	if(!(sql in this.statements)) {
		this.statements[sql] = this.db.prepare(sql);
	}
	return this.statements[sql];
};

SqlEngine.prototype.runStatement = function(sql,params) {
	params = this.normaliseParams(params);
	const statement = this.prepareStatement(sql);
	return statement.run(params);
};

SqlEngine.prototype.runStatementGet = function(sql,params) {
	params = this.normaliseParams(params);
	const statement = this.prepareStatement(sql);
	return statement.get(params);
};

SqlEngine.prototype.runStatementGetAll = function(sql,params) {
	params = this.normaliseParams(params);
	const statement = this.prepareStatement(sql);
	return statement.all(params);
};

SqlEngine.prototype.runStatements = function(sqlArray) {
	for(const sql of sqlArray) {
		this.runStatement(sql);
	}
};

/*
Execute the given function in a transaction, committing if successful but rolling back if an error occurs.  Returns whatever the given function returns.

Calls to this function can be safely nested, but only the topmost call will actually take place in a transaction.

TODO: better-sqlite3 provides its own transaction method which we should be using if available
*/
SqlEngine.prototype.transaction = function(fn) {
	const alreadyInTransaction = this.transactionDepth > 0;
	this.transactionDepth++;
        try {
		if(alreadyInTransaction) {
			return fn();
		} else {
			this.runStatement(`BEGIN TRANSACTION`);
			try {
				var result = fn();
				this.runStatement(`COMMIT TRANSACTION`);
			} catch(e) {
				this.runStatement(`ROLLBACK TRANSACTION`);
				throw(e);
			}
			return result;
		}
	} finally {
		this.transactionDepth--;
	}
};

exports.SqlEngine = SqlEngine;

})();