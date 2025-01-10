/*\
title: $:/plugins/tiddlywiki/multiwikiserver/store/sql-engine-worker.js
type: application/javascript
module-type: library

Low level functions to work with the SQLite engine, either via better-sqlite3 or node-sqlite3-wasm.

This class is intended to encapsulate all engine-specific logic.

\*/

const {Worker, isMainThread, parentPort, workerData} = require('worker_threads');


function SqlEngineWorker(options) {
	options = options || {};
	// Initialise transaction mechanism
	this.transactionDepth = 0;
	// Initialise the statement cache
	this.statements = Object.create(null); // Hashmap by SQL text of statement objects
	// Choose engine
	this.engine = options.engine || "node"; // node | wasm | better
	// Create the database
	const databasePath = options.databasePath || ":memory:";
	let Database;
	switch(this.engine) {
		case "node":
			({DatabaseSync: Database} = require("node:sqlite"));
			break;
		case "wasm":
			({Database} = require("node-sqlite3-wasm"));
			break;
		case "better":
			Database = require("better-sqlite3");
			break;
		default:
			throw new Error("Unknown database engine " + this.engine);
	}
	this.db = new Database(databasePath, {});
	parentPort?.on('message', (message) => {
		if(!parentPort) return; //really?
		const {verb, sql, params, messageId} = message;
		switch(verb) {
			case "init": {
				parentPort.postMessage({messageId});
				return;
			}
			case "close": {
				this.db.close();
				parentPort.postMessage({messageId});
				parentPort.removeAllListeners();
				return;
			}
			case "pragma": {
				const result = this.engine === "node"
					? this.db.exec("PRAGMA " + sql)
					: this.db.pragma(sql);
				parentPort.postMessage({messageId, result});
				return;
			}
			case "finalize": {
				if(this.statements[sql].finalize)
					this.statements[sql].finalize();
				delete this.statements[sql];
				parentPort.postMessage({messageId});
				return;
			}
		}

		try {
			this.statements[sql] = this.statements[sql] || this.db.prepare(sql);
			switch(verb) {
				case "prepare": {
					parentPort.postMessage({messageId});
					break;
				}
				case "run": {
					const result = this.statements[sql].run(params);
					parentPort.postMessage({messageId, result});
					break;
				}
				case "get": {
					const result = this.statements[sql].get(params);
					parentPort.postMessage({messageId, result});
					break;
				}
				case "all": {
					const result = this.statements[sql].all(params);
					parentPort.postMessage({messageId, result});
					break;
				}
			}
		} catch(error) {
			parentPort.postMessage({messageId, error});
		}
	});

}
const worker = new SqlEngineWorker(workerData);