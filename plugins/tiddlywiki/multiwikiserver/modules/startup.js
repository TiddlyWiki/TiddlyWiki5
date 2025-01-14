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
    /** @type {typeof import("../src/store/attachments")} */
	const { AttachmentStore } = require("./store/attachments.js")
	const attachmentStore = new AttachmentStore({
		storePath: path.resolve($tw.boot.wikiPath, "store/")
	});
    
    /** @type {typeof import("../src/store/sql-tiddler-store")} */
	const { SqlTiddlerStore } = require("./store/sql-tiddler-store.js");
	const store = new SqlTiddlerStore({
		databasePath: path.resolve($tw.boot.wikiPath, "store/database.sqlite"),
		engine: $tw.wiki.getTiddlerText("$:/config/MultiWikiServer/Engine", "better"), // better || wasm
		attachmentStore: attachmentStore
	});

    /** @type {typeof import("../src/server")} */
    const { ServerManager } = require("./server.js");
	const serverManager = new ServerManager();
    
    // router will be set by the first mws-listen command
	$tw.mws = { store, serverManager };
}

})();
