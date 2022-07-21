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
	if(!this.dragHandleSelector && this.dragEnable) {
		classes.push("tc-draggable");
	}
	domNode.setAttribute("class",classes.join(" "));
	// Insert the node into the DOM and render any children
	parent.insertBefore(domNode,nextSibling);
	this.renderChildren(domNode,null);
	// Add event handlers
	if(this.dragEnable) {
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
	}
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
	this.dragEnable = this.getAttribute("enable","yes") === "yes";
	// Make the child widgets
	this.makeChildWidgets();
};


DraggableWidget.prototype.updateDomNodeClasses = function() {
	var domNodeClasses = this.domNodes[0].className.split(" "),
		oldClasses = this.draggableClasses.split(" ");
	this.draggableClasses = this.getAttribute("class");
	//Remove classes assigned from the old value of class attribute
	$tw.utils.each(oldClasses,function(oldClass){
		var i = domNodeClasses.indexOf(oldClass);
		if(i !== -1) {
			domNodeClasses.splice(i,1);
		}
	});
	//Add new classes from updated class attribute.
	$tw.utils.pushTop(domNodeClasses,this.draggableClasses);
	this.domNodes[0].setAttribute("class",domNodeClasses.join(" "))
}

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
DraggableWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes(),
		changedAttributesCount = $tw.utils.count(changedAttributes);
	if(changedAttributesCount === 1 && changedAttributes["class"]) {
		this.updateDomNodeClasses();
	} else if(changedAttributesCount > 0) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

exports.draggable = DraggableWidget;

})();