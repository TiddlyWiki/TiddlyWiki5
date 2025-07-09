/*\
title: $:/core/modules/commands/setfield.js
type: application/javascript
module-type: command

Command to modify selected tiddlers to set a field to the text of a template tiddler that has been wikified with the selected tiddler as the current tiddler.

\*/

"use strict";

const widget = require("$:/core/modules/widgets/widget.js");

exports.info = {
	name: "setfield",
	synchronous: true
};

const Command = function(params,commander,callback) {
	this.params = params;
	this.commander = commander;
	this.callback = callback;
};

Command.prototype.execute = function() {
	if(this.params.length < 4) {
		return "Missing parameters";
	}
	const self = this;
	const {wiki} = this.commander;
	const filter = this.params[0];
	const fieldname = this.params[1] || "text";
	const templatetitle = this.params[2];
	const rendertype = this.params[3] || "text/plain";
	const tiddlers = wiki.filterTiddlers(filter);
	$tw.utils.each(tiddlers,(title) => {
		const parser = wiki.parseTiddler(templatetitle);
		const newFields = {};
		const tiddler = wiki.getTiddler(title);
		if(parser) {
			const widgetNode = wiki.makeWidget(parser,{variables: {currentTiddler: title}});
			const container = $tw.fakeDocument.createElement("div");
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
