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

var Server = require("$:/core/modules/server.js").Server;

exports.info = {
	name: "listen",
	synchronous: true,
	namedParameters: [] // Use named parameters, but none of them are mandatory
};

var Command = function(params,commander,callback) {
	var self = this;
	this.params = params;
	this.commander = commander;
	this.callback = callback;
	this.knownParameters = ["port","host","rootTiddler","renderType","serveType","username","password","pathprefix","debugLevel"];
};

Command.prototype.execute = function() {
	var self = this;
	if(!$tw.boot.wikiTiddlersPath) {
		$tw.utils.warning("Warning: Wiki folder '" + $tw.boot.wikiPath + "' does not exist or is missing a tiddlywiki.info file");
	}
	// Set up server
	var variables = Object.create(null);
	$tw.utils.each(this.knownParameters,function(name) {
		if($tw.utils.hop(self.params,name)) {
			variables[name] = self.params[name];
		}
	});
	this.server = new Server({
		wiki: this.commander.wiki,
		variables: variables
	});
	var nodeServer = this.server.listen();
	$tw.hooks.invokeHook("th-server-command-post-start",this.server,nodeServer);
	return null;
};

exports.Command = Command;

})();
