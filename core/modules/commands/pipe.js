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
		outgoingFilter = self.params[1], // Filter of tiddlers to write to the pipe
		incomingTitle = self.params[2],
		args = self.params.slice(3); // Remaining arguments are passed on as tasks arguments
	// Find the pipe information
	var pipeInfo = ($tw.boot.wikiInfo["external-pipes"] || {})[name];
	if(!pipeInfo) {
		return this.callback("External pipe \"" + name + "\" not found");
	}
	// Create the pipe instance and process a message
	var pipe = new Pipe({
		name: name,
		pipeInfo: pipeInfo,
		outgoingFilter: outgoingFilter,
		incomingTitle: incomingTitle,
		args: args,
		command: this
	});
	pipe.processMessage(this.callback);
};

function Pipe(options) {
	this.name = options.name;
	this.pipeInfo = options.pipeInfo;
	this.outgoingFilter = options.outgoingFilter;
	this.incomingTitle = options.incomingTitle;
	this.args = options.args;
	this.command = options.command;
}

Pipe.prototype.processMessage = function(callback) {
	// Get the outgoing data
	var data = this.composeOutgoingData(this.outgoingFilter);
	// Connect to the pipe
	switch(this.pipeInfo.type) {
		case "task":
			this.pipeExternalTask(data,callback);
			break;
		case "socket":
			this.pipeSocket(data,callback);
			break;
		case "socket-erlang":
			this.pipeSocketErlang(data,callback);
			break;
		default:
			callback("Invalid pipe specifier '" + this.name + "': " + this.pipeInfo.type);
			break;
	}
};

Pipe.prototype.log = function(args) {
	this.command.commander.log("Pipe: " + Array.prototype.slice.call(arguments,0).join(" "));
};

Pipe.prototype.pipeExternalTask = function(data,callback) {
	var self = this,
		spawn = require("child_process").spawn,
		path = require("path"),
		childProcess = spawn(path.resolve($tw.boot.wikiPath,this.pipeInfo.path),this.args,{
			stdio: ["pipe","pipe",process.stderr],
			shell: true,
			env: $tw.utils.extend({},process.env,this.pipeInfo.environment)
		});
	// Pass the tiddlers over the outgoing stream
	childProcess.stdin.on("error",function(err) {
		self.log("Task stdin error",err)
	});
	childProcess.stdin.write(data);
	childProcess.stdin.end();
	// Catch the output
	var chunks = [];
	childProcess.stdout.on("data",function(chunk) {
		chunks.push(chunk.toString());
	});
	childProcess.stdout.on("close",function() {
		self.log("Task stdout close");
		self.processIncomingData(chunks.join(""));
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
			return callback("Error executing external task: " + code);
		}
		// Exit successfully
		callback(null);
	});
};

Pipe.prototype.pipeSocket = function(data,callback) {
	var self = this,
		net = require("net"),
		socket = new net.Socket({
			allowHalfOpen: true
		}),
		chunks = [];
	socket.connect(this.pipeInfo.port,this.pipeInfo.host || 8081,function() {
		self.log("Socket connection",this.pipeInfo.port,this.pipeInfo.host);
		socket.write(data);
		socket.end();
	});
	socket.on("error",function(e) {
		self.log("Socket error",e)
	});
	socket.on("data",function(data) {
		chunks.push(data.toString());
	});
	socket.on("end",function() {
		self.processIncomingData(chunks.join(""));
		self.log("Socket end");
		socket.destroy();
	});
	// Add a "close" event handler for the client socket
	socket.on("close",function() {
		self.log("Socket closed");
		return callback(null);
	});
	return null;
};

Pipe.prototype.pipeSocketErlang = function(data,callback) {
	var self = this,
		encoding = this.pipeInfo.encoding || "utf8",
		net = require("net"),
		socket = new net.Socket(),
		accumulator = Buffer.alloc(0);
	socket.connect(this.pipeInfo.port,this.pipeInfo.host || 8081,function() {
		self.log("Socket connection",self.pipeInfo.port,self.pipeInfo.host);
		var dataBytes = Buffer.from(data,encoding);
		// Write 32-bit big endian message length
		var lengthBytes = Buffer.alloc(4);
		lengthBytes.writeUInt32BE(dataBytes.length + 1,0)
console.log("Writing bytes",dataBytes.length + 1);
		socket.write(lengthBytes);
		// Write 8-bit type
		var typeByte = Buffer.alloc(1);
		typeByte.writeUInt8(1,0);
		socket.write(typeByte);
		// Write data
		socket.write(dataBytes);
	});
	socket.on("error",function(e) {
		self.log("Socket error",e)
	});
	socket.on("data",function(data) {
console.log("Received data",data.length)
		accumulator = Buffer.concat([accumulator,data]);
		while(accumulator.length > 4) {
			var length = accumulator.readInt32BE(0);
			if(accumulator.length >= (length + 4)) {
				if(length < 1) {
					throw "ERROR: Incoming message length field is less than 1";
				}
				var type = accumulator.readUInt8(4),
					dataLength = length - 1,
					data = accumulator.toString(encoding,5,dataLength + 5);
console.log("Got message",length,type)
				self.processIncomingData(data);
				accumulator = accumulator.slice(length + 4);
socket.end();
return callback(null);
			} else {
				break;
			}
		}
	});
	socket.on("end",function() {
		self.log("Socket end");
		socket.destroy();
	});
	// Add a "close" event handler for the client socket
	socket.on("close",function() {
		self.log("Socket closed");
		return callback(null);
	});
	return null;
};

Pipe.prototype.composeOutgoingData = function(outgoingFilter) {
	var self = this,
		pipeInfoInput = this.pipeInfo.input || {},
		data;
	switch(pipeInfoInput.format || "json-raw-tiddlers") {
		case "rendered-text":
			var titles = self.command.commander.wiki.filterTiddlers(outgoingFilter),
				output = [];
			$tw.utils.each(titles,function(title) {
				output.push(self.command.commander.wiki.renderTiddler("text/plain",title));
			});
			data = output.join("");
			break;
		case "json-rendered-text-tiddlers":
			var titles = self.command.commander.wiki.filterTiddlers(outgoingFilter),
				tiddlers = [];
			$tw.utils.each(titles,function(title) {
				tiddlers.push({
					title: title,
					text: self.command.commander.wiki.renderTiddler("text/plain",title)
				})
			});
			data = JSON.stringify(tiddlers); 
			break;
		case "json-raw-tiddlers":
			// Intentional fall-through
		default:
			data = this.command.commander.wiki.getTiddlersAsJson(outgoingFilter);
			break;
	}
	return data;
};

Pipe.prototype.processIncomingData = function(data) {
	var pipeInfoOutput = this.pipeInfo.output || {},
		jsonData;
	switch(pipeInfoOutput.format || "text") {
		case "json-raw-tiddlers":
			try {
				jsonData = JSON.parse(data);
			} catch(e) {
				this.log("Error parsing returned JSON: " + e + "\n\n\n->\n" + data);
			}
			// Add the tiddlers
			if(jsonData) {
				this.command.commander.wiki.addTiddlers(jsonData);				
			}
			break;
		case "text":
			// Intentional fall-through
		default:
console.log("Writing tiddler",pipeInfoOutput.tiddler,{
				text: data, title: this.incomingTitle
			})
			this.command.commander.wiki.addTiddler(new $tw.Tiddler(pipeInfoOutput.tiddler,{
				text: data, title: this.incomingTitle || pipeInfoOutput.tiddler.title
			}));
			break;
	}
};

exports.Command = Command;

})();
