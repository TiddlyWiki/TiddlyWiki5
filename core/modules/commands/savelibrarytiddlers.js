/*\
title: $:/core/modules/commands/savelibrarytiddlers.js
type: application/javascript
module-type: command

Command to save the subtiddlers of a bundle tiddler as a series of JSON files

--savelibrarytiddlers <tiddler> <pathname> <skinnylisting>

The tiddler identifies the bundle tiddler that contains the subtiddlers.

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
		basepath = this.params[1],
		skinnyListTitle = this.params[2];
	// Get the container tiddler as data
	var containerData = self.commander.wiki.getTiddlerData(containerTitle,undefined);
	if(!containerData) {
		return "'" + containerTitle + "' is not a tiddler bundle";
	}
	// Save each JSON file and collect the skinny data
	var skinnyList = [];
	$tw.utils.each(containerData.tiddlers,function(tiddler,title) {
		var pathname = path.resolve(self.commander.outputPath,basepath + encodeURIComponent(title) + ".json");
		$tw.utils.createFileDirectories(pathname);
		fs.writeFileSync(pathname,JSON.stringify(tiddler,null,$tw.config.preferences.jsonSpaces),"utf8");
		skinnyList.push($tw.utils.extend({},tiddler,{text: undefined}));
	});
	// Save the catalogue tiddler
	if(skinnyListTitle) {
		self.commander.wiki.setTiddlerData(skinnyListTitle,skinnyList);
	}
	return null;
};

exports.Command = Command;

})();
