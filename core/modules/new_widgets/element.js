/*\
title: $:/core/modules/new_widgets/element.js
type: application/javascript
module-type: new_widget

Element widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/new_widgets/widget.js").widget;

var ElementWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
ElementWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
ElementWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	var domNode = this.document.createElement(this.parseTreeNode.tag);
	this.assignAttributes(domNode);
	parent.insertBefore(domNode,nextSibling);
	this.renderChildren(domNode,null);
	this.domNodes.push(domNode);
};

/*
Compute the internal state of the widget
*/
ElementWidget.prototype.execute = function() {
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
ElementWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes(),
		hasChangedAttributes = $tw.utils.count(changedAttributes) > 0;
	if(hasChangedAttributes) {
		// Update our attributes
		this.assignAttributes(this.domNodes[0]);
	}
	var hasRefreshed = this.refreshChildren(changedTiddlers);
	return hasRefreshed || hasChangedAttributes;
};

/*
Remove any DOM nodes created by this widget or its children
*/
ElementWidget.prototype.removeChildDomNodes = function() {
	$tw.utils.each(this.domNodes,function(domNode) {
		domNode.parentNode.removeChild(domNode);
	});
	this.domNodes = [];
};

exports.element = ElementWidget;

})();
