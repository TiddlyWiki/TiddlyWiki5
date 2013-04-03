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
	this.renderer.domNode.classList.add("tw-dragover");
};

ImportWidget.prototype.handleDragOverEvent  = function(event) {
	event.stopPropagation();
	event.preventDefault();
	event.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
};

ImportWidget.prototype.handleDragLeaveEvent  = function(event) {
	this.renderer.domNode.classList.remove("tw-dragover");
};

ImportWidget.prototype.handleDropEvent  = function(event) {
	this.renderer.domNode.classList.remove("tw-dragover");
	event.stopPropagation();
	event.preventDefault();
	this.importFiles(event.dataTransfer.files);
	return false;
};

ImportWidget.prototype.handlePasteEvent  = function(event) {
	var self = this,
		items = event.clipboardData.items;
	for(var t = 0; t<items.length; t++) {
		var item = items[t];
		if(item.kind === "file") {
			var file = item.getAsFile();
			this.importFiles([file]);
		} else if(item.kind === "string") {
			item.getAsString(function(str) {
				var fields = {
					title: self.generateTitle("Untitled"),
					text: str
				}
				self.renderer.renderTree.wiki.addTiddler(new $tw.Tiddler(fields));
				self.openTiddler(fields.title);
			});
		}
	}
	event.stopPropagation();
	event.preventDefault();
	return false;
};

ImportWidget.prototype.openTiddler = function(title) {
	$tw.utils.dispatchCustomEvent(this.renderer.domNode,"tw-navigate",{
		navigateTo: title,
		navigateFromNode: this.renderer.domNode,
		navigateFromClientRect: this.renderer.domNode.getBoundingClientRect()
	});
};

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
					self.renderer.renderTree.wiki.addTiddler(new $tw.Tiddler(fields));
					self.openTiddler(fields.title);
				}
			} else {
				var tiddlers = self.renderer.renderTree.wiki.deserializeTiddlers(type,event.target.result,fields);
				if(!tiddlers) {
					console.log("No tiddlers found in file ",file.name);
				} else {
					$tw.utils.each(tiddlers,function(tiddlerFields) {
						var title = self.generateTitle(tiddlerFields.title);
						self.renderer.renderTree.wiki.addTiddler(new $tw.Tiddler(tiddlerFields,{title: title}));
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
