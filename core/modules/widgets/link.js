/*\
title: $:/core/modules/widgets/link.js
type: application/javascript
module-type: new_widget

Link widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var LinkWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
LinkWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
LinkWidget.prototype.render = function(parent,nextSibling) {
	// Save the parent dom node
	this.parentDomNode = parent;
	// Compute our attributes
	this.computeAttributes();
	// Execute our logic
	this.execute();
	// Create our element
	var domNode = this.document.createElement("a");
	this.assignAttributes(domNode);
	if(this.isShadow) {
		$tw.utils.addClass(domNode,"tw-tiddlylink-shadow");
	}
	if(this.isMissing && !this.isShadow) {
		$tw.utils.addClass(domNode,"tw-tiddlylink-missing");
	} else {
		if(!this.isMissing) {
			$tw.utils.addClass(domNode,"tw-tiddlylink-resolves");
		}
	}
	parent.insertBefore(domNode,nextSibling);
	this.renderChildren(domNode,null);
	this.domNodes.push(domNode);
};

/*
Compute the internal state of the widget
*/
LinkWidget.prototype.execute = function() {
	// Get the target tiddler title
	this.to = this.getAttribute("to",this.getVariable("tiddlerTitle"));
	// Determine the link characteristics
	this.isMissing = !this.wiki.tiddlerExists(this.to);
	this.isShadow = this.wiki.isShadowTiddler(this.to);
	// Make the child widgets
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
LinkWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.to || changedTiddlers[this.to]) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

/*
Remove any DOM nodes created by this widget or its children
*/
LinkWidget.prototype.removeChildDomNodes = function() {
	$tw.utils.each(this.domNodes,function(domNode) {
		domNode.parentNode.removeChild(domNode);
	});
	this.domNodes = [];
};

exports.link = LinkWidget;

})();
