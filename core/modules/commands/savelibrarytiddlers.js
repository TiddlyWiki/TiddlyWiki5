/*\
title: $:/core/modules/commands/savelibrarytiddlers.js
type: application/javascript
module-type: command

Command to save the subtiddlers of a bundle tiddler as a series of JSON files

--savelibrarytiddlers <tiddler> <tiddler-filter> <pathname> <skinnylisting>

The tiddler identifies the bundle tiddler that contains the subtiddlers.

The tiddler filter specifies the plugins to be included.

The pathname specifies the pathname to the folder in which the JSON files should be saved. The filename is the URL encoded title of the subtiddler.

The skinnylisting specifies the title of the tiddler to which a JSON catalogue of the subtiddlers will be saved. The JSON file contains the same data as the bundle tiddler but with the `text` field removed.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "savelibrarytiddlers",
	synchronous: true
};

var Command = function(params,commander,callback) {
	this.params = params;
	this.commander = commander;
	this.callback = callback;
};

Command.prototype.execute = function() {
	if(this.params.length < 2) {
		return "Missing filename";
	}
	var self = this,
		fs = require("fs"),
		path = require("path"),
		containerTitle = this.params[0],
		filter = this.params[1],
		basepath = this.params[2],
		skinnyListTitle = this.params[3];
	// Get the container tiddler as data
	var containerData = self.commander.wiki.getTiddlerDataCached(containerTitle,undefined);
	if(!containerData) {
		return "'" + containerTitle + "' is not a tiddler bundle";
	}
	// Filter the list of plugins
	var pluginList = [];
	$tw.utils.each(containerData.tiddlers,function(tiddler,title) {
		pluginList.push(title);
	});
	var filteredPluginList;
	if(filter) {
		filteredPluginList = self.commander.wiki.filterTiddlers(filter,null,self.commander.wiki.makeTiddlerIterator(pluginList));
	} else {
		filteredPluginList = pluginList;
	}
	// Iterate through the plugins
	var skinnyList = [];
	$tw.utils.each(filteredPluginList,function(title) {
		var tiddler = containerData.tiddlers[title];
		// Save each JSON file and collect the skinny data
		var pathname = path.resolve(self.commander.outputPath,basepath + $tw.utils.encodeURIComponentExtended(title) + ".json");
		$tw.utils.createFileDirectories(pathname);
		fs.writeFileSync(pathname,JSON.stringify(tiddler),"utf8");
		// Collect the skinny list data
		var pluginTiddlers = $tw.utils.parseJSONSafe(tiddler.text),
			readmeContent = (pluginTiddlers.tiddlers[title + "/readme"] || {}).text,
			doesRequireReload = !!self.commander.wiki.doesPluginInfoRequireReload(pluginTiddlers),
			iconTiddler = pluginTiddlers.tiddlers[title + "/icon"] || {},
			iconType = iconTiddler.type,
			iconText = iconTiddler.text,
			iconContent;
		if(iconType && iconText) {
			iconContent = $tw.utils.makeDataUri(iconText,iconType);
		}
		skinnyList.push($tw.utils.extend({},tiddler,{
			text: undefined,
			readme: readmeContent,
			"requires-reload": doesRequireReload ? "yes" : "no",
			icon: iconContent
		}));
	});
	// Save the catalogue tiddler
	if(skinnyListTitle) {
		self.commander.wiki.setTiddlerData(skinnyListTitle,skinnyList);
	}
	return null;
};

exports.Command = Command;

})();
