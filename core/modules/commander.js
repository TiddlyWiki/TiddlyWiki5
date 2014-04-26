/*\
title: $:/core/modules/commander.js
type: application/javascript
module-type: global

The $tw.Commander class is a command interpreter

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Parse a sequence of commands
	commandTokens: an array of command string tokens
	wiki: reference to the wiki store object
	streams: {output:, error:}, each of which has a write(string) method
	callback: a callback invoked as callback(err) where err is null if there was no error
*/
var Commander = function(commandTokens,callback,wiki,streams) {
	var path = require("path");
	this.commandTokens = commandTokens;
	this.nextToken = 0;
	this.callback = callback;
	this.wiki = wiki;
	this.streams = streams;
	this.outputPath = process.cwd();
};

/*
Add a string of tokens to the command queue
*/
Commander.prototype.addCommandTokens = function(commandTokens) {
	Array.prototype.push.apply(this.commandTokens,commandTokens);
};

/*
Execute the sequence of commands and invoke a callback on completion
*/
Commander.prototype.execute = function() {
	this.executeNextCommand();
};

/*
Execute the next command in the sequence
*/
Commander.prototype.executeNextCommand = function() {
	var self = this;
	// Invoke the callback if there are no more commands
	if(this.nextToken >= this.commandTokens.length) {
		this.callback(null);
	} else {
		// Get and check the command token
		var commandName = this.commandTokens[this.nextToken++];
		if(commandName.substr(0,2) !== "--") {
			this.callback("Missing command");
		} else {
			commandName = commandName.substr(2); // Trim off the --
			// Accumulate the parameters to the command
			var params = [];
			while(this.nextToken < this.commandTokens.length && 
				this.commandTokens[this.nextToken].substr(0,2) !== "--") {
				params.push(this.commandTokens[this.nextToken++]);
			}
			// Get the command info
			var command = $tw.commands[commandName],
				c,err;
			if(!command) {
				this.callback("Unknown command: " + commandName);
			} else {
				if(this.verbose) {
					this.streams.output.write("Executing command: " + commandName + " " + params.join(" ") + "\n");
				}
				if(command.info.synchronous) {
					// Synchronous command
					c = new command.Command(params,this);
					err = c.execute();
					if(err) {
						this.callback(err);
					} else {
						this.executeNextCommand();
					}
				} else {
					// Asynchronous command
					c = new command.Command(params,this,function(err) {
						if(err) {
							self.callback(err);
						} else {
							self.executeNextCommand();
						}
					});
					err = c.execute();
					if(err) {
						this.callback(err);
					}
				}
			}
		}
	}
};

Commander.initCommands = function(moduleType) {
	moduleType = moduleType || "command";
	$tw.commands = {};
	$tw.modules.forEachModuleOfType(moduleType,function(title,module) {
		var c = $tw.commands[module.info.name] = {};
		// Add the methods defined by the module
		for(var f in module) {
			if($tw.utils.hop(module,f)) {
				c[f] = module[f];
			}
		}
	});
};

exports.Commander = Commander;

})();
