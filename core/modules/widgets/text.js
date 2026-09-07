/*\
title: $:/core/modules/widgets/text.js
type: application/javascript
module-type: widget

Text node widget, and the plain-text widget that renders a run literally

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var TextNodeWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
TextNodeWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
TextNodeWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	// A hook returns literal runs as `plain-text` nodes, which do not re-enter it
	var parseTreeNodes = $tw.hooks.invokeHook("th-rendering-text",null,this);
	this.isReplaced = !!parseTreeNodes;
	if(parseTreeNodes) {
		this.makeChildWidgets(parseTreeNodes);
		this.renderChildren(parent,nextSibling);
		return;
	}
	this.renderText(parent,nextSibling);
};

/*
Create the DOM text node. Shared with the plain-text widget below
*/
TextNodeWidget.prototype.renderText = function(parent,nextSibling) {
	var text = this.getAttribute("text",this.parseTreeNode.text || "");
	text = text.replace(/\r/mg,"");
	var textNode = this.document.createTextNode(text);
	parent.insertBefore(textNode,nextSibling);
	this.domNodes.push(textNode);
};

/*
Compute the internal state of the widget
*/
TextNodeWidget.prototype.execute = function() {
	// Nothing to do for a text node
};

/*
Refresh the text itself. Shared with the plain-text widget below
*/
TextNodeWidget.prototype.refreshText = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.text) {
		this.refreshSelf();
		return true;
	}
	return false;
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
TextNodeWidget.prototype.refresh = function(changedTiddlers) {
	if(this.refreshText(changedTiddlers)) {
		return true;
	}
	// Asked even when the run was not replaced, because a change may mean the hook wants to
	// replace it this time
	if($tw.hooks.invokeHook("th-refreshing-text",false,this,changedTiddlers)) {
		this.refreshSelf();
		return true;
	}
	if(this.isReplaced) {
		return this.refreshChildren(changedTiddlers);
	}
	return false;
};

/*
Renders a run of text literally. A th-rendering-text hook returns these for the parts it
wants left alone, so that its own output does not re-enter it
*/
var PlainTextNodeWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

PlainTextNodeWidget.prototype = new TextNodeWidget();

PlainTextNodeWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderText(parent,nextSibling);
};

PlainTextNodeWidget.prototype.refresh = TextNodeWidget.prototype.refreshText;

exports.text = TextNodeWidget;
exports["plain-text"] = PlainTextNodeWidget;
