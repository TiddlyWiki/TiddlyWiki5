/*\
title: $:/plugins/tiddlywiki/multiwikiserver/commands/mws-create-db.js
type: application/javascript
module-type: command

Listen for HTTP requests and serve tiddlers

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "mws-create-db",
	synchronous: true,
	namedParameterMode: true,
	mandatoryParameters: []
};

var Command = function(params,commander,callback) {
	var self = this;
	this.params = params;
	this.commander = commander;
	// this.callback = callback;
};

Command.prototype.execute = async function() {
	var self = this;

	// irony of all ironies, we still have to use the sqlite3 package to create the database
	const sqlite = require("node-sqlite3-wasm");
	const db = new sqlite.Database($tw.mws.store.databasePath);
	db.exec($tw.wiki.getTiddlerText("$:/plugins/tiddlywiki/multiwikiserver/prisma/schema.prisma.sql"));
	db.close();
	console.log("db created");
	return null;
};

exports.Command = Command;

})();
