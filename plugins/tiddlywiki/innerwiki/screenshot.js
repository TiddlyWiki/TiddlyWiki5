/*\
title: $:/plugins/tiddlywiki/innerwiki/screenshot.js
type: application/javascript
module-type: command

Commands to render tiddlers identified by a filter and save any screenshots identified by <$innerwiki> widgets

\*/

"use strict";

const InnerWikiWidget = require("$:/plugins/tiddlywiki/innerwiki/innerwiki.js").innerwiki;

exports.info = {
	name: "screenshot",
	synchronous: false
};

const Command = function(params,commander,callback) {
	this.params = params;
	this.commander = commander;
	this.callback = callback;
};

Command.prototype.execute = function() {
	const self = this;
	if(this.params.length < 1) {
		return "Missing filter";
	}
	const filter = this.params[0];
	const deviceScaleFactor = parseInt(this.params[1],10) || 1;
	const tiddlers = this.commander.wiki.filterTiddlers(filter);
	// Render each tiddler into a widget tree
	const innerWikiWidgets = [];
	$tw.utils.each(tiddlers,(title) => {
		const parser = self.commander.wiki.parseTiddler(title);
		const variables = {currentTiddler: title};
		const widgetNode = self.commander.wiki.makeWidget(parser,{variables});
		const container = $tw.fakeDocument.createElement("div");
		widgetNode.render(container,null);
		// Find any innerwiki widgets
		Array.prototype.push.apply(innerWikiWidgets,self.findInnerWikiWidgets(widgetNode));
	});
	// Asynchronously tell each innerwiki widget to save a screenshot
	const processNextInnerWikiWidget = function() {
		if(innerWikiWidgets.length > 0) {
			const widget = innerWikiWidgets[0];
			innerWikiWidgets.shift();
			widget.saveScreenshot({
				basepath: self.commander.outputPath,
				deviceScaleFactor
			},(err) => {
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
	const self = this;
	const results = [];
	if(widgetNode.saveScreenshot) {
		results.push(widgetNode);
	}
	$tw.utils.each(widgetNode.children,(childWidget) => {
		Array.prototype.push.apply(results,self.findInnerWikiWidgets(childWidget));
	});
	return results;
};

exports.Command = Command;
