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
var link = require("$:/core/modules/widgets/link.js").link;

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
		pathParam = this.params[2],
		rootPath = path.resolve(outputPath,pathParam),
		type = this.params[3] || "text/html",
		extension = this.params[4] || ".html",
		deleteDirectory = (this.params[5] || "") != "noclean",
		tiddlers = wiki.filterTiddlers(filter);
	var parser = wiki.parseTiddler(template),widgetNode = wiki.makeWidget(parser);
	if(link.getExportFolder){
		rootPath = link.getExportFolder(rootPath,outputPath,pathParam,null,null);
	}
	if(deleteDirectory){
		$tw.utils.deleteDirectory(rootPath);
	}
	$tw.utils.createDirectory(rootPath);
	$tw.utils.each(tiddlers,function(title) {		
		var parser = wiki.parseTiddler(template),
			widgetNode = wiki.makeWidget(parser,{variables: {currentTiddler: title}});
		var container = $tw.fakeDocument.createElement("div");
		widgetNode.render(container,null);
		var text = type === "text/html" ? container.innerHTML : container.textContent;
		var finalPath = path.resolve(rootPath,encodeURIComponent(title) + extension)
		if(link.getExportFolder){
			finalPath = link.getExportFolder(finalPath,outputPath,pathParam,title,extension);			
			$tw.utils.createDirectory(path.dirname(finalPath));
		}
		fs.writeFileSync(finalPath,text,"utf8");
	});
	return null;
};

exports.Command = Command;

})();
