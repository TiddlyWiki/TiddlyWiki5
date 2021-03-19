/*\
title: $:/core/modules/commands/render.js
type: application/javascript
module-type: command

Render individual tiddlers and save the results to the specified files

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var widget = require("$:/core/modules/widgets/widget.js");

exports.info = {
	name: "render",
	synchronous: true
};

var Command = function(params,commander,callback) {
	this.params = params;
	this.commander = commander;
	this.callback = callback;
};

Command.prototype.execute = function() {
	if(this.params.length < 1) {
		return "Missing tiddler filter";
	}
	var self = this,
		fs = require("fs"),
		path = require("path"),
		wiki = this.commander.wiki,
		tiddlerFilter = this.params[0],
		filenameFilter = this.params[1] || "[is[tiddler]addsuffix[.html]]",
		type = this.params[2] || "text/html",
		template = this.params[3],
		variableList = this.params.slice(4),
		tiddlers = wiki.filterTiddlers(tiddlerFilter),
		variables =  Object.create(null);
		while(variableList.length >= 2) {
			variables[variableList[0]] = variableList[1];
			variableList = variableList.slice(2);
		}
	$tw.utils.each(tiddlers,function(title) {
		var parser = wiki.parseTiddler(template || title);
		var widgetNode = wiki.makeWidget(parser,{variables: $tw.utils.extend({},variables,{currentTiddler: title})}),
			container = $tw.fakeDocument.createElement("div");
		widgetNode.render(container,null);
		var text = type === "text/html" ? container.innerHTML : container.textContent,
			filepath = path.resolve(self.commander.outputPath,wiki.filterTiddlers(filenameFilter,$tw.rootWidget,wiki.makeTiddlerIterator([title]))[0]);
		if(self.commander.verbose) {
			console.log("Rendering \"" + title + "\" to \"" + filepath + "\"");
		}
		$tw.utils.createFileDirectories(filepath);
		fs.writeFileSync(filepath,text,"utf8");
	});
	return null;
};

exports.Command = Command;

})();
