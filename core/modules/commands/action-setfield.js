/*\
title: $:/core/modules/commands/action-setfield.js
type: application/javascript
module-type: command

Command to set a field of a tiddler to a specified value

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var widget = require("$:/core/modules/widgets/widget.js");

exports.info = {
	name: "action-setfield",
	synchronous: true
};

var Command = function(params,commander,callback) {
	this.params = params;
	this.commander = commander;
	this.callback = callback;
};

Command.prototype.execute = function() {
	var wiki = this.commander.wiki,
		tiddler = this.params[0],
		fieldname = this.params[1] || "text",
		fieldvalue = this.params[2];
		wiki.setText(tiddler,fieldname,undefined,fieldvalue,null);
		
	return null;
};

exports.Command = Command;

})();
