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
	streams: {output:, input:, error:}
	callback: a callback invoked as callback(err) where err is null if there was no error
*/
var Commander = function(commandTokens,callback,wiki,streams) {
	var path = require("path");
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
		this.streams.output.write(str + "\n");
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
	var params = commandTokens.slice(0);
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
Returns the next string token without consuming it, or null if there are none left. Callback invoked(err,data)
*/
Commander.prototype.peekNextToken = function(callback) {
	var self = this;
	if(this.nextToken >= this.commandTokens.length) {
		return callback(null,null);
	} else {
		return this.stringifyToken(this.nextToken,function(err,data) {
			if(!err) {
				// Save the stringified token for next time so that we don't run prompts twice
				self.commandTokens[self.nextToken] = data;
			}
			callback(err,data);
		});
	}
};

/*
Returns and consumes the next string token, or null if there are none left. Callback invoked(err,data)
*/
Commander.prototype.getNextToken = function(callback) {
	if(this.nextToken >= this.commandTokens.length) {
		return callback(null,null);
	} else {
		return this.stringifyToken(this.nextToken++,callback);
	}
};

/*
Returns and consumes the string tokens until the end of the token stream or the first token that starts with "--".
Callback invoked(err,tokenArray)
*/
Commander.prototype.getTokensUntilCommand = function(callback) {
	var self = this,
		tokens = [];
	function processNextToken() {
		self.peekNextToken(function(err,data) {
			if(err) {
				return callback(err);
			}
			if(!data || data.substr(0,2) === "--") {
				return callback(null,tokens);
			} else {
				self.getNextToken(function(err,data) {
					if(err) {
						return callback(err);
					}
					tokens.push(data);
					processNextToken();
				});
			}
		});	
	}
	processNextToken();
};

/*
Returns a specified stringified token, or null if the index does not exist. Callback invoked(err,data)
*/
Commander.prototype.stringifyToken = function(index,callback) {
	var self = this;
	if(index >= this.commandTokens.length) {
		return callback(null,null);
	} else {
		var token = this.commandTokens[index];
		if(typeof token === "string") {
			return callback(null,token);
		} else if(typeof token === "object") {
			switch(token.type) {
				case "filter":
					return callback(null,this.wiki.filterTiddlers(token.text)[0] || "");
				case "wikified":
					return callback(null,this.wiki.renderText("text/plain","text/vnd.tiddlywiki",token.text,{
						parseAsInline: false,
						parentWidget: $tw.rootWidget
					}));
				case "prompt":
					$tw.utils.terminalQuestion({
						promptText: token.prompt || "Please enter a value",
						defaultResult: token["default"] || "",
						callback: function(err,userText) {
							callback(err,userText);
						},
						input: self.streams.input,
						output: self.streams.output,
					});
					break;
				default:
					throw "Unknown dynamic command token type: " + token.type;
			}
		}
	}
};

/*
Execute the next command in the sequence
*/
Commander.prototype.executeNextCommand = function() {
	var self = this;
	// Get and check the command token
	var commandName = this.getNextToken(function(err,commandName) {
		if(err) {
			return self.callback(err);
		}
		if(!commandName) {
			return self.callback(null);
		}
		if(commandName.substr(0,2) !== "--") {
			return self.callback("Missing command: " + commandName);
		} else {
			commandName = commandName.substr(2); // Trim off the --
			// Get the parameters to the command
			self.getTokensUntilCommand(function(err,params) {
				if(err) {
					return self.callback(err);
				}
				var command = $tw.commands[commandName],
					c,err;
				if(!command) {
					self.callback("Unknown command: " + commandName);
				} else {
					if(self.verbose) {
						self.streams.output.write("Executing command: " + commandName + " " + params.join(" ") + "\n");
					}
					// Parse named parameters if required
					if(command.info.namedParameterMode) {
						params = self.extractNamedParameters(params,command.info.mandatoryParameters);
						if(typeof params === "string") {
							return self.callback(params);
						}
					}
					if(command.info.synchronous) {
						// Synchronous command
						c = new command.Command(params,self);
						err = c.execute();
						if(err) {
							self.callback(err);
						} else {
							self.executeNextCommand();
						}
					} else {
						// Asynchronous command
						c = new command.Command(params,self,function(err) {
							if(err) {
								self.callback(err);
							} else {
								self.executeNextCommand();
							}
						});
						err = c.execute();
						if(err) {
							self.callback(err);
						}
					}
				}
			});
		}
	});
};

/*
Given an array of parameter strings `params` in name:value format, and an array of mandatory parameter names in `mandatoryParameters`, returns a hashmap of values or a string if error
*/
Commander.prototype.extractNamedParameters = function(params,mandatoryParameters) {
	mandatoryParameters = mandatoryParameters || [];
	var errors = [],
		paramsByName = Object.create(null);
	// Extract the parameters
	$tw.utils.each(params,function(param) {
		var index = param.indexOf("=");
		if(index < 1) {
			errors.push("malformed named parameter: '" + param + "'");
		}
		paramsByName[param.slice(0,index)] = $tw.utils.trim(param.slice(index+1));
	});
	// Check the mandatory parameters are present
	$tw.utils.each(mandatoryParameters,function(mandatoryParameter) {
		if(!$tw.utils.hop(paramsByName,mandatoryParameter)) {
			errors.push("missing mandatory parameter: '" + mandatoryParameter + "'");
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
