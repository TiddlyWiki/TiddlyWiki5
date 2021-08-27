/*\
title: $:/core/modules/widgets/focus.js
type: application/javascript
module-type: widget

Focus widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var FocusWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
FocusWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
FocusWidget.prototype.render = function(parent,nextSibling) {
	var self = this;
	// Remember parent
	this.parentDomNode = parent;
	// Compute attributes and execute state
	this.computeAttributes();
	this.execute();
	var tag = this.parseTreeNode.isBlock ? "div" : "span";
	if(this.tag && $tw.config.htmlUnsafeElements.indexOf(this.tag) === -1) {
		tag = this.tag;
	}
	// Create element
	var domNode = this.document.createElement(tag);
	if(this.tabIndex) {
		domNode.setAttribute("tabindex",this.tabIndex);
	}
	// Assign classes
	this.domNode = domNode;
	this.assignDomNodeClasses();
	// Insert element
	parent.insertBefore(domNode,nextSibling);
	this.renderChildren(domNode,null);
	this.domNodes.push(domNode);
	domNode.focus();
};

/*
Compute the internal state of the widget
*/
FocusWidget.prototype.execute = function() {
	// Get attributes
	this.tag = this.getAttribute("tag","");
	this.tabIndex = this.getAttribute("tabindex","1");
	// Make child widgets
	this.makeChildWidgets();
};

FocusWidget.prototype.assignDomNodeClasses = function() {
	var classes = this.getAttribute("class","").split(" ");
	classes.push("tc-focus");
	this.domNode.className = classes.join(" ");
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
FocusWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.tag || changedAttributes.tabindex) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

exports.focus = FocusWidget;

})();