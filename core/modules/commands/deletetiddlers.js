/*\
title: $:/core/modules/commands/deletetiddlers.js
type: application/javascript
module-type: command

Command to delete tiddlers

\*/

"use strict";

exports.info = {
	name: "deletetiddlers",
	synchronous: true
};

const Command = function(params,commander,callback) {
	this.params = params;
	this.commander = commander;
	this.callback = callback;
};

Command.prototype.execute = function() {
	if(this.params.length < 1) {
		return "Missing filter";
	}
	const self = this;
	const {wiki} = this.commander;
	const filter = this.params[0];
	const tiddlers = wiki.filterTiddlers(filter);
	$tw.utils.each(tiddlers,(title) => {
		wiki.deleteTiddler(title);
	});
	return null;
};

exports.Command = Command;
