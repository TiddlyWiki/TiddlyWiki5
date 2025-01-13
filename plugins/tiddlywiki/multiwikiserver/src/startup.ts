/*\
title: $:/plugins/tiddlywiki/multiwikiserver/startup.js
type: application/javascript
module-type: startup

Multi wiki server initialisation

\*/

import { resolve } from "path";
import { ServerManager } from "./server";
import { SqlTiddlerStore } from "./store/sql-tiddler-store";

/*jslint node: true, browser: true */
/*global $tw: false */


declare global {
	interface $TW {
		mws: {
			store: SqlTiddlerStore;
			serverManager: ServerManager;
		}
	}
}

// Export name and synchronous status
export const name = "multiwikiserver";
export const platforms = ["node"];
export const before = ["story"];
export const synchronous = false;
export async function startup() {

	// Create and initialise the attachment store and the tiddler store
	const { AttachmentStore } = require("$:/plugins/tiddlywiki/multiwikiserver/store/attachments.js")
	const attachmentStore = new AttachmentStore({
		storePath: resolve($tw.boot.wikiPath, "store/")
	});

	const { SqlTiddlerStore } = require("$:/plugins/tiddlywiki/multiwikiserver/store/sql-tiddler-store.js");
	const store = new SqlTiddlerStore({
		databasePath: resolve($tw.boot.wikiPath, "store/database.sqlite"),
		engine: $tw.wiki.getTiddlerText("$:/config/MultiWikiServer/Engine", "better"), // better || wasm
		attachmentStore: attachmentStore
	});
	await store.init();

	const serverManager = new ServerManager();
	$tw.mws = { store, serverManager };

}


