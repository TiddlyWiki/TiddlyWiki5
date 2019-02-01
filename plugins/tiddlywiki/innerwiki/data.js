/*\
title: $:/plugins/tiddlywiki/innerwiki/data.js
type: application/javascript
module-type: widget

Widget to represent a single item of data

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var DataWidget = function(parseTreeNode,options) {
	this.dataWidgetTag = parseTreeNode.type;
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
DataWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
DataWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent,nextSibling);
};

/*
Compute the internal state of the widget
*/
DataWidget.prototype.execute = function() {
	// Construct the child widgets
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
DataWidget.prototype.refresh = function(changedTiddlers) {
	// Refresh our attributes
	var changedAttributes = this.computeAttributes();
	// Refresh our children
	return this.refreshChildren(changedTiddlers);
};

exports.data = DataWidget;
exports.anchor = DataWidget;

})();
