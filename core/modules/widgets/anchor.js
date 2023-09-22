/*\
title: $:/core/modules/widgets/anchor.js
type: application/javascript
module-type: widget

An invisible element with anchor id metadata.
\*/
var Widget = require("$:/core/modules/widgets/widget.js").widget;
var AnchorWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
	// only this widget knows target info (if the block is before this node or not), so we need to hook the focus event, and process it here, instead of in the root widget.
};
AnchorWidget.prototype = new Widget();

AnchorWidget.prototype.render = function(parent,nextSibling) {
	// Save the parent dom node
	this.parentDomNode = parent;
	// Compute our attributes
	this.computeAttributes();
	// Execute our logic
	this.execute();
	// Create an invisible DOM element with data that can be accessed from JS or CSS
	this.idNode = this.document.createElement("span");
	this.idNode.setAttribute("data-anchor-id",this.id);
	this.idNode.setAttribute("data-anchor-title",this.tiddlerTitle);
	// if the actual block is before this node, we need to add a flag to the node
	if(this.previousSibling) {
		this.idNode.setAttribute("data-anchor-previous-sibling","true");
	}
	this.idNode.className = "tc-anchor";
	parent.insertBefore(this.idNode,nextSibling);
	this.domNodes.push(this.idNode);
};

/*
Compute the internal state of the widget
*/
AnchorWidget.prototype.execute = function() {
	// Get the id from the parse tree node or manually assigned attributes
	this.id = this.getAttribute("id");
	this.tiddlerTitle = this.getVariable("currentTiddler");
	this.previousSibling = this.getAttribute("previousSibling") === "yes";
	// Make the child widgets
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
AnchorWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(($tw.utils.count(changedAttributes) > 0)) {
		this.refreshSelf();
		return true;
	} else {
		return this.refreshChildren(changedTiddlers);
	}
};

exports.anchor = AnchorWidget;
