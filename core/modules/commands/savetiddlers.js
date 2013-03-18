/*\
title: $:/core/modules/commands/savetiddlers.js
type: application/javascript
module-type: command

Command to save several tiddlers to a file

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "savetiddlers",
	synchronous: false
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
		var renderTree = new $tw.WikiRenderTree(parser,{wiki: wiki});
		renderTree.execute({tiddlerTitle: title});
		var text = renderTree.render(type);
		fs.writeFileSync(path.resolve(pathname,encodeURIComponent(title) + extension),text,"utf8");
	});
	return null;
};

exports.Command = Command;

})();
