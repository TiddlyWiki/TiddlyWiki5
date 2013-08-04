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
		pathname = this.params[2],
		type = this.params[3] || "text/html",
		extension = this.params[4] || ".html",
		parser = wiki.parseTiddler(template),
		tiddlers = wiki.filterTiddlers(filter);
	$tw.utils.each(tiddlers,function(title) {
		var renderTree = new $tw.WikiRenderTree(parser,{wiki: wiki, context: {tiddlerTitle: title}, document: $tw.document});
		renderTree.execute();
		var container = $tw.document.createElement("div");
		renderTree.renderInDom(container);
		var text = type === "text/html" ? container.innerHTML : container.textContent;
		fs.writeFileSync(path.resolve(pathname,encodeURIComponent(title) + extension),text,"utf8");
	});
	return null;
};

exports.Command = Command;

})();
