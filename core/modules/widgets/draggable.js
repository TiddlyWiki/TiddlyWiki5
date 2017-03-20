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
	if(this.draggableClasses) {
		classes.push(this.draggableClasses);
	}
	domNode.setAttribute("class",classes.join(" "));
	domNode.setAttribute("draggable","true");
	// Add event handlers
	$tw.utils.addEventListeners(domNode,[
		{name: "dragstart", handlerObject: this, handlerMethod: "handleDragStartEvent"},
		{name: "dragend", handlerObject: this, handlerMethod: "handleDragEndEvent"}
	]);
	// Insert the link into the DOM and render any children
	parent.insertBefore(domNode,nextSibling);
	this.renderChildren(domNode,null);
	this.domNodes.push(domNode);
};

DraggableWidget.prototype.handleDragStartEvent = function(event) {
	var self = this;
	// Collect the tiddlers
	var titles = [];
	if(this.draggableTiddler) {
		titles.push(this.draggableTiddler);
	}
	if(this.draggableFilter) {
		titles.push.apply(titles,this.wiki.filterTiddlers(this.draggableFilter,this));
	}
	var titleString = $tw.utils.stringifyList(titles);
	if(titles.length > 0 && event.target === this.domNodes[0]) {
		$tw.dragInProgress = this.domNodes[0];
		// Set the dragging class on the element being dragged
		$tw.utils.addClass(event.target,"tc-dragging");
		// Create the drag image elements
		this.dragImage = this.document.createElement("div");
		this.dragImage.className = "tc-tiddler-dragger";
		var inner = this.document.createElement("div");
		inner.className = "tc-tiddler-dragger-inner";
		inner.appendChild(this.document.createTextNode(
			titles.length === 1 ? 
				titles[0] :
				titles.length + " tiddlers"
		));
		this.dragImage.appendChild(inner);
		this.document.body.appendChild(this.dragImage);
		// Set the data transfer properties
		var dataTransfer = event.dataTransfer;
		// Set up the image
		dataTransfer.effectAllowed = "copy";
		if(dataTransfer.setDragImage) {
			dataTransfer.setDragImage(this.dragImage.firstChild,-16,-16);
		}
		// Set up the data transfer
		dataTransfer.clearData();
		var jsonData = [];
		if(titles.length > 1) {
			titles.forEach(function(title) {
				jsonData.push(self.wiki.getTiddlerAsJson(title));
			});
			jsonData = "[" + jsonData.join(",") + "]";
		} else {
			jsonData = this.wiki.getTiddlerAsJson(titles[0]);
		}
		// IE doesn't like these content types
		if(!$tw.browser.isIE) {
			dataTransfer.setData("text/vnd.tiddler",jsonData);
			dataTransfer.setData("text/plain",titleString);
			dataTransfer.setData("text/x-moz-url","data:text/vnd.tiddler," + encodeURIComponent(jsonData));
		}
		dataTransfer.setData("URL","data:text/vnd.tiddler," + encodeURIComponent(jsonData));
		dataTransfer.setData("Text",titleString);
		event.stopPropagation();
	} else {
		event.preventDefault();
	}
};

DraggableWidget.prototype.handleDragEndEvent = function(event) {
	if(event.target === this.domNodes[0]) {
		$tw.dragInProgress = null;
		// Remove the dragging class on the element being dragged
		$tw.utils.removeClass(event.target,"tc-dragging");
		// Delete the drag image element
		if(this.dragImage) {
			this.dragImage.parentNode.removeChild(this.dragImage);
		}
	}
};

/*
Compute the internal state of the widget
*/
DraggableWidget.prototype.execute = function() {
	// Pick up our attributes
	this.draggableTiddler = this.getAttribute("tiddler");
	this.draggableFilter = this.getAttribute("filter");
	this.draggableTag = this.getAttribute("tag","div");
	this.draggableClasses = this.getAttribute("class");
	// Make the child widgets
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
DraggableWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.tiddler || changedTiddlers.tag || changedTiddlers["class"]) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

exports.draggable = DraggableWidget;

})();
