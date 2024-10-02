/*\
title: $:/core/modules/widgets/block-mark.js
type: application/javascript
module-type: widget

An invisible element with block-mark id metadata.
\*/
var Widget = require("$:/core/modules/widgets/widget.js").widget;
var BlockMarkWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
	// only this widget knows target info (if the block is before this node or not), so we need to hook the focus event, and process it here, instead of in the root widget.
};
BlockMarkWidget.prototype = new Widget();

BlockMarkWidget.prototype.render = function(parent,nextSibling) {
	// Save the parent dom node
	this.parentDomNode = parent;
	// Compute our attributes
	this.computeAttributes();
	// Execute our logic
	this.execute();
	// Create an invisible DOM element with data that can be accessed from JS or CSS
	this.idNode = this.document.createElement("span");
	this.idNode.setAttribute("data-block-mark-id",this.blockMarkId);
	this.idNode.setAttribute("data-block-mark-title",this.tiddlerTitle);
	// if the actual block is before this node, we need to add a flag to the node
	if(this.previousSibling) {
		this.idNode.setAttribute("data-block-mark-previous-sibling","true");
	}
	this.idNode.className = "tc-block-mark";
	parent.insertBefore(this.idNode,nextSibling);
	this.domNodes.push(this.idNode);
};

/*
Compute the internal state of the widget
*/
BlockMarkWidget.prototype.execute = function() {
	// Get the id from the parse tree node or manually assigned attributes
	this.blockMarkId = this.getAttribute("id");
	this.tiddlerTitle = this.getVariable("currentTiddler");
	this.previousSibling = this.getAttribute("previousSibling") === "yes";
	// Make the child widgets
	this.makeChildWidgets();
};

/*
Find the DOM node pointed by this block mark
*/
Widget.prototype.findBlockMarkTargetDomNode = function() {
	if(!this.idNode) {
		return null;
	}
	// the actual block is always at the parent level
	targetElement = this.idNode.parentNode;
	// need to check if the block is before this node
	if(this.previousSibling) {
		targetElement = targetElement.previousSibling;
	}
	return targetElement;
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
BlockMarkWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(($tw.utils.count(changedAttributes) > 0)) {
		this.refreshSelf();
		return true;
	} else {
		return this.refreshChildren(changedTiddlers);
	}
};

exports["block-mark"] = BlockMarkWidget;
