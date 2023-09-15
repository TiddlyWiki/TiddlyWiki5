/*\
title: $:/core/modules/widgets/blockid.js
type: application/javascript
module-type: widget

An invisible element with block id metadata.
\*/
var Widget = require("$:/core/modules/widgets/widget.js").widget;
var BlockIdWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};
BlockIdWidget.prototype = new Widget();

BlockIdWidget.prototype.render = function(parent,nextSibling) {
	// Save the parent dom node
	this.parentDomNode = parent;
	// Compute our attributes
	this.computeAttributes();
	// Execute our logic
	this.execute();
	// Create an invisible DOM element with data that can be accessed from JS or CSS
	this.spanDomNode = this.document.createElement("span");
	this.spanDomNode.setAttribute("data-id",this.id);
	this.spanDomNode.className = "tc-block-id";
	parent.insertBefore(this.spanDomNode,nextSibling);
	this.domNodes.push(this.spanDomNode);
};

/*
Compute the internal state of the widget
*/
BlockIdWidget.prototype.execute = function() {
	// Get the id from the parse tree node or manually assigned attributes
	this.id = this.getAttribute("id");
	// Make the child widgets
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
BlockIdWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(($tw.utils.count(changedAttributes) > 0)) {
		this.refreshSelf();
		return true;
	} else {
		return this.refreshChildren(changedTiddlers);
	}
};

exports.blockid = BlockIdWidget;
