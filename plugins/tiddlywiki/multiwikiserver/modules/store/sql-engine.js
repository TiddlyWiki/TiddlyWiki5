/*\
title: $:/plugins/tiddlywiki/multiwikiserver/store/sql-engine.js
type: application/javascript
module-type: library

Low level functions to work with the SQLite engine, either via better-sqlite3 or node-sqlite3-wasm.

This class is intended to encapsulate all engine-specific logic.

\*/

(function() {

class SqlWorker {
	/**
	 * Create a database engine. 
	 * 
	 * @param {Object} options 
	 * @param {string} [options.databasePath] path to the database file (can be ":memory:" or missing to get a temporary database)
	 * @param {"node" | "wasm" | "better"} [options.engine] which engine to use, default is "node"
	 * @param {string[]} [options.pragmas] list of PRAGMA statements to run
	 */

	constructor(options) {
		options = options || {};
		const workerTitle = "$:/plugins/tiddlywiki/multiwikiserver/store/sql-engine-worker.js";
		const {Worker} = require('worker_threads');
		this.worker = new Worker($tw.modules.titles[workerTitle].definition, {
			eval: true,
			workerData: {
				databasePath: options.databasePath,
				engine: options.engine,
				pragmas: options.pragmas
			}
		});
		this.worker.on('message', (message) => {
			const {messageId, result, error} = message;
			const req = this.messageMap.get(messageId);
			if(!req) {
				return $tw.utils.warning(`No request found for message ${messageId}`);
			}
			const {resolve, reject} = req;
			this.messageMap.delete(messageId);
			if(error) {
				reject(error);
			} else {
				resolve(result);
			}
		});

	}

	messageId = 0;

	/** @type {Map<number, {resolve: (res) => void, reject: (err) => void}>} */
	messageMap = new Map();

	/**
	 * 
	 * @param {"run" | "get" | "all" | "prepare" | "pragma" | "init" | "close" | "finalize"} verb 
	 * @param {string} sql 
	 * @param {any} [params] 
	 * @returns 
	 */
	async sendMessage(verb, sql, params) {
		const messageId = this.messageId++;
		return await new Promise((resolve, reject) => {
			this.messageMap.set(messageId, {resolve, reject});
			this.worker.postMessage({sql, params, verb, messageId});
		});
	}

	async init() {
		return await this.sendMessage("init", "");
	}

	async close() {
		return await this.sendMessage("close", "");
	}

	async pragma(pragma) {
		return await this.sendMessage("pragma", pragma);
	}

	async prepare(sql) {
		await this.sendMessage("prepare", sql);
		return {
			run: async (params) => await this.sendMessage("run", sql, params),
			get: async (params) => await this.sendMessage("get", sql, params),
			all: async (params) => await this.sendMessage("all", sql, params),
			finalize: async () => await this.sendMessage("finalize", sql)
		};
	}

}

exports.SqlWorker = SqlWorker;

/**
 * Create a database engine. 
 * 
 * @param {Object} options 
 * @param {string} [options.databasePath] path to the database file (can be ":memory:" or missing to get a temporary database)
 * @param {"node" | "wasm" | "better"} [options.engine] which engine to use, default is "node"
 */
function SqlEngine(options) {
	options = options || {};
	// Initialise transaction mechanism
	this.transactionDepth = 0;
	// Initialise the statement cache
	this.statements = Object.create(null); // Hashmap by SQL text of statement objects
	/** @type {"node" | "wasm" | "better"} Choose engine */
	this.engine = options.engine || "node";
	const databasePath = options.databasePath || ":memory:";
	// Create the database file directories if needed
	if(databasePath !== ":memory:") {
		$tw.utils.createFileDirectories(databasePath);
	}
	this.db = new SqlWorker({
		databasePath,
		engine: this.engine,
		pragmas: this.engine === "better" ? [
			"journal_mode = WAL"
		] : []
	});

}


SqlEngine.prototype.close = async function() {
	for(const sql in this.statements) {
		if(this.statements[sql].finalize) {
			await this.statements[sql].finalize();
		}
	}
	this.statements = Object.create(null);
	await this.db.close();
	this.db = undefined;
};

// eslint-disable-next-line require-await -- we need to return a promise in case a replacement adapter needs it
SqlEngine.prototype.normaliseParams = async function(params) {
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

/**
 * 
 * @param {string} sql 
 */
SqlEngine.prototype.prepareStatement = async function(sql) {
	if(!(sql in this.statements)) {
		this.statements[sql] = await this.db.prepare(sql);
	}
	return /** @type {ReturnType<SqlEngine["db"]["prepare"]>} */(this.statements[sql]);
};

SqlEngine.prototype.runStatement = async function(sql,params) {
	params = await this.normaliseParams(params);
	const statement = await this.prepareStatement(sql);
	return await statement.run(params);
};

SqlEngine.prototype.runStatementGet = async function(sql,params) {
	params = await this.normaliseParams(params);
	const statement = await this.prepareStatement(sql);
	return /** @type {Record<string, any>} */(await statement.get(params));
};

SqlEngine.prototype.runStatementGetAll = async function(sql,params) {
	params = await this.normaliseParams(params);
	const statement = await this.prepareStatement(sql);
	return /** @type {Record<string, any>[]} */(await statement.all(params));
};

SqlEngine.prototype.runStatements = async function(sqlArray) {
	/** @type {Awaited<ReturnType<SqlEngine["runStatement"]>>[]} */
	const results = new Array(sqlArray.length);
	for(let t = 0; t < sqlArray.length; t++) {
		results[t] = await this.runStatement(sqlArray[t]);
	}
	return results;
};

/**
Execute the given function in a transaction, committing if successful but rolling back if an error occurs.  Returns whatever the given function returns.

Calls to this function can be safely nested, but only the topmost call will actually take place in a transaction.

TODO: better-sqlite3 provides its own transaction method which we should be using if available

@template T
@param {() => Promise<T>} fn - function to execute in the transaction
@returns {Promise<T>} - the result

*/
SqlEngine.prototype.transaction = async function(fn) {
	const alreadyInTransaction = this.transactionDepth > 0;
	this.transactionDepth++;
	try {
		if(alreadyInTransaction) {
			return await fn();
		} else {
			await this.runStatement(`BEGIN TRANSACTION`);
			try {
				var result = await fn();
				await this.runStatement(`COMMIT TRANSACTION`);
			} catch(e) {
				await this.runStatement(`ROLLBACK TRANSACTION`);
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