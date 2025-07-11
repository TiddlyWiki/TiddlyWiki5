/*\
title: $:/core/modules/commands/rendertiddlers.js
type: application/javascript
module-type: command

Command to render several tiddlers to a folder of files

\*/

"use strict";

const widget = require("$:/core/modules/widgets/widget.js");

exports.info = {
	name: "rendertiddlers",
	synchronous: true
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
	const {wiki} = this.commander;
	const filter = this.params[0];
	const template = this.params[1];
	const {outputPath} = this.commander;
	const pathname = path.resolve(outputPath,this.params[2]);
	const type = this.params[3] || "text/html";
	const extension = this.params[4] || ".html";
	const deleteDirectory = (this.params[5] || "").toLowerCase() !== "noclean";
	const tiddlers = wiki.filterTiddlers(filter);
	if(deleteDirectory) {
		$tw.utils.deleteDirectory(pathname);
	}
	$tw.utils.each(tiddlers,(title) => {
		const parser = wiki.parseTiddler(template);
		const widgetNode = wiki.makeWidget(parser,{variables: {currentTiddler: title,storyTiddler: title}});
		const container = $tw.fakeDocument.createElement("div");
		widgetNode.render(container,null);
		const text = type === "text/html" ? container.innerHTML : container.textContent;
		let exportPath = null;
		if($tw.utils.hop($tw.macros,"tv-get-export-path")) {
			const macroPath = $tw.macros["tv-get-export-path"].run.apply(self,[title]);
			if(macroPath) {
				exportPath = path.resolve(outputPath,macroPath + extension);
			}
		}
		const finalPath = exportPath || path.resolve(pathname,$tw.utils.encodeURIComponentExtended(title) + extension);
		$tw.utils.createFileDirectories(finalPath);
		fs.writeFileSync(finalPath,text,"utf8");
	});
	return null;
};

exports.Command = Command;
