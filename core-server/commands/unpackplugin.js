/*\
title: $:/core/modules/commands/unpackplugin.js
type: application/javascript
module-type: command

Command to extract the shadow tiddlers from within a plugin

\*/

"use strict";

exports.info = {
	name: "unpackplugin",
	synchronous: true
};

var Command = function(params,commander,callback) {
	this.params = params;
	this.commander = commander;
	this.callback = callback;
};

Command.prototype.execute = function() {
	if(this.params.length < 1) {
		return "Missing plugin name";
	}
	var self = this,
		title = this.params[0],
		pluginData = this.commander.wiki.getTiddlerDataCached(title);
	if(!pluginData) {
		return "Plugin '" + title + "' not found";
	}
	$tw.utils.each(pluginData.tiddlers,function(tiddler) {
		self.commander.wiki.addTiddler(new $tw.Tiddler(tiddler));
	});
	return null;
};

exports.Command = Command;
