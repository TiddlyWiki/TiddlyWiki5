/*\
title: $:/$:/plugins/tiddlywiki/internals/widgets/parse-tree.js
type: application/javascript
module-type: widget

Widget to render the parse tree of a tiddler

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var ParseTreeWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
ParseTreeWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
ParseTreeWidget.prototype.render = function(parent,nextSibling) {
	var self = this;
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent,nextSibling);
};

/*
Compute the internal state of the widget
*/
ParseTreeWidget.prototype.execute = function() {
	// Get our parameters
	this.parseTreeTitle = this.getAttribute("tiddler",this.getVariable("currentTiddler"));
	this.parseTreeInlineMode = this.getAttribute("mode","block") === "inline";
	// Compute the parse tree
	var parser = this.wiki.parseTiddler(this.parseTreeTitle,{parseAsInline: this.parseTreeInlineMode}),
		parseTreeNodes = [];
	if(parser) {
		parseTreeNodes = [{
			type: "codeblock",
			attributes: {
				code: {type: "string", value: JSON.stringify(parser.tree,0,$tw.config.preferences.jsonSpaces)},
				language: {type: "string", value: "json"}
			}
		}];
	}
	// Make the child widgets
	this.makeChildWidgets(parseTreeNodes);
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
ParseTreeWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	// Completely rerender if any of our attributes have changed
	if(changedAttributes.tiddler || changedAttributes.mode || changedTiddlers[this.parseTreeTitle]) {
		this.refreshSelf();
		return true;
	}
	return false;
};

exports["parse-tree"] = ParseTreeWidget;

})();
