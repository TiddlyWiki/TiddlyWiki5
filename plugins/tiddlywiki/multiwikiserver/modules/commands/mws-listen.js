/*\
title: $:/plugins/tiddlywiki/multiwikiserver/commands/mws-listen.js
type: application/javascript
module-type: command

Listen for HTTP requests and serve tiddlers

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "mws-listen",
	synchronous: false,
	namedParameterMode: true,
	mandatoryParameters: []
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
	
	// the command can be called multiple times to setup multiple servers.
	// the first call will create the router and add it to the serverManager
	// all router params must be sent to the first call, subsequent calls will only use the server params
	if(!$tw.mws.router){
		$tw.mws.serverManager.createRouter(self.params);
	}

	// Set up server
	$tw.mws.serverManager.listenCommand(self.params, () => {
		this.callback();
	});

	return null;
};

exports.Command = Command;

})();
