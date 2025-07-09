/*\
title: $:/core/modules/commands/render.js
type: application/javascript
module-type: command

Render individual tiddlers and save the results to the specified files

\*/

"use strict";

const widget = require("$:/core/modules/widgets/widget.js");

exports.info = {
	name: "render",
	synchronous: true
};

const Command = function(params,commander,callback) {
	this.params = params;
	this.commander = commander;
	this.callback = callback;
};

Command.prototype.execute = function() {
	if(this.params.length < 1) {
		return "Missing tiddler filter";
	}
	const self = this;
	const fs = require("fs");
	const path = require("path");
	const {wiki} = this.commander;
	const tiddlerFilter = this.params[0];
	const filenameFilter = this.params[1] || "[is[tiddler]addsuffix[.html]]";
	const type = this.params[2] || "text/html";
	const template = this.params[3];
	let variableList = this.params.slice(4);
	const tiddlers = wiki.filterTiddlers(tiddlerFilter);
	const variables = Object.create(null);
	while(variableList.length >= 2) {
		variables[variableList[0]] = variableList[1];
		variableList = variableList.slice(2);
	}
	$tw.utils.each(tiddlers,(title) => {
		const filenameResults = wiki.filterTiddlers(filenameFilter,$tw.rootWidget,wiki.makeTiddlerIterator([title]));
		if(filenameResults.length > 0) {
			const filepath = path.resolve(self.commander.outputPath,filenameResults[0]);
			if(self.commander.verbose) {
				console.log(`Rendering "${title}" to "${filepath}"`);
			}
			const parser = wiki.parseTiddler(template || title);
			const widgetNode = wiki.makeWidget(parser,{variables: $tw.utils.extend({},variables,{currentTiddler: title,storyTiddler: title})});
			const container = $tw.fakeDocument.createElement("div");
			widgetNode.render(container,null);
			const text = type === "text/html" ? container.innerHTML : container.textContent;
			$tw.utils.createFileDirectories(filepath);
			fs.writeFileSync(filepath,text,"utf8");
		} else {
			console.log(`Not rendering "${title}" because the filename filter returned an empty result`);
		}
	});
	return null;
};

exports.Command = Command;
