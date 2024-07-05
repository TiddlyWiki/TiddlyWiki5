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
exports.synchronous = true;

exports.startup = function() {
	const store = setupStore();
	$tw.mws = {
		store: store,
		serverManager: new ServerManager({
			store: store
		})
	};
}

function setupStore() {
	const path = require("path");
	// Create and initialise the attachment store and the tiddler store
	const AttachmentStore = require("$:/plugins/tiddlywiki/multiwikiserver/store/attachments.js").AttachmentStore,
		attachmentStore = new AttachmentStore({
			storePath: path.resolve($tw.boot.wikiPath,"store/")
		}),
		SqlTiddlerStore = require("$:/plugins/tiddlywiki/multiwikiserver/store/sql-tiddler-store.js").SqlTiddlerStore,
		store = new SqlTiddlerStore({
			databasePath: path.resolve($tw.boot.wikiPath,"store/database.sqlite"),
			engine: $tw.wiki.getTiddlerText("$:/config/MultiWikiServer/Engine","better"), // better || wasm
			attachmentStore: attachmentStore
		});
	return store;
}

function ServerManager(store) {
	this.servers = [];
}

ServerManager.prototype.createServer = function(options) {
	const MWSServer = require("$:/plugins/tiddlywiki/multiwikiserver/mws-server.js").Server,
		server = new MWSServer(options);
	this.servers.push(server);
	return server;
}

})();
