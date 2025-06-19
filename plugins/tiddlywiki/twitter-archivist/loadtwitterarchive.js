/*\
title: $:/plugins/tiddlywiki/twitter-archivist/loadtwitterarchive.js
type: application/javascript
module-type: command

Read tiddlers from an unzipped Twitter archive

\*/

"use strict";

var widget = require("$:/core/modules/widgets/widget.js");

exports.info = {
	name: "loadtwitterarchive",
	synchronous: false
};

var Command = function(params,commander,callback) {
	this.params = params;
	this.commander = commander;
	this.callback = callback;
};

Command.prototype.execute = function() {
	var self = this;
	if(this.params.length < 1) {
		return "Missing path to Twitter archive";
	}
	var archivePath = this.params[0];
	// Load tweets
	var archiveSource = new $tw.utils.TwitterArchivistSourceNodeJs({
		archivePath: archivePath
	}),
	archivist = new $tw.utils.TwitterArchivist({
		source: archiveSource
	});
	archivist.loadArchive({
		wiki: this.commander.wiki
	}).then(function() {
		self.callback(null);
	}).catch(function(err) {
		self.callback(err);
	});
	return null;
};

exports.Command = Command;
