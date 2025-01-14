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

Command.prototype.execute = async function() {
	await loadPluginBags();
	return null;
};

async function loadPluginBags() {
	const path = require("path"),
		fs = require("fs");
	// Copy plugins
	function makePluginBagName(type,publisher,name) {
		return "$:/" + type + "/" + (publisher ? publisher + "/" : "") + name;
	}
	async function savePlugin(pluginFields,type,publisher,name) {
		const bagName = makePluginBagName(type,publisher,name);
		const result = await $tw.mws.store.createBag(bagName,pluginFields.description || "(no description)",{allowPrivilegedCharacters: true});
		if(result) {
			console.log(`Error creating plugin bag ${bagName}: ${JSON.stringify(result)}`);
		}
		await $tw.mws.store.saveBagTiddler(pluginFields, bagName);
	}
	async function collectPlugins(folder,type,publisher) {
		var pluginFolders = $tw.utils.getSubdirectories(folder) || [];
		for(var p=0; p<pluginFolders.length; p++) {
			const pluginFolderName = pluginFolders[p];
			if(!$tw.boot.excludeRegExp.test(pluginFolderName)) {
				var pluginFields = $tw.loadPluginFolder(path.resolve(folder,pluginFolderName));
				if(pluginFields && pluginFields.title) {
					await savePlugin(pluginFields,type,publisher,pluginFolderName);
				}
			}
		}
	}
	async function collectPublisherPlugins(folder,type) {
		var publisherFolders = $tw.utils.getSubdirectories(folder) || [];
		for(var t=0; t<publisherFolders.length; t++) {
			const publisherFolderName = publisherFolders[t];
			if(!$tw.boot.excludeRegExp.test(publisherFolderName)) {
				await collectPlugins(path.resolve(folder,publisherFolderName),type,publisherFolderName);
			}
		}
	}

	const publisherPlugins = [];
	const languagePlugins = [];

	$tw.utils.each($tw.getLibraryItemSearchPaths($tw.config.pluginsPath,$tw.config.pluginsEnvVar),function(folder) {
		publisherPlugins.push([folder,"plugins"]);
	});
	$tw.utils.each($tw.getLibraryItemSearchPaths($tw.config.themesPath,$tw.config.themesEnvVar),function(folder) {
		publisherPlugins.push([folder,"themes"]);
	});
	$tw.utils.each($tw.getLibraryItemSearchPaths($tw.config.languagesPath,$tw.config.languagesEnvVar),function(folder) {
		languagePlugins.push([folder,"languages"]);
	});

	for(const[folder,type] of publisherPlugins) {
		await collectPublisherPlugins(folder,type);
	}

	for(const[folder,type] of languagePlugins) {
		await collectPlugins(folder,type);
	}
}

exports.Command = Command;

})();
