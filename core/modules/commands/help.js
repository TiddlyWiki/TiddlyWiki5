/*\
title: $:/core/modules/commands/help.js
type: application/javascript
module-type: command

Help command

\*/

"use strict";

exports.info = {
	name: "help",
	synchronous: true
};

var Command = function(params,commander) {
	this.params = params;
	this.commander = commander;
};

Command.prototype.execute = function() {
	var subhelp = this.params[0] || "default",
		helpBase = "$:/language/Help/",
		text;
	if(!this.commander.wiki.getTiddler(helpBase + subhelp)) {
		subhelp = "notfound";
	}
	// Wikify the help as formatted text (ie block elements generate newlines)
	text = this.commander.wiki.renderTiddler("text/plain-formatted",helpBase + subhelp);
	// Remove any leading linebreaks
	text = text.replace(/^(\r?\n)*/g,"");
	this.commander.streams.output.write(text);
};

exports.Command = Command;
