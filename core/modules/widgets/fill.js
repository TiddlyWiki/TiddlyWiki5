/*\
title: $:/core/modules/widgets/value.js
type: application/javascript
module-type: widget

Sub-widget used by the transclude widget for specifying values for slots within transcluded content. It doesn't do anything by itself because the transclude widget only ever deals with the parse tree nodes, and doesn't instantiate the widget itself

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var FillWidget = function(parseTreeNode,options) {
	// Initialise
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
FillWidget.prototype = Object.create(Widget.prototype);

/*
Render this widget into the DOM
*/
FillWidget.prototype.render = function(parent,nextSibling) {
	// Call the constructor
	Widget.call(this);
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent,nextSibling);
};

/*
Compute the internal state of the widget
*/
FillWidget.prototype.execute = function() {
	// Construct the child widgets
	this.makeChildWidgets();
};

/*
Refresh the widget by ensuring our attributes are up to date
*/
FillWidget.prototype.refresh = function(changedTiddlers) {
	return this.refreshChildren(changedTiddlers);
};

exports.fill = FillWidget;

})();
	