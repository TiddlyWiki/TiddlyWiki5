/*\
title: $:/core/modules/library.js
type: application/javascript
module-type: global

Library handling utilities

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

function Library(options) {
}

/*
*/
Library.prototype.getLibraryItems = function() {
	if(!this.items) {
		this.loadLibraryItems();
	}
};

/*
*/
Library.prototype.loadLibraryItems = function() {
	var self = this,
		fs = require("fs"),
		path = require("path");
	// Collect the library items from disk
	this.items = {};
	var collectPlugins = function(folder) {
			var pluginFolders = $tw.utils.getSubdirectories(folder) || [];
			for(var p=0; p<pluginFolders.length; p++) {
				if(!$tw.boot.excludeRegExp.test(pluginFolders[p])) {
					var pluginFields = $tw.loadPluginFolder(path.resolve(folder,"./" + pluginFolders[p]));
					if(pluginFields && pluginFields.title) {
						self.items[pluginFields.title] = pluginFields;
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
	// Compile the metadata
	this.itemMetadata = [];
	$tw.utils.each(Object.keys(self.items),function(title) {
		var tiddler = self.items[title];
		// Collect the skinny list data
		var pluginTiddlers = $tw.utils.parseJSONSafe(tiddler.text),
			readmeContent = (pluginTiddlers.tiddlers[title + "/readme"] || {}).text,
			doesRequireReload = !!$tw.wiki.doesPluginInfoRequireReload(pluginTiddlers),
			iconTiddler = pluginTiddlers.tiddlers[title + "/icon"] || {},
			iconType = iconTiddler.type,
			iconText = iconTiddler.text,
			iconContent;
		if(iconType && iconText) {
			iconContent = $tw.utils.makeDataUri(iconText,iconType);
		}
		self.itemMetadata.push($tw.utils.extend({},tiddler,{
			text: undefined,
			readme: readmeContent,
			"requires-reload": doesRequireReload ? "yes" : "no",
			icon: iconContent
		}));
	});
};

/*
*/
Library.prototype.getMetadata = function() {
	this.loadLibraryItems();
	return this.itemMetadata;
};

/*
*/
Library.prototype.getItem = function(title) {
	this.loadLibraryItems();
	if($tw.utils.hop(this.items,title)) {
		return this.items[title];
	} else {
		return null;
	}
};

exports.Library = Library;

})();
