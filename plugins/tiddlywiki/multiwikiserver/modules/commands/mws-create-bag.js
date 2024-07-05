/*\
title: $:/plugins/tiddlywiki/multiwikiserver/commands/mws-create-bag.js
type: application/javascript
module-type: command

Command to load archive of recipes, bags and tiddlers from a directory

--mws-create-bag <name> <description>

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "mws-create-bag",
	synchronous: true
};

var Command = function(params,commander,callback) {
	this.params = params;
	this.commander = commander;
	this.callback = callback;
};

Command.prototype.execute = function() {
	var self = this;
	// Check parameters
	if(this.params.length < 1) {
		return "Missing bag name";
	}
	var bagName = this.params[0],
		bagDescription = this.params[1] || bagName;
	// Create bag
	var result = $tw.mws.store.createBag(bagName,bagDescription);
	if(result) {
		return result.message;
	} else {
		return null;
	}
};

exports.Command = Command;

})();
