/*\
title: $:/core/modules/widgets/dropzone.js
type: application/javascript
module-type: widget

Dropzone widget

This is an improved version with more robust drag enter/leave tracking,
designed to work reliably with flexbox and other modern CSS layouts.

Key improvements:
- Counter-based enter/leave tracking instead of element array tracking
- Timeout-based fallback to reset state if drag events stop unexpectedly
- Better handling of edge cases (DOM changes, rapid events, gaps in layouts)
- Defensive checks for detached nodes and window focus changes
- Support for filePathPrefix to create _canonical_uri references

\*/

"use strict";

var IMPORT_TITLE = "$:/Import";
var DRAG_TIMEOUT_MS = 100; // Timeout for fallback drag state reset

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var DropZoneWidget = function(parseTreeNode, options) {
	this.initialise(parseTreeNode, options);
};

/*
Inherit from the base widget class
*/
DropZoneWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
DropZoneWidget.prototype.render = function(parent, nextSibling) {
	var self = this;
	// Remember parent
	this.parentDomNode = parent;
	// Compute attributes and execute state
	this.computeAttributes();
	this.execute();
	// Create element
	var domNode = this.document.createElement("div");
	this.domNode = domNode;
	domNode.className = this.dropzoneClass || "tc-dropzone";
	// Set tabindex if specified
	if(this.dropzoneTabindex !== undefined) {
		domNode.setAttribute("tabindex", this.dropzoneTabindex);
	}
	// Add event handlers
	if(this.dropzoneEnable) {
		$tw.utils.addEventListeners(domNode, [
			{name: "dragenter", handlerObject: this, handlerMethod: "handleDragEnterEvent"},
			{name: "dragover", handlerObject: this, handlerMethod: "handleDragOverEvent"},
			{name: "dragleave", handlerObject: this, handlerMethod: "handleDragLeaveEvent"},
			{name: "drop", handlerObject: this, handlerMethod: "handleDropEvent"},
			{name: "paste", handlerObject: this, handlerMethod: "handlePasteEvent"},
			{name: "dragend", handlerObject: this, handlerMethod: "handleDragEndEvent"}
		]);
	}
	// Insert element
	parent.insertBefore(domNode, nextSibling);
	this.renderChildren(domNode, null);
	this.domNodes.push(domNode);
	// Initialize drag tracking state
	this.dragEnterCount = 0;
	this.dragInProgress = false;
	this.dragTimeoutId = null;
};

/*
Handler for transient event listeners added when the dropzone has an active drag in progress
*/
DropZoneWidget.prototype.handleEvent = function(event) {
	if(event.type === "click") {
		if(this.dragInProgress) {
			this.resetState();
		}
	} else if(event.type === "dragenter") {
		// If drag enters an element outside our dropzone, reset
		if(event.target && event.target !== this.domNode && !this.isDescendantOf(event.target, this.domNode)) {
			this.resetState();
		}
	} else if(event.type === "dragleave") {
		// Check if drag left the window
		if(event.relatedTarget === null) {
			// Additional check: is the mouse actually outside the viewport?
			if(this.isEventOutsideViewport(event)) {
				this.resetState();
			}
		} else if(event.relatedTarget && event.relatedTarget.nodeName === "HTML") {
			this.resetState();
		}
	} else if(event.type === "blur") {
		// Window lost focus during drag - reset state
		this.resetState();
	}
};

/*
Check if an element is a descendant of another element
Safer than $tw.utils.domContains for detached nodes
*/
DropZoneWidget.prototype.isDescendantOf = function(element, ancestor) {
	if(!element || !ancestor) {
		return false;
	}
	try {
		var node = element.parentNode;
		while(node) {
			if(node === ancestor) {
				return true;
			}
			node = node.parentNode;
		}
	} catch(e) {
		// Handle case where node is detached or inaccessible
		return false;
	}
	return false;
};

/*
Check if a drag event appears to be outside the viewport
*/
DropZoneWidget.prototype.isEventOutsideViewport = function(event) {
	return event.clientX <= 0 || event.clientY <= 0 ||
		event.clientX >= this.document.documentElement.clientWidth ||
		event.clientY >= this.document.documentElement.clientHeight;
};

/*
Reset the state of the dropzone after a drag has ended
*/
DropZoneWidget.prototype.resetState = function() {
	this.clearDragTimeout();
	$tw.utils.removeClass(this.domNode, "tc-dragover");
	this.dragEnterCount = 0;
	this.removeGlobalListeners();
	this.dragInProgress = false;
};

