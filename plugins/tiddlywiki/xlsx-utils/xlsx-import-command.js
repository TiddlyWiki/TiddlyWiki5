/*\
title: $:/plugins/tiddlywiki/xlsx-utils/xlsx-import-command.js
type: application/javascript
module-type: command

Command to import an xlsx file

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "xlsx-import",
	synchronous: true
};

var Command = function(params,commander,callback) {
	this.params = params;
	this.commander = commander;
	this.callback = callback;
};

Command.prototype.execute = function() {
	if(this.params.length < 1) {
		return "Missing parameters";
	}
	var self = this,
		wiki = this.commander.wiki,
		filename = this.params[0],
		importSpec = this.params[1],
		XLSXImporter = require("$:/plugins/tiddlywiki/xlsx-utils/importer.js").XLSXImporter,
		importer = new XLSXImporter({
			filename: filename,
			importSpec: importSpec,
			wiki: wiki
		});
	wiki.addTiddlers(importer.getResults());
	return null;
};

exports.Command = Command;

})();
