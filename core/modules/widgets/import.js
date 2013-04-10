/*\
title: $:/core/modules/widget/import.js
type: application/javascript
module-type: widget

Implements the import widget.

```
<$import>
Import using the "browse..." button or drag files onto this text
</$import>
```

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var ImportWidget = function(renderer) {
	// Save state
	this.renderer = renderer;
	// Generate child nodes
	this.generate();
};

ImportWidget.prototype.generate = function() {
	// Get the parameters from the attributes
	this.browse = this.renderer.getAttribute("browse","yes");
	this["class"] = this.renderer.getAttribute("class");
	// Compute classes
	var classes = ["tw-import"];
	if(this["class"]) {
		$tw.utils.pushTop(classes,this["class"]);
	}
	// Create the file input and container elements
	var fileInput = {
			type: "element",
			tag: "input",
			attributes: {
				type: {type: "string", value: "file"},
				style: {type: "string", value: this.browse === "no" ? "display: none;" : "display: block;"}
			},
			events: [{name: "change", handlerObject: this, handlerMethod: "handleChangeEvent"}]
		},
		container = {
			type: "element",
			tag: "div",
			children: this.renderer.parseTreeNode.children,
			events: [
				{name: "dragenter", handlerObject: this, handlerMethod: "handleDragEnterEvent"},
				{name: "dragover", handlerObject: this, handlerMethod: "handleDragOverEvent"},
				{name: "dragleave", handlerObject: this, handlerMethod: "handleDragLeaveEvent"},
				{name: "drop", handlerObject: this, handlerMethod: "handleDropEvent"},
				{name: "paste", handlerObject: this, handlerMethod: "handlePasteEvent"}]
		};
	// Set the return element
	this.tag = "div";
	this.attributes = {
		"class": classes.join(" ")
	};
	this.children = this.renderer.renderTree.createRenderers(this.renderer.renderContext,[fileInput,container]);
};

ImportWidget.prototype.handleChangeEvent  = function(event) {
	event.stopPropagation();
	this.importFiles(event.target.files);
};

ImportWidget.prototype.handleDragEnterEvent  = function(event) {
	// We count enter/leave events
	this.dragEnterCount = (this.dragEnterCount || 0) + 1;
	// If we're entering for the first time we need to apply highlighting
	if(this.dragEnterCount === 1) {
		$tw.utils.addClass(this.renderer.domNode,"tw-dragover");
	}
	// Tell the browser that we're ready to handle the drop
	event.preventDefault();
	// Tell the browser not to ripple the drag up to any parent drop handlers
	event.stopPropagation();
};

ImportWidget.prototype.handleDragOverEvent  = function(event) {
	// Tell the browser that we're still interested in the drop
	event.preventDefault();
	event.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy
};

ImportWidget.prototype.handleDragLeaveEvent  = function(event) {
	// Reduce the enter count
	this.dragEnterCount = (this.dragEnterCount || 0) - 1;
	// Remove highlighting if we're leaving externally
	if(this.dragEnterCount <= 0) {
		$tw.utils.removeClass(this.renderer.domNode,"tw-dragover");
	}
};

ImportWidget.prototype.handleDropEvent  = function(event) {
	var dataTransfer = event.dataTransfer;
	// Reset the enter count
	this.dragEnterCount = 0;
	// Remove highlighting
	$tw.utils.removeClass(this.renderer.domNode,"tw-dragover");
	// Try to import the various data types we understand
	this.importData(dataTransfer);
	// Import any files in the drop
	this.importFiles(dataTransfer.files);
	// Tell the browser that we handled the drop
	event.preventDefault();
	// Stop the drop ripple up to any parent handlers
	event.stopPropagation();
};

ImportWidget.prototype.handlePasteEvent  = function(event) {
	// Let the browser handle it if we're in a textarea or input box
	if(["TEXTAREA","INPUT"].indexOf(event.target.tagName) == -1) {
		var self = this,
			items = event.clipboardData.items;
		// Enumerate the clipboard items
		for(var t = 0; t<items.length; t++) {
			var item = items[t];
			if(item.kind === "file") {
				// Import any files
				var file = item.getAsFile();
				this.importFiles([file]);
			} else if(item.kind === "string") {
				// Create tiddlers from string items
				item.getAsString(function(str) {
					var fields = {
						title: self.generateTitle("Untitled"),
						text: str
					};
					self.storeTiddler(fields);
					self.openTiddler(fields.title);
				});
			}
		}
		// Tell the browser that we've handled the paste
		event.stopPropagation();
		event.preventDefault();
	}
};

ImportWidget.prototype.openTiddler = function(title) {
	$tw.utils.dispatchCustomEvent(this.renderer.domNode,"tw-navigate",{
		navigateTo: title,
		navigateFromNode: this.renderer.domNode,
		navigateFromClientRect: this.renderer.domNode.getBoundingClientRect()
	});
};

ImportWidget.prototype.importData = function(dataTransfer) {
	for(var t=0; t<this.importDataTypes.length; t++) {
		var dataType = this.importDataTypes[t];
		var data = dataTransfer.getData(dataType.type);
		if(data !== "") {
			var fields = dataType.handler(data);
			if(!fields.title) {
				fields.title = this.generateTitle("Untitled");
			}
			this.storeTiddler(fields);
			this.openTiddler(fields.title);
			return;
		}
	};
};

ImportWidget.prototype.importDataTypes = [
	{type: "text/vnd.tiddler", handler: function(data) {
		return JSON.parse(data);
	}},
	{type: "text/plain", handler: function(data) {
		return {
			text: data
		};
	}},
	{type: "text/uri-list", handler: function(data) {
		return {
			text: data
		};
	}}
];

ImportWidget.prototype.importFiles = function(files) {
	var self = this,
		importFile = function(file) {
		// Get the type, falling back to the filename extension
		var type = file.type;
		if(type === "" || !type) {
			var dotPos = file.name.lastIndexOf(".");
			if(dotPos !== -1) {
				var fileExtensionInfo = $tw.config.fileExtensionInfo[file.name.substr(dotPos)];
				if(fileExtensionInfo) {
					type = fileExtensionInfo.type;
				}
			}
		}
		// Figure out if we're reading a binary file
		var contentTypeInfo = $tw.config.contentTypeInfo[type],
			isBinary = contentTypeInfo ? contentTypeInfo.encoding === "base64" : false;
		// Create the FileReader
		var reader = new FileReader();
		reader.onload = function(event) {
			// Deserialise the file contents
			var fields = {
				title: file.name || "Untitled",
				type: type};
			// Are we binary?
			if(isBinary) {
				var commaPos = event.target.result.indexOf(",");
				if(commaPos !== -1) {
					fields.text = event.target.result.substr(commaPos+1);
					self.storeTiddler(fields);
					self.openTiddler(fields.title);
				}
			} else {
				var tiddlers = self.renderer.renderTree.wiki.deserializeTiddlers(type,event.target.result,fields);
				if(!tiddlers) {
					console.log("No tiddlers found in file ",file.name);
				} else {
					$tw.utils.each(tiddlers,function(tiddlerFields) {
						tiddlerFields.title = self.generateTitle(tiddlerFields.title);
						self.storeTiddler(tiddlerFields);
						self.openTiddler(title);
					});
				}
			}
		};
		if(isBinary) {
			reader.readAsDataURL(file);
		} else {
			reader.readAsText(file);
		}
	};
	for(var f=0; f<files.length; f++) {
		importFile(files[f]);
	};
};

ImportWidget.prototype.storeTiddler = function(fields) {
	this.renderer.renderTree.wiki.addTiddler(new $tw.Tiddler(fields));
};

ImportWidget.prototype.generateTitle = function(baseTitle) {
	var c = 0;
	do {
		var title = baseTitle + (c ? " " + (c + 1) : "");
		c++;
	} while(this.renderer.renderTree.wiki.tiddlerExists(title));
	return title;
};

exports.import = ImportWidget;

})();
