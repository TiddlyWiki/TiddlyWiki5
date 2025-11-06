/*\
title: $:/core/modules/commands/makelibrary.js
type: application/javascript
module-type: command

Command to pack all of the plugins in the library into a plugin tiddler of type "library"

\*/

"use strict";

exports.info = {
	name: "makelibrary",
	synchronous: true
};

var UPGRADE_LIBRARY_TITLE = "$:/UpgradeLibrary";

var Command = function(params,commander,callback) {
	this.params = params;
	this.commander = commander;
	this.callback = callback;
};

Command.prototype.execute = function() {
	var wiki = this.commander.wiki,
		upgradeLibraryTitle = this.params[0] || UPGRADE_LIBRARY_TITLE,
		tiddlers = $tw.utils.getAllPlugins();
	// Save the upgrade library tiddler
	var pluginFields = {
		title: upgradeLibraryTitle,
		type: "application/json",
		"plugin-type": "library",
		"text": JSON.stringify({tiddlers: tiddlers})
	};
	wiki.addTiddler(new $tw.Tiddler(pluginFields));
	return null;
};

exports.Command = Command;
