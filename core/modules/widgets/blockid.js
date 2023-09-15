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
	$tw.hooks.removeHook("th-focus-selector",this.hookFocusElementEvent);
	this.hookFocusElementEvent = this.hookFocusElementEvent.bind(this);
	$tw.hooks.addHook("th-focus-selector",this.hookFocusElementEvent);
	// Create an invisible DOM element with data that can be accessed from JS or CSS
	this.spanDomNode = this.document.createElement("span");
	this.spanDomNode.id = this.id;
	this.spanDomNode.setAttribute("data-block-id",this.id);
	if(this.before) {
		this.spanDomNode.setAttribute("data-before","true");
	}
	this.spanDomNode.className = "tc-block-id";
	parent.insertBefore(this.spanDomNode,nextSibling);
	this.domNodes.push(this.spanDomNode);
};

BlockIdWidget.prototype.hookFocusElementEvent = function(event) {
	if(!event.param) return event;
	var id = event.param.replace('#','');
	if(id !== this.id) return event;
	var selector = event.param || "",
			element,
			baseElement = event.event && event.event.target ? event.event.target.ownerDocument : document;
	element = $tw.utils.querySelectorSafe(selector,baseElement) || this.spanDomNode;
	if(!element.parentNode) return;
	element = element.parentNode;
	// need to check if the block is before this node
	if(this.previousSibling && element.previousSibling) {
		element = element.previousSibling;
	}
	element.focus({ focusVisible: true });
	// toggle class to trigger highlight animation
	$tw.utils.removeClass(element,"tc-focus-highlight");
	// Using setTimeout to ensure the removal takes effect before adding the class again.
	setTimeout(function() {
		$tw.utils.addClass(element,"tc-focus-highlight");
	}, 50);
	return false;
};

BlockIdWidget.prototype.removeChildDomNodes = function() {
	$tw.hooks.removeHook("th-focus-selector",this.hookFocusElementEvent);
};

/*
Compute the internal state of the widget
*/
BlockIdWidget.prototype.execute = function() {
	// Get the id from the parse tree node or manually assigned attributes
	this.id = this.getAttribute("id");
	this.previousSibling = this.getAttribute("previousSibling");
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
