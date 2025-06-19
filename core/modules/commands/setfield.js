/*\
title: $:/core/modules/commands/setfield.js
type: application/javascript
module-type: command

Command to modify selected tiddlers to set a field to the text of a template tiddler that has been wikified with the selected tiddler as the current tiddler.

\*/

"use strict";

var widget = require("$:/core/modules/widgets/widget.js");

exports.info = {
	name: "setfield",
	synchronous: true
};

var Command = function(params,commander,callback) {
	this.params = params;
	this.commander = commander;
	this.callback = callback;
};

Command.prototype.execute = function() {
	if(this.params.length < 4) {
		return "Missing parameters";
	}
	var self = this,
		wiki = this.commander.wiki,
		filter = this.params[0],
		fieldname = this.params[1] || "text",
		templatetitle = this.params[2],
		rendertype = this.params[3] || "text/plain",
		tiddlers = wiki.filterTiddlers(filter);
	$tw.utils.each(tiddlers,function(title) {
		var parser = wiki.parseTiddler(templatetitle),
			newFields = {},
			tiddler = wiki.getTiddler(title);
		if(parser) {
			var widgetNode = wiki.makeWidget(parser,{variables: {currentTiddler: title}});
			var container = $tw.fakeDocument.createElement("div");
			widgetNode.render(container,null);
			newFields[fieldname] = rendertype === "text/html" ? container.innerHTML : container.textContent;
		} else {
			newFields[fieldname] = undefined;
		}
		wiki.addTiddler(new $tw.Tiddler(tiddler,newFields));
	});
	return null;
};

exports.Command = Command;
