/*\
title: $:/plugins/tiddlywiki/multiwikiserver/startup.js
type: application/javascript
module-type: startup

Multi wiki server initialisation

\*/
//@ts-check
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Export name and synchronous status
exports.name = "multiwikiserver";
exports.platforms = ["node"];
exports.before = ["story"];
exports.synchronous = false;

exports.startup = async function() {
	const path = require("path");

	// Create and initialise the attachment store and the tiddler store
	/** @type {typeof import("../src/store/attachments")} */
	const { AttachmentStore } = require("./store/attachments.js")
	const attachmentStore = new AttachmentStore({
		storePath: path.resolve($tw.boot.wikiPath, "store/")
	});

	const databasePath = path.resolve($tw.boot.wikiPath, "store/database.sqlite");

	$tw.utils.createFileDirectories(databasePath);

	const {PrismaClient} = require("@prisma/client");
	const connection = new PrismaClient({
		datasourceUrl: `file:${databasePath}?connection_limit=5`,
		log: [ "info", "warn", "error"]
	});

	const {SqlTiddlerStore} = require("./store/sql-tiddler-store.js");
	const store = new SqlTiddlerStore({adminWiki: $tw.wiki, attachmentStore, prisma: connection});

	const { ServerManager } = require("./server.js");
	const serverManager = new ServerManager();
    
	// router will be set by the first mws-listen command
	$tw.mws = {
		store, serverManager, connection, databasePath,
		transaction: async (type, fn) => {
			return await connection.$transaction(async prisma => {
				const store = new SqlTiddlerStore({adminWiki: $tw.wiki, attachmentStore, prisma, transactionType: type});
				return await fn(store);
			});
		}
	};
}

})();
