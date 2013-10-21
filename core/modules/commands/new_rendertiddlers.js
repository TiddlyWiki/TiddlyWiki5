/*\
title: $:/core/modules/commands/new_rendertiddlers.js
type: application/javascript
module-type: command

Command to render several tiddlers to a folder of files

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var widget = require("$:/core/modules/new_widgets/widget.js");

exports.info = {
	name: "new_rendertiddlers",
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
		pathname = this.params[2],
		type = this.params[3] || "text/html",
		extension = this.params[4] || ".html",
		tiddlers = wiki.filterTiddlers(filter);
	$tw.utils.each(tiddlers,function(title) {
		var parser = wiki.new_parseTiddler(template),
			parseTreeNode = parser ? {type: "widget", children: [{
				type: "setvariable",
				attributes: {
					name: {type: "string", value: "tiddlerTitle"},
					value: {type: "string", value: title}
				},
				children: parser.tree
			}]} : undefined,
			widgetNode = new widget.widget(parseTreeNode,{
				wiki: wiki,
				document: $tw.document
			});
		var container = $tw.document.createElement("div");
		widgetNode.render(container,null);
		var text = type === "text/html" ? container.innerHTML : container.textContent;
		fs.writeFileSync(path.resolve(pathname,encodeURIComponent(title) + extension),text,"utf8");
	});
	return null;
};

exports.Command = Command;

})();
