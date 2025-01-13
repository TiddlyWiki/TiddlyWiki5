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
	const {Router} = require("$:/plugins/tiddlywiki/multiwikiserver/router.js");
	const router = new Router({wiki: $tw.wiki, variables: self.params});


	// Set up server
	this.server = $tw.mws.serverManager.listenCommand(self.params);

	this.server.listen(null,null,null,{
		callback: function() {
			self.callback();
		}
	});

	return null;
};

exports.Command = Command;

})();
