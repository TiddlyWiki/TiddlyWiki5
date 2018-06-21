/*\
title: $:/plugins/tiddlywiki/text-slicer/modules/commands/slice.js
type: application/javascript
module-type: command

Command to slice a specified tiddler

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var widget = require("$:/core/modules/widgets/widget.js"),
	textSlicer = require("$:/plugins/tiddlywiki/text-slicer/modules/slicer.js");

exports.info = {
	name: "slice",
	synchronous: false
};

var Command = function(params,commander,callback) {
	this.params = params;
	this.commander = commander;
	this.callback = callback;
};

Command.prototype.execute = function() {
	if(this.params.length < 1) {
		return "Missing parameters";
	}
	var self = this,
		wiki = this.commander.wiki,
		sourceTitle = this.params[0],
		destTitle = this.params[1],
		slicerRules = this.params[2],
		outputMode = this.params[3],
		slicer = new textSlicer.Slicer({
			sourceTiddlerTitle: sourceTitle,
			baseTiddlerTitle: destTitle,
			slicerRules: slicerRules,
			outputMode: outputMode,
			wiki: wiki,
			callback: function(err,tiddlers) {
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

})();
