/*\
title: $:/core/modules/new_widgets/macrodef.js
type: application/javascript
module-type: new_widget

Macro definition widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/new_widgets/widget.js").widget;

var MacroDefWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
MacroDefWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
MacroDefWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent,nextSibling);
};

/*
Compute the internal state of the widget
*/
MacroDefWidget.prototype.execute = function() {
	// Set macro definition
	this.setVariable(this.parseTreeNode.name,this.parseTreeNode.text,this.parseTreeNode.params);
	// Construct the child widgets
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
MacroDefWidget.prototype.refresh = function(changedTiddlers) {
	return this.refreshChildren(changedTiddlers);
};

exports.macrodef = MacroDefWidget;

})();
