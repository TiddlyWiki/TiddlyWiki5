/*\
title: $:/core/modules/commands/rendertiddlers.js
type: application/javascript
module-type: command

Command to render several tiddlers to a folder of files

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var widget = require("$:/core/modules/widgets/widget.js");

exports.info = {
	name: "rendertiddlers",
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
		wiki = this.commander.wiki,
		filter = this.params[0],
		template = this.params[1],
		outputPath = this.commander.outputPath,
		pathname = path.resolve(outputPath,this.params[2]),
		type = this.params[3] || "text/html",
		extension = this.params[4] || ".html",
		deleteDirectory = (this.params[5] || "").toLowerCase() !== "noclean",
		tiddlers = wiki.filterTiddlers(filter);
	if(deleteDirectory) {
		$tw.utils.deleteDirectory(pathname);
	}
	$tw.utils.each(tiddlers,function(title) {
		var parser = wiki.parseTiddler(template),
			widgetNode = wiki.makeWidget(parser,{variables: {currentTiddler: title, storyTiddler: title}}),
			container = $tw.fakeDocument.createElement("div");
		widgetNode.render(container,null);
		var text = type === "text/html" ? container.innerHTML : container.textContent,
			exportPath = null;
		if($tw.utils.hop($tw.macros,"tv-get-export-path")) {
			var macroPath = $tw.macros["tv-get-export-path"].run.apply(self,[title]);
			if(macroPath) {
				exportPath = path.resolve(outputPath,macroPath + extension);
			}
		}
		var finalPath = exportPath || path.resolve(pathname,encodeURIComponent(title) + extension);
		$tw.utils.createFileDirectories(finalPath);
		fs.writeFileSync(finalPath,text,"utf8");
	});
	return null;
};

exports.Command = Command;

})();
