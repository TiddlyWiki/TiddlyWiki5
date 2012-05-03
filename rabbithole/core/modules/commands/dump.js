/*\
title: $:/core/modules/commands/dump.js
type: application/javascript
module-type: command

Dump command

\*/
(function(){

/*jslint node: true, browser: true */
"use strict";

exports.info = {
	name: "dump",
	synchronous: true
}

var Command = function(params,commander) {
	this.params = params;
	this.commander = commander;
	this.output = commander.streams.output;
};

Command.prototype.execute = function() {
	if(this.params.length < 1) {
		return "Too few parameters for dump command";
	}
	var subcommand = this.subcommands[this.params[0]];
	if(subcommand) {
		return subcommand.call(this);
	} else {
		return "Unknown subcommand (" + this.params[0] + ") for dump command";
	}
}

Command.prototype.subcommands = {};


Command.prototype.subcommands.tiddlers = function() {
	var tiddlers = this.commander.wiki.sortTiddlers()
	this.output.write("Wiki contains these tiddlers:\n");
	for(var t=0; t<tiddlers.length; t++) {
		this.output.write(tiddlers[t] + "\n");
	}
	return null; // No error
};

Command.prototype.subcommands.shadows = function() {
	var tiddlers = this.commander.wiki.shadows.sortTiddlers()
	this.output.write("Wiki contains these shadow tiddlers:\n");
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
		dumpConfig = function(object,prefix) {
			for(var n in object) {
				var v = object[n];
				if(typeof v === "object") {
					dumpConfig(v,prefix + "." + quotePropertyName(n));
				} else if(typeof v === "string") {
					self.output.write(prefix + "." + quotePropertyName(n) + ": \"" + $tw.utils.stringify(v) + "\"\n");
				} else {
					self.output.write(prefix + "." + quotePropertyName(n) + ": " + v.toString() + "\n");
				}
			}
		},
		dumpObject = function(heading,object) {
			self.output.write(heading +"\n");
			for(var n in object) {
				self.output.write("  " + n + "\n");
			}
		};
	this.output.write("Configuration:\n");
	dumpConfig($tw.config,"  $tw.config");
	dumpObject("Tiddler field plugins:",$tw.Tiddler.fieldPlugins);
	dumpObject("Loaded modules:",$tw.modules.titles);
	dumpObject("Loaded plugins:",$tw.plugins.moduleTypes);
	dumpObject("Command plugins:",$tw.commands);
	dumpObject("Parser plugins:",$tw.wiki.parsers);
	dumpObject("Macro plugins:",$tw.wiki.macros);
	dumpObject("Deserializer plugins:",$tw.Wiki.tiddlerDeserializerPlugins);
	return null; // No error
};

exports.Command = Command;

})();
