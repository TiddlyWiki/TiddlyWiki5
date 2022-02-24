/*\
title: $:/core/modules/widgets/draggable.js
type: application/javascript
module-type: widget

Draggable widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var DraggableWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
DraggableWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
DraggableWidget.prototype.render = function(parent,nextSibling) {
	var self = this,
		tag,
		domNode,
		classes = [];
	// Save the parent dom node
	this.parentDomNode = parent;
	// Compute our attributes
	this.computeAttributes();
	// Execute our logic
	this.execute();
	// Sanitise the specified tag
	tag = this.draggableTag;
	if($tw.config.htmlUnsafeElements.indexOf(tag) !== -1) {
		tag = "div";
	}
	// Create our element
	domNode = this.document.createElement(tag);
	// Assign classes
	if(this.draggableClasses) {
		classes.push(this.draggableClasses);
	}
	if(!this.dragHandleSelector) {
		classes.push("tc-draggable");
	}
	domNode.setAttribute("class",classes.join(" "));
	// Insert the node into the DOM and render any children
	parent.insertBefore(domNode,nextSibling);
	this.renderChildren(domNode,null);
	// Add event handlers
	$tw.utils.makeDraggable({
		domNode: domNode,
		dragTiddlerFn: function() {return self.getAttribute("tiddler");},
		dragFilterFn: function() {return self.getAttribute("filter");},
		startActions: self.startActions,
		endActions: self.endActions,
		dragImageType: self.dragImageType,
		widget: this,
		selector: self.dragHandleSelector
	});
	this.domNodes.push(domNode);
};

/*
Compute the internal state of the widget
*/
DraggableWidget.prototype.execute = function() {
	// Pick up our attributes
	this.draggableTag = this.getAttribute("tag","div");
	this.draggableClasses = this.getAttribute("class");
	this.startActions = this.getAttribute("startactions");
	this.endActions = this.getAttribute("endactions");
	this.dragImageType = this.getAttribute("dragimagetype");
	this.dragHandleSelector = this.getAttribute("selector");
	// Make the child widgets
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
DraggableWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.tag || changedAttributes["class"]) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

exports.draggable = DraggableWidget;

})();
