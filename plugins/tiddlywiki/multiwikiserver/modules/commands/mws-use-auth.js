/*\
title: $:/plugins/tiddlywiki/multiwikiserver/commands/mws-use-auth.js
type: application/javascript
module-type: command

Enables authentication on the server

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "mws-use-auth",
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
	$tw.mws.serverManager.toggleServerAuth(true)
	console.log("Auth enabled on MWS Server")
	return null;
};

exports.Command = Command;

})();
