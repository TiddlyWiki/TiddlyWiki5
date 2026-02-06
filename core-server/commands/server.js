/*\
title: $:/core/modules/commands/server.js
type: application/javascript
module-type: command

Deprecated legacy command for serving tiddlers

\*/

"use strict";

var Server = require("$:/core/modules/server/server.js").Server;

exports.info = {
	name: "server",
	synchronous: true
};

var Command = function(params,commander,callback) {
	var self = this;
	this.params = params;
	this.commander = commander;
	this.callback = callback;
};

Command.prototype.execute = function() {
	if(!$tw.boot.wikiTiddlersPath) {
		$tw.utils.warning("Warning: Wiki folder '" + $tw.boot.wikiPath + "' does not exist or is missing a tiddlywiki.info file");
	}
	// Set up server
	this.server = new Server({
		wiki: this.commander.wiki,
		variables: {
			port: this.params[0],
			host: this.params[6],
			"root-tiddler": this.params[1],
			"root-render-type": this.params[2],
			"root-serve-type": this.params[3],
			username: this.params[4],
			password: this.params[5],
			"path-prefix": this.params[7],
			"debug-level": this.params[8]
		}
	});
	var nodeServer = this.server.listen();
	$tw.hooks.invokeHook("th-server-command-post-start",this.server,nodeServer,"tiddlywiki");
	return null;
};

exports.Command = Command;
