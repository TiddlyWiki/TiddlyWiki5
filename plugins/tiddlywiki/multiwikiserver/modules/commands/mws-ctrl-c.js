/*\
title: $:/plugins/tiddlywiki/multiwikiserver/commands/mws-ctrl-c.js
type: application/javascript
module-type: command

Listen for HTTP requests and serve tiddlers

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "mws-ctrl-c",
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

Command.prototype.execute = function() {
	var self = this;
	$tw.utils.log("(press ctrl-C to exit)","red");
	return null;
};

exports.Command = Command;

})();