/*
Add global event listeners for tracking drag state
*/
DropZoneWidget.prototype.addGlobalListeners = function() {
	if(!this.globalListenersAdded) {
		this.document.body.addEventListener("click", this, true);
		this.document.body.addEventListener("dragenter", this, true);
		this.document.body.addEventListener("dragleave", this, true);
		// Track window blur to reset state when window loses focus
		this.window = this.document.defaultView || this.document.parentWindow;
		if(this.window) {
			this.window.addEventListener("blur", this, false);
		}
		this.globalListenersAdded = true;
	}
};

/*
Remove global event listeners
*/
DropZoneWidget.prototype.removeGlobalListeners = function() {
	if(this.globalListenersAdded) {
		this.document.body.removeEventListener("click", this, true);
		this.document.body.removeEventListener("dragenter", this, true);
		this.document.body.removeEventListener("dragleave", this, true);
		if(this.window) {
			this.window.removeEventListener("blur", this, false);
		}
		this.globalListenersAdded = false;
	}
};

/*
Set a timeout to reset drag state if no events occur
This handles cases where dragleave events are missed (e.g., due to DOM changes)
*/
DropZoneWidget.prototype.setDragTimeout = function() {
	var self = this;
	this.clearDragTimeout();
	this.dragTimeoutId = setTimeout(function() {
		// Only reset if we still think a drag is in progress
		// This gives the browser a chance to fire proper events
		if(self.dragInProgress && self.dragEnterCount <= 0) {
			self.resetState();
		}
	}, DRAG_TIMEOUT_MS);
};

/*
Clear the drag timeout
*/
DropZoneWidget.prototype.clearDragTimeout = function() {
	if(this.dragTimeoutId) {
		clearTimeout(this.dragTimeoutId);
		this.dragTimeoutId = null;
	}
};

/*
Handle entering the dropzone
Uses a counter instead of tracking individual elements
*/
DropZoneWidget.prototype.enterDrag = function(event) {
	this.dragEnterCount++;
	this.clearDragTimeout();
	
	if(!this.dragInProgress) {
		this.dragInProgress = true;
		$tw.utils.addClass(this.domNodes[0], "tc-dragover");
		this.addGlobalListeners();
	}
};

/*
Handle leaving the dropzone
*/
DropZoneWidget.prototype.leaveDrag = function(event) {
	this.dragEnterCount--;
	
	// Ensure counter doesn't go negative (defensive)
	if(this.dragEnterCount < 0) {
		this.dragEnterCount = 0;
	}
	
	if(this.dragEnterCount === 0) {
		// Use timeout to handle rapid enter/leave sequences
		// This prevents flickering when moving between elements
		this.setDragTimeout();
	}
};

DropZoneWidget.prototype.handleDragEnterEvent = function(event) {
	// Ignore if internal TiddlyWiki drag is in progress
	if($tw.dragInProgress) {
		return false;
	}
	// Optionally filter to files only
	if(this.filesOnly && !$tw.utils.dragEventContainsFiles(event)) {
		return false;
	}
	this.enterDrag(event);
	// Tell the browser that we're ready to handle the drop
	event.preventDefault();
	// Tell the browser not to ripple the drag up to any parent drop handlers
	event.stopPropagation();
};

DropZoneWidget.prototype.handleDragOverEvent = function(event) {
	// Check for being over a TEXTAREA or INPUT
	if(["TEXTAREA", "INPUT"].indexOf(event.target.tagName) !== -1) {
		return false;
	}
	// Check for this window being the source of the drag
	if($tw.dragInProgress) {
		return false;
	}
	// Reset the timeout since we're still receiving events
	this.clearDragTimeout();
	// Tell the browser that we're still interested in the drop
	event.preventDefault();
	// Check if this is a synthetic event
	// IE does not allow accessing dropEffect outside of original event handler
	if(event.isTrusted) {
		event.dataTransfer.dropEffect = "copy";
	}
};

DropZoneWidget.prototype.handleDragLeaveEvent = function(event) {
	this.leaveDrag(event);
};

DropZoneWidget.prototype.handleDragEndEvent = function(event) {
	this.resetState();
};

