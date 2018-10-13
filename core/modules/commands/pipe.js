/*\
title: $:/core/modules/commands/pipe.js
type: application/javascript
module-type: command

Command to execute an external task

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "pipe",
	synchronous: false
};

var Command = function(params,commander,callback) {
	this.params = params;
	this.commander = commander;
	this.callback = callback;
};

Command.prototype.execute = function() {
	var self = this;
	if(this.params.length < 2) {
		return "Missing parameters";
	}
	var name = self.params[0], // External pipe name
		filter = self.params[1], // Filter of tiddlers to write to the pipe
		args = self.params.slice(2); // Remaining arguments are passed on as tasks arguments
	// Find the pipe information
	var pipeInfo = ($tw.boot.wikiInfo["external-pipes"] || {})[name];
	if(!pipeInfo) {
		return this.callback("External pipe \"" + name + "\" not found");
	}
	// Get the outgoing data
	var data = this.composeOutgoingData(filter,pipeInfo);
	// Connect to the pipe
	var options = {
			args: args,
			data: data
		};
	switch(pipeInfo.type) {
		case "task":
			return this.pipeExternalTask(pipeInfo,options);
		case "socket":
			return this.pipeSocket(pipeInfo,options);
		default:
			return "Invalid pipe specifier '" + name + "'"
	}
};

Command.prototype.log = function(args) {
	this.commander.log("Pipe: " + Array.prototype.slice.call(arguments,0).join(" "));
};

Command.prototype.pipeExternalTask = function(pipeInfo,options) {
	var self = this,
		spawn = require("child_process").spawn,
		path = require("path"),
		childProcess = spawn(path.resolve($tw.boot.wikiPath,pipeInfo.path),options.args,{
			stdio: ["pipe","pipe",process.stderr],
			shell: true,
			env: $tw.utils.extend({},process.env,pipeInfo.environment)
		});
	// Pass the tiddlers over the outgoing stream
	childProcess.stdin.on("error",function(err) {
		self.log("Task stdin error",err)
	});
	childProcess.stdin.write(options.data);
	childProcess.stdin.end();
	// Catch the output
	var chunks = [];
	childProcess.stdout.on("data",function(chunk) {
		chunks.push(chunk.toString());
	});
	childProcess.stdout.on("close",function() {
		self.log("Task stdout close");
		self.processIncomingData(chunks.join(""),pipeInfo);
	});
	childProcess.stdout.on("error",function(err) {
		self.log("Task stdout error",err)
	});
	// Pick up the output when the process ends
	childProcess.on("error",function(err) {
		self.log("Task error",err)
	});
	childProcess.on("exit",function(code,signal) {
		self.log("Task exit",code,signal)
		if(code !== 0) {
			return self.callback("Error executing external task: " + code);
		}
		// Exit successfully
		self.callback(null);
	});
	return null;
};

Command.prototype.pipeSocket = function(pipeInfo,options) {
	var self = this,
		net = require("net"),
		socket = new net.Socket({
			allowHalfOpen: true
		}),
		chunks = [];
	socket.connect(pipeInfo.port,pipeInfo.host || 8081,function() {
		self.log("Socket connection",pipeInfo.port,pipeInfo.host);
		socket.write(options.data);
		socket.end();
	});
	socket.on("error",function(e) {
		self.log("Socket error",e)
	});
	socket.on("data",function(data) {
		chunks.push(data.toString());
	});
	socket.on("end",function() {
		self.processIncomingData(chunks.join(""),pipeInfo);
		self.log("Socket end");
		socket.destroy();
	});
	// Add a "close" event handler for the client socket
	socket.on("close",function() {
		self.log("Socket closed");
		return self.callback(null);
	});
	return null;
};

Command.prototype.composeOutgoingData = function(filter,pipeInfo) {
	var self = this,
		pipeInfoInput = pipeInfo.input || {},
		data;
	switch(pipeInfoInput.format || "json-raw-tiddlers") {
		case "rendered-text":
			var titles = self.commander.wiki.filterTiddlers(filter),
				output = [];
			$tw.utils.each(titles,function(title) {
				output.push(self.commander.wiki.renderTiddler("text/plain",title));
			});
			data = output.join("");
			break;
		case "json-rendered-text-tiddlers":
			var titles = self.commander.wiki.filterTiddlers(filter),
				tiddlers = [];
			$tw.utils.each(titles,function(title) {
				tiddlers.push({
					title: title,
					text: self.commander.wiki.renderTiddler("text/plain",title)
				})
			});
			data = JSON.stringify(tiddlers); 
			break;
		case "json-raw-tiddlers":
			// Intentional fall-through
		default:
			data = this.commander.wiki.getTiddlersAsJson(filter);
			break;
	}
	return data;
};

Command.prototype.processIncomingData = function(data,pipeInfo) {
	var self = this,
		pipeInfoOutput = pipeInfo.output || {},
		jsonData;
	switch(pipeInfoOutput.format || "text") {
		case "json-raw-tiddlers":
			try {
				jsonData = JSON.parse(data);
			} catch(e) {
				self.log("Error parsing returned JSON: " + e + "\n\n\n->\n" + data);
			}
			// Add the tiddlers
			if(jsonData) {
				this.commander.wiki.addTiddlers(jsonData);				
			}
			break;
		case "text":
			// Intentional fall-through
		default:
			this.commander.wiki.addTiddler(new $tw.Tiddler(pipeInfoOutput.tiddler,{
				text: data
			}));
			break;
	}
};

exports.Command = Command;

})();
