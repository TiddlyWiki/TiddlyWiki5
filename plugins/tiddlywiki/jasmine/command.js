/*\
title: $:/plugins/tiddlywiki/jasmine/command.js
type: application/javascript
module-type: command

The main module of the Jasmine test plugin for TiddlyWiki5

\*/

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var jasmine = require("./jasmine-plugin.js");

exports.info = {
	name: "test",
	synchronous: false,
};

var Command = function(params,commander,callback) {
	this.params = params;
	this.commander = commander;
	this.callback = callback;
};

Command.prototype.execute = function() {
	jasmine.runTests(this.callback);
};

exports.Command = Command;
