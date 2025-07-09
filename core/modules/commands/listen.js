/*\
title: $:/core/modules/commands/listen.js
type: application/javascript
module-type: command

Listen for HTTP requests and serve tiddlers

\*/

"use strict";

const {Server} = require("$:/core/modules/server/server.js");

exports.info = {
	name: "listen",
	synchronous: true,
	namedParameterMode: true,
	mandatoryParameters: []
};

const Command = function(params,commander,callback) {
	const self = this;
	this.params = params;
	this.commander = commander;
	this.callback = callback;
};

Command.prototype.execute = function() {
	const self = this;
	if(!$tw.boot.wikiTiddlersPath) {
		$tw.utils.warning(`Warning: Wiki folder '${$tw.boot.wikiPath}' does not exist or is missing a tiddlywiki.info file`);
	}
	// Set up server
	this.server = new Server({
		wiki: this.commander.wiki,
		variables: self.params
	});
	const nodeServer = this.server.listen();
	$tw.hooks.invokeHook("th-server-command-post-start",this.server,nodeServer,"tiddlywiki");
	return null;
};

exports.Command = Command;
