/*\
title: $:/core/modules/commands/deletetiddlers.js
type: application/javascript
module-type: command

Command to delete tiddlers

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "deletetiddlers",
	synchronous: true
};

var Command = function(params,commander,callback) {
	this.params = params;
	this.commander = commander;
	this.callback = callback;
};

Command.prototype.execute = function() {
	if(this.params.length < 1) {
		return "Missing filter";
	}
	var self = this,
		wiki = this.commander.wiki,
		filter = this.params[0],
		tiddlers = wiki.filterTiddlers(filter);
	$tw.utils.each(tiddlers,function(title) {
		wiki.deleteTiddler(title);
	});
	return null;
};

exports.Command = Command;

})();
