/*\
title: $:/core/modules/utils/repository.js
type: application/javascript
module-type: utils

Utilities for working with the TiddlyWiki repository file structure

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Get an object containing all the plugins as a hashmap by title of the JSON representation of the plugin
Options:

ignoreEnvironmentVariables: defaults to false
*/
exports.getAllPlugins = function(options) {
	options = options || {};
	var fs = require("fs"),
		path = require("path"),
		tiddlers = {};
	// Collect up the library plugins
	var collectPlugins = function(folder) {
			var pluginFolders = $tw.utils.getSubdirectories(folder) || [];
			for(var p=0; p<pluginFolders.length; p++) {
				if(!$tw.boot.excludeRegExp.test(pluginFolders[p])) {
					var pluginFields = $tw.loadPluginFolder(path.resolve(folder,"./" + pluginFolders[p]));
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
	$tw.utils.each($tw.getLibraryItemSearchPaths($tw.config.pluginsPath,options.ignoreEnvironmentVariables ? undefined : $tw.config.pluginsEnvVar),collectPublisherPlugins);
	$tw.utils.each($tw.getLibraryItemSearchPaths($tw.config.themesPath,options.ignoreEnvironmentVariables ? undefined : $tw.config.themesEnvVar),collectPublisherPlugins);
	$tw.utils.each($tw.getLibraryItemSearchPaths($tw.config.languagesPath,options.ignoreEnvironmentVariables ? undefined : $tw.config.languagesEnvVar),collectPlugins);
	return tiddlers;
};

})();
