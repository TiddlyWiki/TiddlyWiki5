/*\
title: $:/plugins/tiddlywiki/twitter-archivist/loadtwitterarchive.js
type: application/javascript
module-type: command

Read tiddlers from an unzipped Twitter archive

\*/

"use strict";

const widget = require("$:/core/modules/widgets/widget.js");

exports.info = {
	name: "loadtwitterarchive",
	synchronous: false
};

const Command = function(params,commander,callback) {
	this.params = params;
	this.commander = commander;
	this.callback = callback;
};

Command.prototype.execute = function() {
	const self = this;
	if(this.params.length < 1) {
		return "Missing path to Twitter archive";
	}
	const archivePath = this.params[0];
	// Load tweets
	const archiveSource = new $tw.utils.TwitterArchivistSourceNodeJs({
		archivePath
	});
	const archivist = new $tw.utils.TwitterArchivist({
		source: archiveSource
	});
	archivist.loadArchive({
		wiki: this.commander.wiki
	}).then(() => {
		self.callback(null);
	}).catch((err) => {
		self.callback(err);
	});
	return null;
};

exports.Command = Command;
