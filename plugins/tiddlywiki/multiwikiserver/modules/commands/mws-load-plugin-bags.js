/*\
title: $:/plugins/tiddlywiki/multiwikiserver/commands/mws-load-plugin-bags.js
type: application/javascript
module-type: command

Command to create and load a bag for each plugin in the repo

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "mws-load-plugin-bags",
	synchronous: true
};

var Command = function(params,commander,callback) {
	this.params = params;
	this.commander = commander;
	this.callback = callback;
};

Command.prototype.execute = function() {
	var self = this;
	loadPluginBags();
	return null;
};

function loadPluginBags() {
	const path = require("path"),
		fs = require("fs");
	// Copy plugins
	var makePluginBagName = function(type,publisher,name) {
			return "$:/" + type + "/" + (publisher ? publisher + "/" : "") + name;
		},
		savePlugin = function(pluginFields,type,publisher,name) {
			const bagName = makePluginBagName(type,publisher,name);
			const result = $tw.mws.store.createBag(bagName,pluginFields.description || "(no description)",{allowPrivilegedCharacters: true});
			if(result) {
				console.log(`Error creating plugin bag ${bagname}: ${JSON.stringify(result)}`);
			}
			$tw.mws.store.saveBagTiddler(pluginFields,bagName);
		},
		collectPlugins = function(folder,type,publisher) {
			var pluginFolders = $tw.utils.getSubdirectories(folder) || [];
			for(var p=0; p<pluginFolders.length; p++) {
				const pluginFolderName = pluginFolders[p];
				if(!$tw.boot.excludeRegExp.test(pluginFolderName)) {
					var pluginFields = $tw.loadPluginFolder(path.resolve(folder,pluginFolderName));
					if(pluginFields && pluginFields.title) {
						savePlugin(pluginFields,type,publisher,pluginFolderName);
					}
				}
			}
		},
		collectPublisherPlugins = function(folder,type) {
			var publisherFolders = $tw.utils.getSubdirectories(folder) || [];
			for(var t=0; t<publisherFolders.length; t++) {
				const publisherFolderName = publisherFolders[t];
				if(!$tw.boot.excludeRegExp.test(publisherFolderName)) {
					collectPlugins(path.resolve(folder,publisherFolderName),type,publisherFolderName);
				}
			}
		};
	$tw.utils.each($tw.getLibraryItemSearchPaths($tw.config.pluginsPath,$tw.config.pluginsEnvVar),function(folder) {
		collectPublisherPlugins(folder,"plugin");
	});
	$tw.utils.each($tw.getLibraryItemSearchPaths($tw.config.themesPath,$tw.config.themesEnvVar),function(folder) {
		collectPublisherPlugins(folder,"theme");
	});
	$tw.utils.each($tw.getLibraryItemSearchPaths($tw.config.languagesPath,$tw.config.languagesEnvVar),function(folder) {
		collectPlugins(folder,"language");
	});
}

exports.Command = Command;

})();
