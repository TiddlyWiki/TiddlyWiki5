/*\
title: $:/plugins/tiddlywiki/jasmine/command.js
type: application/javascript
module-type: command

The command which executes jasmine on the command line for TiddlyWiki5

\*/

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var jasmine = require("./jasmine-plugin.js");

exports.info = {
	name: "test",
	synchronous: false,
	namedParameterMode: true
};

var Command = function(params,commander,callback) {
	this.params = params;
	this.commander = commander;
	this.callback = callback;
};

Command.prototype.execute = function() {
	var specFilter = this.params.spec;
	jasmine.runTests(this.callback,specFilter);
};

exports.Command = Command;
