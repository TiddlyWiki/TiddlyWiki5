/*\
title: $:/core/commander.js
type: application/javascript
module-type: global

The $tw.Commander class is a command interpreter

\*/
(function(){

/*jslint node: true, browser: true */
"use strict";

/*
Parse a sequence of commands
	commandTokens: an array of command string tokens
	wiki: reference to the wiki store object
	streams: {output:, error:}, each of which has a write(string) method
	callback: a callback invoked as callback(err) where err is null if there was no error
*/
var Commander = function(commandTokens,callback,wiki,streams) {
	this.commandTokens = commandTokens;
	this.nextToken = 0;
	this.callback = callback;
	this.wiki = wiki;
	this.streams = streams;
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
			var command = $tw.commands[commandName];
			if(!command) {
				this.callback("Unknown command: " + commandName);
			} else {
				if(command.info.synchronous) {
					var c = new command.Command(params,this);
					c.execute();
					this.executeNextCommand();
				}
			}
		}
	}
};

Commander.initCommands = function(moduleType) {
	// Install the command modules
	moduleType = moduleType || "command";
	$tw.commands = {};
	var modules = $tw.plugins.moduleTypes[moduleType],
		n,m,f,c;
	if(modules) {
		for(n=0; n<modules.length; n++) {
			m = modules[n];
			$tw.commands[m.info.name] = {};
			c = $tw.commands[m.info.name];
			// Add the methods defined by the module
			for(f in m) {
				c[f] = m[f];
			}
		}
	}

};

exports.Commander = Commander;

})();