DropZoneWidget.prototype.filterByContentTypes = function(tiddlerFieldsArray) {
	var self = this,
		filteredTypes,
		filtered = [],
		types = [];
	$tw.utils.each(tiddlerFieldsArray, function(tiddlerFields) {
		types.push(tiddlerFields.type || "");
	});
	filteredTypes = this.wiki.filterTiddlers(this.contentTypesFilter, this, this.wiki.makeTiddlerIterator(types));
	$tw.utils.each(tiddlerFieldsArray, function(tiddlerFields) {
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
		this.dispatchEvent({
			type: "tm-import-tiddlers",
			param: JSON.stringify(tiddlerFieldsArray),
			autoOpenOnImport: this.autoOpenOnImport,
			importTitle: this.importTitle
		});
		if(this.actions) {
			this.invokeActionString(this.actions, this, event, {importTitle: this.importTitle});
		}
	}
};

/*
Get the content type for a file based on its extension or MIME type
Returns the type string suitable for TiddlyWiki
*/
DropZoneWidget.prototype.getContentTypeForFile = function(file) {
	var type = file.type;
	// If browser didn't provide a type, try to determine from extension
	if(!type) {
		var extension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
		var typeInfo = $tw.config.fileExtensionInfo[extension];
		if(typeInfo) {
			type = typeInfo.type;
		}
	}
	return type || "application/octet-stream";
};

/*
Create canonical URI tiddlers from dropped files
*/
DropZoneWidget.prototype.createCanonicalUriTiddlers = function(files) {
	var self = this;
	var tiddlerFieldsArray = [];
	
	$tw.utils.each(files, function(file) {
		var type = self.getContentTypeForFile(file);
		var filename = file.name;
		var title = filename;
		
		// Remove extension from title for cleaner names
		var lastDot = title.lastIndexOf(".");
		if(lastDot > 0) {
			title = title.substring(0, lastDot);
		}
		
		// Generate unique title
		title = self.wiki.generateNewTitle(title);
		
		// Build the canonical URI
		var canonicalUri = self.filePathPrefix;
		// Ensure proper path separator
		if(canonicalUri && !canonicalUri.endsWith("/") && !canonicalUri.endsWith("\\")) {
			canonicalUri += "/";
		}
		canonicalUri += filename;
		
		var tiddlerFields = {
			title: title,
			type: type,
			_canonical_uri: canonicalUri
		};
		
		if($tw.log.IMPORT) {
			console.log("Creating canonical URI tiddler:", title, "->", canonicalUri, "type:", type);
		}
		
		tiddlerFieldsArray.push(tiddlerFields);
	});
	
	return tiddlerFieldsArray;
};

DropZoneWidget.prototype.handleDropEvent = function(event) {
	var self = this,
		readFileCallback = function(tiddlerFieldsArray) {
			self.readFileCallback(tiddlerFieldsArray);
		};
	
	// Immediately reset drag state on drop
	this.resetState();
	
	// Check for being over a TEXTAREA or INPUT
	if(["TEXTAREA", "INPUT"].indexOf(event.target.tagName) !== -1) {
		return false;
	}
	// Check for this window being the source of the drag
	if($tw.dragInProgress) {
		return false;
	}
	
	var dataTransfer = event.dataTransfer;
	
	// Import any files in the drop
	var numFiles = 0;
	// If we have type text/vnd.tiddlywiki then skip trying to import files
	if(dataTransfer.files && !$tw.utils.dragEventContainsType(event, "text/vnd.tiddler")) {
		// Check if we should create canonical URI references instead of importing
		if(this.filePathPrefix) {
			var tiddlerFieldsArray = this.createCanonicalUriTiddlers(dataTransfer.files);
			if(tiddlerFieldsArray.length > 0) {
				readFileCallback(tiddlerFieldsArray);
				numFiles = dataTransfer.files.length;
			}
		} else {
			// Normal file import behavior
			numFiles = this.wiki.readFiles(dataTransfer.files, {
				callback: readFileCallback,
				deserializer: this.dropzoneDeserializer
			});
		}
	}
	// Try to import the various data types we understand
	if(numFiles === 0) {
		var fallbackTitle = self.wiki.generateNewTitle("Untitled");
		// Use the deserializer specified if any
		if(this.dropzoneDeserializer) {
			for(var t = 0; t < dataTransfer.items.length; t++) {
				var item = dataTransfer.items[t];
				if(item.kind === "string") {
					item.getAsString(function(str) {
						var tiddlerFields = self.wiki.deserializeTiddlers(null, str, {title: fallbackTitle}, {deserializer: self.dropzoneDeserializer});
						if(tiddlerFields && tiddlerFields.length) {
							readFileCallback(tiddlerFields);
						}
					});
				}
			}
		} else {
			$tw.utils.importDataTransfer(dataTransfer, fallbackTitle, readFileCallback);
		}
	}
	// Tell the browser that we handled the drop
	event.preventDefault();
	// Stop the drop ripple up to any parent handlers
	event.stopPropagation();
};

DropZoneWidget.prototype.handlePasteEvent = function(event) {
	var self = this;
	var readFileCallback = function(tiddlerFieldsArray) {
		self.readFileCallback(tiddlerFieldsArray);
	};
	var getItem = function(type) {
		type = type || "text/plain";
		return function(str) {
			var tiddlerFields;
			// Use the deserializer specified if any
			if(self.dropzoneDeserializer) {
				tiddlerFields = self.wiki.deserializeTiddlers(null, str, {title: self.wiki.generateNewTitle("Untitled " + type)}, {deserializer: self.dropzoneDeserializer});
				if(tiddlerFields && tiddlerFields.length) {
					readFileCallback(tiddlerFields);
				}
			} else {
				tiddlerFields = {
					title: self.wiki.generateNewTitle("Untitled " + type),
					text: str,
					type: type
				};
				if($tw.log.IMPORT) {
					console.log("Importing string '" + str + "', type: '" + type + "'");
				}
				readFileCallback([tiddlerFields]);
			}
		};
	};
	// Let the browser handle it if we're in a textarea or input box
	if(["TEXTAREA", "INPUT"].indexOf(event.target.tagName) === -1 && !event.target.isContentEditable && !event.twEditor) {
		var items = event.clipboardData.items;
		// Enumerate the clipboard items
		for(var t = 0; t < items.length; t++) {
			var item = items[t];
			if(item.kind === "file") {
				// Check if we should create canonical URI references
				if(this.filePathPrefix) {
					var file = item.getAsFile();
					var tiddlerFieldsArray = this.createCanonicalUriTiddlers([file]);
					if(tiddlerFieldsArray.length > 0) {
						readFileCallback(tiddlerFieldsArray);
					}
				} else {
					// Import any files normally
					this.wiki.readFile(item.getAsFile(), {
						callback: readFileCallback,
						deserializer: this.dropzoneDeserializer
					});
				}
			} else if(item.kind === "string" && !["text/html", "text/plain", "Text"].includes(item.type) && $tw.utils.itemHasValidDataType(item)) {
				// Try to import the various data types we understand
				var fallbackTitle = self.wiki.generateNewTitle("Untitled");
				// Use the deserializer specified if any
				if(this.dropzoneDeserializer) {
					item.getAsString(function(str) {
						var tiddlerFields = self.wiki.deserializeTiddlers(null, str, {title: fallbackTitle}, {deserializer: self.dropzoneDeserializer});
						if(tiddlerFields && tiddlerFields.length) {
							readFileCallback(tiddlerFields);
						}
					});
				} else {
					$tw.utils.importPaste(item, fallbackTitle, readFileCallback);
				}
			} else if(item.kind === "string") {
				// Create tiddlers from string items
				// It's important to give getAsString a closure with the right type
				// So it can be added to the import queue
				item.getAsString(getItem(item.type));
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
	this.importTitle = this.getAttribute("importTitle", IMPORT_TITLE);
	this.actions = this.getAttribute("actions");
	this.contentTypesFilter = this.getAttribute("contentTypesFilter");
	this.filesOnly = this.getAttribute("filesOnly", "no") === "yes";
	this.dropzoneTabindex = this.getAttribute("tabindex");
	// Canonical URI attribute
	this.filePathPrefix = this.getAttribute("filePathPrefix");
	// Make child widgets
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed.
Returns true if the widget or any of its children needed re-rendering
*/
DropZoneWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if($tw.utils.count(changedAttributes) > 0) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

/*
Clean up when the widget is destroyed
*/
DropZoneWidget.prototype.destroy = function() {
	this.clearDragTimeout();
	this.removeGlobalListeners();
	// Call parent destroy if it exists
	if(Widget.prototype.destroy) {
		Widget.prototype.destroy.call(this);
	}
};

exports.dropzone = DropZoneWidget;
