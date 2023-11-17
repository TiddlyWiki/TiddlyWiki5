/*\
title: $:/core/modules/commands/jsrepl.js
type: application/javascript
module-type: command

Command to launch node.js REPL with access to $tw

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "jsrepl",
	synchronous: true
};

var Command = function(params,commander,callback) {
	var self = this;
	this.params = params;
	this.commander = commander;
	this.callback = callback;
};

Command.prototype.execute = function() {
	var self = this;
	var repl = require("repl");
	this.runtime = repl.start({
		prompt: this.params.length ? this.params[0] : "$tw-jsrepl> ",
		useColors: true,
		ignoreUndefined: true
	});
	// If REPL is reset (.clear) - context needs resetting
	this.runtime.on("reset", function() {
		self.runtime.context.$tw = $tw;
	});
	// Initial context settings
	this.runtime.context.$tw = $tw;
	return null;
};

exports.Command = Command;

})();