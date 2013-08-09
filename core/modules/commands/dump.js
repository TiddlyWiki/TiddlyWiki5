/*\
title: $:/core/modules/commands/print.js
type: application/javascript
module-type: command

Print command for inspecting TiddlyWiki internals

\*/
(function(){

/*jshint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "print",
	synchronous: true
};

var Command = function(params,commander) {
	this.params = params;
	this.commander = commander;
	this.output = commander.streams.output;
};

Command.prototype.execute = function() {
	if(this.params.length < 1) {
		return "Too few parameters for print command";
	}
	var subcommand = this.subcommands[this.params[0]];
	if(subcommand) {
		return subcommand.call(this);
	} else {
		return "Unknown subcommand (" + this.params[0] + ") for print command";
	}
};

Command.prototype.subcommands = {};

Command.prototype.subcommands.tiddler = function() {
	if(this.params.length < 2) {
		return "Too few parameters for print tiddler command";
	}
	var tiddler = this.commander.wiki.getTiddler(this.params[1]);
	if(!tiddler) {
		return "No such tiddler as '" + this.params[1] + "'";
	}
	this.output.write("Tiddler '" + this.params[1] + "' contains these fields:\n");
	for(var t in tiddler.fields) {
		this.output.write("  " + t + ": " + tiddler.getFieldString(t) + "\n");
	}
	return null; // No error
};

Command.prototype.subcommands.tiddlers = function() {
	var tiddlers = this.commander.wiki.getTiddlers();
	this.output.write("Wiki contains these tiddlers:\n");
	for(var t=0; t<tiddlers.length; t++) {
		this.output.write(tiddlers[t] + "\n");
	}
	return null; // No error
};

Command.prototype.subcommands.system = function() {
	var tiddlers = this.commander.wiki.getSystemTitles();
	this.output.write("Wiki contains these system tiddlers:\n");
	for(var t=0; t<tiddlers.length; t++) {
		this.output.write(tiddlers[t] + "\n");
	}
	return null; // No error
};

Command.prototype.subcommands.config = function() {
	var self = this;
	var quotePropertyName = function(p) {
			var unquotedPattern = /^[A-Za-z0-9_]*$/mg;
			if(unquotedPattern.test(p)) {
				return p;
			} else {
				return "[\"" + $tw.utils.stringify(p) + "\"]";
			}
		},
		printConfig = function(object,prefix) {
			for(var n in object) {
				var v = object[n];
				if(typeof v === "object") {
					printConfig(v,prefix + "." + quotePropertyName(n));
				} else if(typeof v === "string") {
					self.output.write(prefix + "." + quotePropertyName(n) + ": \"" + $tw.utils.stringify(v) + "\"\n");
				} else {
					self.output.write(prefix + "." + quotePropertyName(n) + ": " + v.toString() + "\n");
				}
			}
		},
		printObject = function(heading,object) {
			self.output.write(heading +"\n");
			for(var n in object) {
				self.output.write("  " + n + "\n");
			}
		};
	this.output.write("Configuration:\n");
	printConfig($tw.config,"  $tw.config");
	printObject("Tiddler field modules:",$tw.Tiddler.fieldModules);
	printObject("Loaded modules:",$tw.modules.titles);
	printObject("Command modules:",$tw.commands);
	printObject("Parser modules:",$tw.wiki.parsers);
	printObject("Macro modules:",$tw.wiki.macros);
	printObject("Deserializer modules:",$tw.Wiki.tiddlerDeserializerModules);
	return null; // No error
};

exports.Command = Command;

})();
