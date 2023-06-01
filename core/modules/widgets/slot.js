/*\
title: $:/core/modules/widgets/slot.js
type: application/javascript
module-type: widget

Widget for definition of slots within transcluded content. The values provided by the translusion are passed to the slot.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget,
	TranscludeWidget = require("$:/core/modules/widgets/transclude.js").transclude;

var SlotWidget = function(parseTreeNode,options) {
	// Initialise
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
SlotWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
SlotWidget.prototype.render = function(parent,nextSibling) {
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
SlotWidget.prototype.execute = function() {
	var self = this;
	this.slotName = this.getAttribute("$name");
	this.slotDepth = parseInt(this.getAttribute("$depth","1"),10) || 1;
	// Find the parent transclusions
	var pointer = this.parentWidget,
		depth = this.slotDepth;
	while(pointer) {
		if(pointer instanceof TranscludeWidget && pointer.hasVisibleSlots()) {
			depth--;
			if(depth <= 0) {
				break;
			}
		}
		pointer = pointer.parentWidget;
	}
	var parseTreeNodes = [{type: "text", attributes: {text: {type: "string", value: "Missing slot reference!"}}}];
	if(pointer instanceof TranscludeWidget) {
		// Get the parse tree nodes comprising the slot contents
		parseTreeNodes = pointer.getTransclusionSlotFill(this.slotName,this.parseTreeNode.children);
	}
	// Construct the child widgets
	this.makeChildWidgets(parseTreeNodes);
};

/*
Refresh the widget by ensuring our attributes are up to date
*/
SlotWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes["$name"] || changedAttributes["$depth"]) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

exports.slot = SlotWidget;

})();
