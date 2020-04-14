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
			var pluginFolders = fs.readdirSync(folder);
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
			var publisherFolders = fs.readdirSync(folder);
			for(var t=0; t<publisherFolders.length; t++) {
				if(!$tw.boot.excludeRegExp.test(publisherFolders[t])) {
					collectPlugins(path.resolve(folder,"./" + publisherFolders[t]));
				}
			}
		};
	var pluginsPaths = $tw.getLibraryItemSearchPaths($tw.config.pluginsPath,$tw.config.pluginsEnvVar);
	for(var u=0; u<pluginsPaths.length; u++) {
		collectPublisherPlugins(pluginsPaths[u]);
	}

	var themesPaths = $tw.getLibraryItemSearchPaths($tw.config.themesPath,$tw.config.themesEnvVar);
	for(var u=0; u<themesPaths.length; u++) {
		collectPublisherPlugins(themesPaths[u]);
	}

	var languagesPaths = $tw.getLibraryItemSearchPaths($tw.config.languagesPath,$tw.config.languagesEnvVar);
	for(var u=0; u<languagesPaths.length; u++) {
		collectPlugins(languagesPaths[u]);
	}
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
