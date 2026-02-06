/*\
title: $:/core/modules/widgets/edit-binary.js
type: application/javascript
module-type: widget

Edit-binary widget; placeholder for editing binary tiddlers

\*/

"use strict";

var BINARY_WARNING_MESSAGE = "$:/core/ui/BinaryWarning";
var EXPORT_BUTTON_IMAGE = "$:/core/images/export-button";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var EditBinaryWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
EditBinaryWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
EditBinaryWidget.prototype.render = function(parent,nextSibling) {
	var self = this;
	// Save the parent dom node
	this.parentDomNode = parent;
	// Compute our attributes
	this.computeAttributes();
	// Execute our logic
	this.execute();
	this.renderChildren(parent,nextSibling);
};

/*
Compute the internal state of the widget
*/
EditBinaryWidget.prototype.execute = function() {
	// Get our parameters
	var editTitle = this.getAttribute("tiddler",this.getVariable("currentTiddler"));
	var tiddler = this.wiki.getTiddler(editTitle);
	var type = tiddler.fields.type;
	var text = tiddler.fields.text;
	// Transclude the binary data tiddler warning message
	var warn = {
		type: "element",
		tag: "p",
		children: [{
			type: "transclude",
			attributes: {
				tiddler: {type: "string", value: BINARY_WARNING_MESSAGE}
			}
		}]
	};
	// Create download link based on draft tiddler title
	var link = {
		type: "element",
		tag: "a",
		attributes: {
			title: {type: "indirect", textReference: "!!draft.title"},
			download: {type: "indirect", textReference: "!!draft.title"}
		},
		children: [{
		type: "transclude",
			attributes: {
				tiddler: {type: "string", value: EXPORT_BUTTON_IMAGE}
			}
		}]
	};
	// Set the link href to internal data URI (no external)
	if(text) {
		link.attributes.href = {
			type: "string", 
			value: "data:" + type + ";base64," + text
		};
	}
	// Combine warning message and download link in a div
	var element = {
		type: "element",
		tag: "div",
		attributes: {
			class: {type: "string", value: "tc-binary-warning"}
		},
		children: [warn, link]
	}
	// Construct the child widgets
	this.makeChildWidgets([element]);
};

/*
Refresh by refreshing our child widget
*/
EditBinaryWidget.prototype.refresh = function(changedTiddlers) {
	return this.refreshChildren(changedTiddlers);
};

exports["edit-binary"] = EditBinaryWidget;
