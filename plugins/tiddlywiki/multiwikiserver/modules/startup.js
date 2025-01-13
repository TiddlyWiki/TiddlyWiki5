/*\
title: $:/plugins/tiddlywiki/multiwikiserver/startup.js
type: application/javascript
module-type: startup

Multi wiki server initialisation

\*/
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
	const { AttachmentStore } = require("$:/plugins/tiddlywiki/multiwikiserver/store/attachments.js")
	const attachmentStore = new AttachmentStore({
		storePath: path.resolve($tw.boot.wikiPath, "store/")
	});
	
	const { SqlTiddlerStore } = require("$:/plugins/tiddlywiki/multiwikiserver/store/sql-tiddler-store.js");
	const store = new SqlTiddlerStore({
		databasePath: path.resolve($tw.boot.wikiPath, "store/database.sqlite"),
		engine: $tw.wiki.getTiddlerText("$:/config/MultiWikiServer/Engine", "better"), // better || wasm
		attachmentStore: attachmentStore
	});
	await store.init();

	const { ServerManager } = require("$:/plugins/tiddlywiki/multiwikiserver/mws-server.js");
	const serverManager = new ServerManager();

	const prisma = require("@prisma/client");

	// Create a new Prisma client
	const db = new prisma.PrismaClient();
	
	$tw.mws = { store, serverManager };
	
}

})();
