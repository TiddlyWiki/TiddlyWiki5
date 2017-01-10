/*\
title: $:/core/modules/widgets/dropaction.js
type: application/javascript
module-type: widget
Dropzone widget
\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var DropActionWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
DropActionWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
DropActionWidget.prototype.render = function(parent,nextSibling) {
	var self = this;
	// Remember parent
	this.parentDomNode = parent;
	// Compute attributes and execute state
	this.computeAttributes();
	this.execute();
	// Create element
	var domNode = this.document.createElement("span");
	domNode.className = "tc-dropzone";
	// Add event handlers
	$tw.utils.addEventListeners(domNode,[
		{name: "dragenter", handlerObject: this, handlerMethod: "handleDragEnterEvent"},
		{name: "dragover", handlerObject: this, handlerMethod: "handleDragOverEvent"},
		{name: "dragleave", handlerObject: this, handlerMethod: "handleDragLeaveEvent"},
		{name: "drop", handlerObject: this, handlerMethod: "handleDropEvent"},
	]);
	domNode.addEventListener("click",function (event) {
	},false);
	// Insert element
	parent.insertBefore(domNode,nextSibling);
	this.renderChildren(domNode,null);
	this.domNodes.push(domNode);
};

DropActionWidget.prototype.enterDrag = function() {
	// Check for this window being the source of the drag
	if(!$tw.dragInProgress) {
		return false;
	}
	// We count enter/leave events
	this.dragEnterCount = (this.dragEnterCount || 0) + 1;
	// If we're entering for the first time we need to apply highlighting
	if(this.dragEnterCount === 1) {
		$tw.utils.addClass(this.domNodes[0],"tc-dragover");
	}
};

DropActionWidget.prototype.leaveDrag = function() {
	// Reduce the enter count
	this.dragEnterCount = (this.dragEnterCount || 0) - 1;
	// Remove highlighting if we're leaving externally
	if(this.dragEnterCount <= 0) {
		$tw.utils.removeClass(this.domNodes[0],"tc-dragover");
	}
};

DropActionWidget.prototype.handleDragEnterEvent  = function(event) {
	this.enterDrag();
	// Tell the browser that we're ready to handle the drop
	event.preventDefault();
	// Tell the browser not to ripple the drag up to any parent drop handlers
	event.stopPropagation();
};

DropActionWidget.prototype.handleDragOverEvent  = function(event) {
	// Check for being over a TEXTAREA or INPUT
	if(["TEXTAREA","INPUT"].indexOf(event.target.tagName) !== -1) {
		return false;
	}
	// Check for this window being the source of the drag
	if(!$tw.dragInProgress) {
		return false;
	}
	// Tell the browser that we're still interested in the drop
	event.preventDefault();
	event.dataTransfer.dropEffect = "copy"; // Explicitly show this is a copy
};

DropActionWidget.prototype.handleDragLeaveEvent  = function(event) {
	this.leaveDrag();
};

DropActionWidget.prototype.handleDropEvent  = function(event) {
	this.leaveDrag();
	// Check for being over a TEXTAREA or INPUT
	if(["TEXTAREA","INPUT"].indexOf(event.target.tagName) !== -1) {
		return false;
	}
	// Check for this window being the source of the drag
	if(!$tw.dragInProgress) {
		return false;
	}
	
	// Reset the enter count
	this.dragEnterCount = 0;
	
	// Remove highlighting
	$tw.utils.removeClass(this.domNodes[0],"tc-dragover");

	// Try to import the various data types we understand
	var tiddler = this.importData(event.dataTransfer);
	
	var currentTiddler = this.getVariable("currentTiddler");
	this.setVariable("currentTiddler",tiddler.title);

    this.invokeActions(this,event);
    
    this.setVariable("currentTiddler",currentTiddler);
	
	
	// Tell the browser that we handled the drop
	event.preventDefault();
	// Stop the drop ripple up to any parent handlers
	event.stopPropagation();
};

DropActionWidget.prototype.importData = function(dataTransfer) {
	// Try each provided data type in turn
	for(var t=0; t<this.importDataTypes.length; t++) {
		if(!$tw.browser.isIE || this.importDataTypes[t].IECompatible) {
			// Get the data
			var dataType = this.importDataTypes[t];
				var data = dataTransfer.getData(dataType.type);
			// Import the tiddlers in the data
			if(data !== "" && data !== null) {
				if($tw.log.IMPORT) {
					console.log("Importing data type '" + dataType.type + "', data: '" + data + "'")
				}
				var tiddlerFields = dataType.convertToFields(data);
				if(!tiddlerFields.title) {
					tiddlerFields.title = this.wiki.generateNewTitle("Untitled");
				}
				return tiddlerFields;
			}
		}
	}
};

DropActionWidget.prototype.importDataTypes = [
	{type: "text/vnd.tiddler", IECompatible: false, convertToFields: function(data) {
		return JSON.parse(data);
	}},
	{type: "URL", IECompatible: true, convertToFields: function(data) {
		// Check for tiddler data URI
		var match = decodeURIComponent(data).match(/^data\:text\/vnd\.tiddler,(.*)/i);
		if(match) {
			return JSON.parse(match[1]);
		} else {
			return { // As URL string
				text: data
			};
		}
	}},
	{type: "text/x-moz-url", IECompatible: false, convertToFields: function(data) {
		// Check for tiddler data URI
		var match = decodeURIComponent(data).match(/^data\:text\/vnd\.tiddler,(.*)/i);
		if(match) {
			return JSON.parse(match[1]);
		} else {
			return { // As URL string
				text: data
			};
		}
	}},
	{type: "text/html", IECompatible: false, convertToFields: function(data) {
		return {
			text: data
		};
	}},
	{type: "text/plain", IECompatible: false, convertToFields: function(data) {
		return {
			text: data
		};
	}},
	{type: "Text", IECompatible: true, convertToFields: function(data) {
		return {
			text: data
		};
	}},
	{type: "text/uri-list", IECompatible: false, convertToFields: function(data) {
		return {
			text: data
		};
	}}
];

/*
Compute the internal state of the widget
*/
DropActionWidget.prototype.execute = function() {
	// Make child widgets
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
DropActionWidget.prototype.refresh = function(changedTiddlers) {
	return this.refreshChildren(changedTiddlers);
};

exports.dropaction = DropActionWidget;

})();
