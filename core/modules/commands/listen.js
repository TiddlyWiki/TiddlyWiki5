/*\
title: $:/core/modules/commands/listen.js
type: application/javascript
module-type: command

Listen for HTTP requests and serve tiddlers

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Server = require("$:/core/modules/server/server.js").Server;

exports.info = {
	name: "listen",
	synchronous: true,
	namedParameterMode: true,
	mandatoryParameters: [],
};

var Command = function(params,commander,callback) {
	var self = this;
	this.params = params;
	this.commander = commander;
	this.callback = callback;
};

Command.prototype.execute = function() {
	var self = this;
	if(!$tw.boot.wikiTiddlersPath) {
		$tw.utils.warning("Warning: Wiki folder '" + $tw.boot.wikiPath + "' does not exist or is missing a tiddlywiki.info file");
	}
	// Set up server
	this.server = new Server({
		wiki: this.commander.wiki,
		variables: self.params
	});
	var nodeServer = this.server.listen();
	$tw.hooks.invokeHook("th-server-command-post-start",this.server,nodeServer,"tiddlywiki");
	return null;
};

exports.Command = Command;

})();
