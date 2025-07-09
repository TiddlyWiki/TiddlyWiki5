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

const UPGRADE_LIBRARY_TITLE = "$:/UpgradeLibrary";

const Command = function(params,commander,callback) {
	this.params = params;
	this.commander = commander;
	this.callback = callback;
};

Command.prototype.execute = function() {
	const {wiki} = this.commander;
	const upgradeLibraryTitle = this.params[0] || UPGRADE_LIBRARY_TITLE;
	const tiddlers = $tw.utils.getAllPlugins();
	// Save the upgrade library tiddler
	const pluginFields = {
		title: upgradeLibraryTitle,
		type: "application/json",
		"plugin-type": "library",
		"text": JSON.stringify({tiddlers})
	};
	wiki.addTiddler(new $tw.Tiddler(pluginFields));
	return null;
};

exports.Command = Command;
