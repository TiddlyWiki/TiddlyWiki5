/*\
title: $:/core/modules/commander.js
type: application/javascript
module-type: global

The $tw.Commander class is a command interpreter

\*/

"use strict";

/*
Parse a sequence of commands
	commandTokens: an array of command string tokens
	wiki: reference to the wiki store object
	streams: {output:, error:}, each of which has a write(string) method
	callback: a callback invoked as callback(err) where err is null if there was no error
*/
const Commander = function(commandTokens,callback,wiki,streams) {
	const path = require("path");
	this.commandTokens = commandTokens;
	this.nextToken = 0;
	this.callback = callback;
	this.wiki = wiki;
	this.streams = streams;
	this.outputPath = path.resolve($tw.boot.wikiPath,$tw.config.wikiOutputSubDir);
};

/*
Log a string if verbose flag is set
*/
Commander.prototype.log = function(str) {
	if(this.verbose) {
		this.streams.output.write(`${str}\n`);
	}
};

/*
Write a string if verbose flag is set
*/
Commander.prototype.write = function(str) {
	if(this.verbose) {
		this.streams.output.write(str);
	}
};

/*
Add a string of tokens to the command queue
*/
Commander.prototype.addCommandTokens = function(commandTokens) {
	const params = [...commandTokens];
	params.unshift(0);
	params.unshift(this.nextToken);
	Array.prototype.splice.apply(this.commandTokens,params);
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
	const self = this;
	// Invoke the callback if there are no more commands
	if(this.nextToken >= this.commandTokens.length) {
		this.callback(null);
	} else {
		// Get and check the command token
		let commandName = this.commandTokens[this.nextToken++];
		if(commandName.substr(0,2) !== "--") {
			this.callback(`Missing command: ${commandName}`);
		} else {
			commandName = commandName.substr(2); // Trim off the --
			// Accumulate the parameters to the command
			let params = [];
			while(this.nextToken < this.commandTokens.length &&
				this.commandTokens[this.nextToken].substr(0,2) !== "--") {
				params.push(this.commandTokens[this.nextToken++]);
			}
			// Get the command info
			const command = $tw.commands[commandName];
			let c; let err;
			if(!command) {
				this.callback(`Unknown command: ${commandName}`);
			} else {
				if(this.verbose) {
					this.streams.output.write(`Executing command: ${commandName} ${params.join(" ")}\n`);
				}
				// Parse named parameters if required
				if(command.info.namedParameterMode) {
					params = this.extractNamedParameters(params,command.info.mandatoryParameters);
					if(typeof params === "string") {
						return this.callback(params);
					}
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
					c = new command.Command(params,this,((err) => {
						if(err) {
							self.callback(err);
						} else {
							self.executeNextCommand();
						}
					}));
					err = c.execute();
					if(err) {
						this.callback(err);
					}
				}
			}
		}
	}
};

/*
Given an array of parameter strings `params` in name:value format, and an array of mandatory parameter names in `mandatoryParameters`, returns a hashmap of values or a string if error
*/
Commander.prototype.extractNamedParameters = function(params,mandatoryParameters) {
	mandatoryParameters = mandatoryParameters || [];
	const errors = [];
	const paramsByName = Object.create(null);
	// Extract the parameters
	$tw.utils.each(params,(param) => {
		const index = param.indexOf("=");
		if(index < 1) {
			errors.push(`malformed named parameter: '${param}'`);
		}
		paramsByName[param.slice(0,index)] = $tw.utils.trim(param.slice(index + 1));
	});
	// Check the mandatory parameters are present
	$tw.utils.each(mandatoryParameters,(mandatoryParameter) => {
		if(!$tw.utils.hop(paramsByName,mandatoryParameter)) {
			errors.push(`missing mandatory parameter: '${mandatoryParameter}'`);
		}
	});
	// Return any errors
	if(errors.length > 0) {
		return errors.join(" and\n");
	} else {
		return paramsByName;
	}
};

Commander.initCommands = function(moduleType) {
	moduleType = moduleType || "command";
	$tw.commands = {};
	$tw.modules.forEachModuleOfType(moduleType,(title,module) => {
		const c = $tw.commands[module.info.name] = {};
		// Add the methods defined by the module
		for(const f in module) {
			if($tw.utils.hop(module,f)) {
				c[f] = module[f];
			}
		}
	});
};

exports.Commander = Commander;
