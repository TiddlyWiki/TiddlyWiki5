/*\
title: $:/plugins/OokTech/Bob/plugin-info.js
type: application/javascript
module-type: utils-node

Information about the available plugins

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var fs = require("fs"),
	path = require("path");

var pluginInfo;

exports.getPluginInfo = function() {
	if(!pluginInfo) {
		// Enumerate the plugin paths
		var pluginPaths = $tw.getLibraryItemSearchPaths($tw.config.pluginsPath,$tw.config.pluginsEnvVar);
		pluginInfo = {};
		for(var pluginIndex=0; pluginIndex<pluginPaths.length; pluginIndex++) {
			var pluginPath = pluginPaths[pluginIndex];
			// Enumerate the folders
			var authors = fs.readdirSync(pluginPath);
			for(var authorIndex=0; authorIndex<authors.length; authorIndex++) {
				var pluginAuthor = authors[authorIndex];
        var pluginNames = fs.readdirSync(path.join(pluginPath,pluginAuthor));
        pluginNames.forEach(function(pluginName) {
  				// Check if directories have a valid plugin.info
  				if(!pluginInfo[pluginAuthor + '/' + pluginName] && $tw.utils.isDirectory(path.resolve(pluginPath,pluginAuthor,pluginName))) {
  					var info;
  					try {
  						info = JSON.parse(fs.readFileSync(path.resolve(pluginPath,pluginAuthor, pluginName,"plugin.info"),"utf8"));
  					} catch(ex) {
  					}
  					if(info) {
  						pluginInfo[pluginAuthor + '/' + pluginName] = info;
  					}
  				}
        })
			}
		}
	}
	return pluginInfo;
};

})();
