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
	UberTranscludeWidget = require("$:/core/modules/widgets/ubertransclude.js").ubertransclude;

var SlotWidget = function(parseTreeNode,options) {
	// Initialise
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
SlotWidget.prototype = Object.create(Widget.prototype);

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
	// Find the parent transclusion
	var transclusionWidget = this.parentWidget;
	while(transclusionWidget && !(transclusionWidget instanceof UberTranscludeWidget)) {
		transclusionWidget = transclusionWidget.parentWidget;
	}
	// Get the parse tree nodes comprising the slot contents
	var parseTreeNodes = transclusionWidget.getTransclusionSlotValue(this.slotName,this.parseTreeNode.children);
	// Construct the child widgets
	this.makeChildWidgets(parseTreeNodes);
};

/*
Refresh the widget by ensuring our attributes are up to date
*/
SlotWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes["$name"]) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

exports.slot = SlotWidget;

})();
