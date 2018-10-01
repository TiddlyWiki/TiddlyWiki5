/*\
title: $:/core/modules/commands/exec.js
type: application/javascript
module-type: command

Command to execute an external task

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "exec",
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
	var name = self.params[0], // External task name
		filter = self.params[1], // Filter of tiddlers to pass to the task
		args = self.params.slice(2); // Remaining arguments are passed to the task arguments
	// Find the task information
	var taskInfo = ($tw.boot.wikiInfo["external-tasks"] || {})[name];
	if(!taskInfo) {
		return this.callback("External task \"" + name + "\" not found");
	}
	// Execute it
	var spawn = require("child_process").spawn,
		path = require("path"),
		childProcess = spawn(path.resolve($tw.boot.wikiPath,taskInfo.path),args,{
			stdio: ["pipe","pipe",process.stderr],
			shell: true,
			env: $tw.utils.extend({},process.env,taskInfo.environment)
		});
	// Choose the input representation
	var taskInfoInput = taskInfo.input || {},
		data;
	switch(taskInfoInput.format || "json-raw-tiddlers") {
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
	if(data === undefined) {
		return this.callback("No input data defined for tiddler processor");
	}
	// Pass the tiddlers as JSON over stdin
	childProcess.stdin.write(data);
	childProcess.stdin.end();
	// Catch the output
	var chunks = [];
	childProcess.stdout.on("data",function(chunk) {
		chunks.push(chunk.toString());
	});
	// Pick up the output when the process ends
	childProcess.once("exit",function(code) {
		if(code !== 0) {
			return self.callback("Error executing external task: " + code);
		}
		var childOutput = chunks.join(""),
			taskInfoOutput = taskInfo.output || {},
			data;
		switch(taskInfoOutput.format || "text") {
			case "json-raw-tiddlers":
				try {
					data = JSON.parse(childOutput);
				} catch(e) {
					self.callback("Error parsing returned JSON: " + e + "\n\n\n->\n" + childOutput);
				}
				// Add the tiddlers
				self.commander.wiki.addTiddlers(data);
				break;
			case "text":
				// Intentional fall-through
			default:
				self.commander.wiki.addTiddler(new $tw.Tiddler(taskInfoOutput.tiddler,{
					text: childOutput
				}));
				break;
		}
		// Exit successfully
		self.callback(null);
	});
	return null;
};

exports.Command = Command;

})();
