/*\
title: $:/plugins/tiddlywiki/xlsx-utils/xlsx-import-command.js
type: application/javascript
module-type: command

Command to import an xlsx file

\*/

"use strict";

exports.info = {
	name: "xlsx-import",
	synchronous: true
};

const Command = function(params,commander,callback) {
	this.params = params;
	this.commander = commander;
	this.callback = callback;
};

Command.prototype.execute = function() {
	if(this.params.length < 1) {
		return "Missing parameters";
	}
	const self = this;
	const {wiki} = this.commander;
	const filename = this.params[0];
	const importSpec = this.params[1];
	const {XLSXImporter} = require("$:/plugins/tiddlywiki/xlsx-utils/importer.js");
	const importer = new XLSXImporter({
		filename,
		importSpec,
		wiki
	});
	wiki.addTiddlers(importer.getResults());
	return null;
};

exports.Command = Command;
