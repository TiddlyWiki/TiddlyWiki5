/*\
title: $:/plugins/tiddlywiki/text-slicer/modules/commands/slice.js
type: application/javascript
module-type: command

Command to slice a specified tiddler

\*/

"use strict";

const widget = require("$:/core/modules/widgets/widget.js");
const textSlicer = require("$:/plugins/tiddlywiki/text-slicer/modules/slicer.js");

exports.info = {
	name: "slice",
	synchronous: false
};

const Command = function(params,commander,callback) {
	this.params = params;
	this.commander = commander;
	this.callback = callback;
};

Command.prototype.execute = function() {
	if(this.params.length < 1) {
		return "Missing parameters";
	}
	const self = this;
	const {wiki} = this.commander;
	const [sourceTitle,destTitle,slicerRules,outputMode] = this.params;
	const slicer = new textSlicer.Slicer({
		sourceTiddlerTitle: sourceTitle,
		baseTiddlerTitle: destTitle,
		slicerRules,
		outputMode,
		wiki,
		callback(err,tiddlers) {
			if(err) {
				return self.callback(err);
			}
			wiki.addTiddlers(tiddlers);
			self.callback();
		}
	});
	return null;
};

exports.Command = Command;
