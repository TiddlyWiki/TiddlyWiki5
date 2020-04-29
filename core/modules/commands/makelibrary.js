/*\
title: $:/core/modules/commands/makelibrary.js
type: application/javascript
module-type: command

Command to pack all of the plugins in the library into a plugin tiddler of type "library"

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
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
		fs = require("fs"),
		path = require("path"),
		upgradeLibraryTitle = this.params[0] || UPGRADE_LIBRARY_TITLE,
		tiddlers = {};
	// Collect up the library plugins
	var collectPlugins = function(folder) {
			var pluginFolders = $tw.utils.getSubdirectories(folder) || [];
			for(var p=0; p<pluginFolders.length; p++) {
				if(!$tw.boot.excludeRegExp.test(pluginFolders[p])) {
					pluginFields = $tw.loadPluginFolder(path.resolve(folder,"./" + pluginFolders[p]));
					if(pluginFields && pluginFields.title) {
						tiddlers[pluginFields.title] = pluginFields;
					}
				}
			}
		},
		collectPublisherPlugins = function(folder) {
			var publisherFolders = $tw.utils.getSubdirectories(folder) || [];
			for(var t=0; t<publisherFolders.length; t++) {
				if(!$tw.boot.excludeRegExp.test(publisherFolders[t])) {
					collectPlugins(path.resolve(folder,"./" + publisherFolders[t]));
				}
			}
		};
	$tw.utils.each($tw.getLibraryItemSearchPaths($tw.config.pluginsPath,$tw.config.pluginsEnvVar),collectPublisherPlugins);
	$tw.utils.each($tw.getLibraryItemSearchPaths($tw.config.themesPath,$tw.config.themesEnvVar),collectPublisherPlugins);
	$tw.utils.each($tw.getLibraryItemSearchPaths($tw.config.languagesPath,$tw.config.languagesEnvVar),collectPlugins);
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

})();
