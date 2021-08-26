/*\
title: $:/core/modules/widgets/root-connector.js
type: application/javascript
module-type: widget

Connect directly with the root widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var RootConnectorWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
RootConnectorWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
RootConnectorWidget.prototype.render = function(parent,nextSibling) {
        this.parentWidget = $tw.rootWidget;
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent,nextSibling);
};

/*
Compute the internal state of the widget
*/
RootConnectorWidget.prototype.execute = function() {
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
RootConnectorWidget.prototype.refresh = function(changedTiddlers) {
	return this.refreshChildren(changedTiddlers);
};

exports["root-connector"] = RootConnectorWidget;

})();
