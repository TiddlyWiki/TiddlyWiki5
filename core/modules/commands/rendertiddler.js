/*\
title: $:/core/modules/commands/rendertiddler.js
type: application/javascript
module-type: command

Command to render a tiddler and save it to a file

\*/

"use strict";

exports.info = {
	name: "rendertiddler",
	synchronous: false
};

const Command = function(params,commander,callback) {
	this.params = params;
	this.commander = commander;
	this.callback = callback;
};

Command.prototype.execute = function() {
	if(this.params.length < 2) {
		return "Missing filename";
	}
	const self = this;
	const fs = require("fs");
	const path = require("path");
	let title = this.params[0];
	const filename = path.resolve(this.commander.outputPath,this.params[1]);
	const type = this.params[2] || "text/html";
	const template = this.params[3];
	const name = this.params[4];
	const value = this.params[5];
	const variables = {};
	$tw.utils.createFileDirectories(filename);
	if(template) {
		variables.currentTiddler = title;
		variables.storyTiddler = title;
		title = template;
	}
	if(name && value) {
		variables[name] = value;
	}
	fs.writeFile(filename,this.commander.wiki.renderTiddler(type,title,{variables}),"utf8",(err) => {
		self.callback(err);
	});
	return null;
};

exports.Command = Command;
