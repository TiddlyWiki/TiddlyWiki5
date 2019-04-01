/*\
title: $:/plugins/tiddlywiki/innerwiki/screenshot.js
type: application/javascript
module-type: command

Commands to render tiddlers identified by a filter and save any screenshots identified by <$innerwiki> widgets

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var InnerWikiWidget = require("$:/plugins/tiddlywiki/innerwiki/innerwiki.js").innerwiki;

exports.info = {
	name: "screenshot",
	synchronous: false
};

var Command = function(params,commander,callback) {
	this.params = params;
	this.commander = commander;
	this.callback = callback;
};

Command.prototype.execute = function() {
	var self = this;
	if(this.params.length < 1) {
		return "Missing filter";
	}
	var filter = this.params[0],
		deviceScaleFactor = parseInt(this.params[1],10) || 1,
		tiddlers = this.commander.wiki.filterTiddlers(filter);
	// Render each tiddler into a widget tree
	var innerWikiWidgets = [];
	$tw.utils.each(tiddlers,function(title) {
		var parser = self.commander.wiki.parseTiddler(title),
			variables = {currentTiddler: title},
			widgetNode = self.commander.wiki.makeWidget(parser,{variables: variables}),
			container = $tw.fakeDocument.createElement("div");
		widgetNode.render(container,null);
		// Find any innerwiki widgets
		Array.prototype.push.apply(innerWikiWidgets,self.findInnerWikiWidgets(widgetNode));
	});
	// Asynchronously tell each innerwiki widget to save a screenshot
	var processNextInnerWikiWidget = function() {
		if(innerWikiWidgets.length > 0) {
			var widget = innerWikiWidgets[0];
			innerWikiWidgets.shift();
			widget.saveScreenshot({
				basepath: self.commander.outputPath,
				deviceScaleFactor: deviceScaleFactor
			},function(err) {
				if(err) {
					self.callback(err);
				}
				processNextInnerWikiWidget();
			});
		} else {
			self.callback(null);
		}
	};
	processNextInnerWikiWidget();
	return null;
};

Command.prototype.findInnerWikiWidgets = function(widgetNode) {
	var self = this,
		results = [];
	if(widgetNode.saveScreenshot) {
		results.push(widgetNode)
	}
	$tw.utils.each(widgetNode.children,function(childWidget) {
		Array.prototype.push.apply(results,self.findInnerWikiWidgets(childWidget));
	});
	return results;
};

exports.Command = Command;

})();
