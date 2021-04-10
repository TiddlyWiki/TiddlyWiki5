/*\
title: $:/core/modules/widgets/dropzone.js
type: application/javascript
module-type: widget

Dropzone widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var IMPORT_TITLE = "$:/Import";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var DropZoneWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
DropZoneWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
DropZoneWidget.prototype.render = function(parent,nextSibling) {
	var self = this;
	// Remember parent
	this.parentDomNode = parent;
	// Compute attributes and execute state
	this.computeAttributes();
	this.execute();
	// Create element
	var domNode = this.document.createElement("div");
	domNode.className = this.dropzoneClass || "tc-dropzone";
	// Add event handlers
	if(this.dropzoneEnable) {
		$tw.utils.addEventListeners(domNode,[
			{name: "dragenter", handlerObject: this, handlerMethod: "handleDragEnterEvent"},
			{name: "dragover", handlerObject: this, handlerMethod: "handleDragOverEvent"},
			{name: "dragleave", handlerObject: this, handlerMethod: "handleDragLeaveEvent"},
			{name: "drop", handlerObject: this, handlerMethod: "handleDropEvent"},
			{name: "paste", handlerObject: this, handlerMethod: "handlePasteEvent"},
			{name: "dragend", handlerObject: this, handlerMethod: "handleDragEndEvent"}
		]);		
	}
	domNode.addEventListener("click",function (event) {
	},false);
	// Insert element
	parent.insertBefore(domNode,nextSibling);
	this.renderChildren(domNode,null);
	this.domNodes.push(domNode);
	// Stack of outstanding enter/leave events
	this.currentlyEntered = [];
};

DropZoneWidget.prototype.enterDrag = function(event) {
	if(this.currentlyEntered.indexOf(event.target) === -1) {
		this.currentlyEntered.push(event.target);
	}
	// If we're entering for the first time we need to apply highlighting
	$tw.utils.addClass(this.domNodes[0],"tc-dragover");
};

DropZoneWidget.prototype.leaveDrag = function(event) {
	var pos = this.currentlyEntered.indexOf(event.target);
	if(pos !== -1) {
		this.currentlyEntered.splice(pos,1);
	}
	// Remove highlighting if we're leaving externally
	if(this.currentlyEntered.length === 0) {
		$tw.utils.removeClass(this.domNodes[0],"tc-dragover");
	}
};

DropZoneWidget.prototype.handleDragEnterEvent  = function(event) {
	// Check for this window being the source of the drag
	if($tw.dragInProgress) {
		return false;
	}
	this.enterDrag(event);
	// Tell the browser that we're ready to handle the drop
	event.preventDefault();
	// Tell the browser not to ripple the drag up to any parent drop handlers
	event.stopPropagation();
};

DropZoneWidget.prototype.handleDragOverEvent  = function(event) {
	// Check for being over a TEXTAREA or INPUT
	if(["TEXTAREA","INPUT"].indexOf(event.target.tagName) !== -1) {
		return false;
	}
	// Check for this window being the source of the drag
	if($tw.dragInProgress) {
		return false;
	}
	// Tell the browser that we're still interested in the drop
	event.preventDefault();
	event.dataTransfer.dropEffect = "copy"; // Explicitly show this is a copy
};

DropZoneWidget.prototype.handleDragLeaveEvent  = function(event) {
	this.leaveDrag(event);
};

DropZoneWidget.prototype.handleDragEndEvent = function(event) {
	$tw.utils.removeClass(this.domNodes[0],"tc-dragover");
};

DropZoneWidget.prototype.filterByContentTypes = function(tiddlerFieldsArray) {
	var filteredTypes,
		filtered = [],
		types = [];
	$tw.utils.each(tiddlerFieldsArray,function(tiddlerFields) {
		types.push(tiddlerFields.type);
	});
	filteredTypes = this.wiki.filterTiddlers(this.contentTypesFilter,this,this.wiki.makeTiddlerIterator(types));
	$tw.utils.each(tiddlerFieldsArray,function(tiddlerFields) {
		if(filteredTypes.indexOf(tiddlerFields.type) !== -1) {
			filtered.push(tiddlerFields);
		}
	});
	return filtered;
};

DropZoneWidget.prototype.readFileCallback = function(tiddlerFieldsArray) {
	if(this.contentTypesFilter) {
		tiddlerFieldsArray = this.filterByContentTypes(tiddlerFieldsArray);
	}
	if(tiddlerFieldsArray.length) {
		this.dispatchEvent({type: "tm-import-tiddlers", param: JSON.stringify(tiddlerFieldsArray), autoOpenOnImport: this.autoOpenOnImport, importTitle: this.importTitle});
		if(this.actions) {
			this.invokeActionString(this.actions,this,event,{importTitle: this.importTitle});
		}
	}
};

DropZoneWidget.prototype.handleDropEvent  = function(event) {
	var self = this,
		readFileCallback = function(tiddlerFieldsArray) {
			self.readFileCallback(tiddlerFieldsArray);
		};
	this.leaveDrag(event);
	// Check for being over a TEXTAREA or INPUT
	if(["TEXTAREA","INPUT"].indexOf(event.target.tagName) !== -1) {
		return false;
	}
	// Check for this window being the source of the drag
	if($tw.dragInProgress) {
		return false;
	}
	var self = this,
		dataTransfer = event.dataTransfer;
	// Remove highlighting
	$tw.utils.removeClass(this.domNodes[0],"tc-dragover");
	// Import any files in the drop
	var numFiles = 0;
	if(dataTransfer.files) {
		numFiles = this.wiki.readFiles(dataTransfer.files,{
			callback: readFileCallback,
			deserializer: this.dropzoneDeserializer
		});
	}
	// Try to import the various data types we understand
	if(numFiles === 0) {
		$tw.utils.importDataTransfer(dataTransfer,this.wiki.generateNewTitle("Untitled"),readFileCallback);
	}
	// Tell the browser that we handled the drop
	event.preventDefault();
	// Stop the drop ripple up to any parent handlers
	event.stopPropagation();
};

DropZoneWidget.prototype.handlePasteEvent  = function(event) {
	var self = this,
		readFileCallback = function(tiddlerFieldsArray) {
			self.readFileCallback(tiddlerFieldsArray);
		};
	// Let the browser handle it if we're in a textarea or input box
	if(["TEXTAREA","INPUT"].indexOf(event.target.tagName) == -1 && !event.target.isContentEditable) {
		var self = this,
			items = event.clipboardData.items;
		// Enumerate the clipboard items
		for(var t = 0; t<items.length; t++) {
			var item = items[t];
			if(item.kind === "file") {
				// Import any files
				this.wiki.readFile(item.getAsFile(),{
					callback: readFileCallback,
					deserializer: this.dropzoneDeserializer
				});
			} else if(item.kind === "string") {
				// Create tiddlers from string items
				var type = item.type;
				item.getAsString(function(str) {
					var tiddlerFields = {
						title: self.wiki.generateNewTitle("Untitled"),
						text: str,
						type: type
					};
					if($tw.log.IMPORT) {
						console.log("Importing string '" + str + "', type: '" + type + "'");
					}
					readFileCallback([tiddlerFields]);
				});
			}
		}
		// Tell the browser that we've handled the paste
		event.stopPropagation();
		event.preventDefault();
	}
};

/*
Compute the internal state of the widget
*/
DropZoneWidget.prototype.execute = function() {
	this.dropzoneClass = this.getAttribute("class");
	this.dropzoneDeserializer = this.getAttribute("deserializer");
	this.dropzoneEnable = (this.getAttribute("enable") || "yes") === "yes";
	this.autoOpenOnImport = this.getAttribute("autoOpenOnImport");
	this.importTitle = this.getAttribute("importTitle",IMPORT_TITLE);
	this.actions = this.getAttribute("actions");
	this.contentTypesFilter = this.getAttribute("contentTypesFilter");
	// Make child widgets
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
DropZoneWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if($tw.utils.count(changedAttributes) > 0) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

exports.dropzone = DropZoneWidget;

})();
