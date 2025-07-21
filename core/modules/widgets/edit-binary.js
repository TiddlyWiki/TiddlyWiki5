/*\
title: $:/core/modules/widgets/edit-binary.js
type: application/javascript
module-type: widget

Edit-binary widget; placeholder for editing binary tiddlers

\*/

"use strict";

const BINARY_WARNING_MESSAGE = "$:/core/ui/BinaryWarning";
const EXPORT_BUTTON_IMAGE = "$:/core/images/export-button";

const Widget = require("$:/core/modules/widgets/widget.js").widget;

const EditBinaryWidget = function(parseTreeNode,options) {
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
	const self = this;
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
	const editTitle = this.getAttribute("tiddler",this.getVariable("currentTiddler"));
	const tiddler = this.wiki.getTiddler(editTitle);
	const {type} = tiddler.fields;
	const {text} = tiddler.fields;
	// Transclude the binary data tiddler warning message
	const warn = {
		type: "element",
		tag: "p",
		children: [{
			type: "transclude",
			attributes: {
				tiddler: {type: "string",value: BINARY_WARNING_MESSAGE}
			}
		}]
	};
	// Create download link based on draft tiddler title
	const link = {
		type: "element",
		tag: "a",
		attributes: {
			title: {type: "indirect",textReference: "!!draft.title"},
			download: {type: "indirect",textReference: "!!draft.title"}
		},
		children: [{
			type: "transclude",
			attributes: {
				tiddler: {type: "string",value: EXPORT_BUTTON_IMAGE}
			}
		}]
	};
	// Set the link href to internal data URI (no external)
	if(text) {
		link.attributes.href = {
			type: "string",
			value: `data:${type};base64,${text}`
		};
	}
	// Combine warning message and download link in a div
	const element = {
		type: "element",
		tag: "div",
		attributes: {
			class: {type: "string",value: "tc-binary-warning"}
		},
		children: [warn,link]
	};
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
