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
	var self = this;
	// Save the parent dom node
	this.parentDomNode = parent;
	// Compute our attributes
	this.computeAttributes();
	// Execute our logic
	this.execute();
	// Sanitise the specified tag
	var tag = this.draggableTag;
	if($tw.config.htmlUnsafeElements.indexOf(tag) !== -1) {
		tag = "div";
	}
	// Create our element
	var domNode = this.document.createElement(tag);
	// Assign classes
	var classes = ["tc-draggable"];
	// Add event handlers
	$tw.utils.makeDraggable({
		domNode: domNode,
		dragTiddlerFn: function() {return self.getAttribute("tiddler");},
		dragFilterFn: function() {return self.getAttribute("filter");},
		startActions: self.startActions,
		endActions: self.endActions,
		widget: this
	});
	this.domNode = domNode;
	// Assign classes
	this.assignDomNodeClasses();
	// Assign styles
	this.assignDomNodeStyles();
	// Insert the link into the DOM and render any children
	parent.insertBefore(domNode,nextSibling);
	this.renderChildren(domNode,null);
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
	// Make the child widgets
	this.makeChildWidgets();
};

DraggableWidget.prototype.assignDomNodeClasses = function() {
	var classes = this.getAttribute("class","").split(" ");
	classes.push("tc-draggable");
	this.domNode.className = classes.join(" ");
};

DraggableWidget.prototype.assignDomNodeStyles = function() {
	var styles = this.getAttribute("style");
	this.domNode.style = styles;
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
DraggableWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes(),
		changedAttributesCount = $tw.utils.count(changedAttributes);
	if(changedAttributes.tag) {
		this.refreshSelf();
		return true;
	} else if(changedAttributesCount === 1 && changedAttributes["class"]) {
		this.assignDomNodeClasses();
	} else if(changedAttributesCount === 1 && changedAttributes["style"]) {
		this.assignDomNodeStyles();
	}
	return this.refreshChildren(changedTiddlers);
};

exports.draggable = DraggableWidget;

})();
