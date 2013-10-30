/*\
title: $:/core/modules/new_widgets/edit.js
type: application/javascript
module-type: new_widget

Edit widget is a meta-widget chooses the appropriate actual editting widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/new_widgets/widget.js").widget;

var EditWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
EditWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
EditWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent,nextSibling);
};

// Mappings from content type to editor type
// TODO: This information should be configurable/extensible
var editorTypeMappings = {
	"text/vnd.tiddlywiki": "text",
	"image/svg+xml": "text",
	"image/jpg": "bitmap",
	"image/jpeg": "bitmap",
	"image/gif": "bitmap",
	"image/png": "bitmap"
};

/*
Compute the internal state of the widget
*/
EditWidget.prototype.execute = function() {
	// Get our parameters
	this.editTitle = this.getAttribute("tiddler",this.getVariable("currentTiddler"));
	this.editField = this.getAttribute("field","text");
	this.editIndex = this.getAttribute("index");
	this.editClass = this.getAttribute("class");
	// Get the content type of the thing we're editing
	var type;
	if(this.editField === "text") {
		var tiddler = this.wiki.getTiddler(this.editTitle);
		if(tiddler) {
			type = tiddler.fields.type;
		}
	}
	type = type || "text/vnd.tiddlywiki";
	// Choose the appropriate edit widget
	var editorType = editorTypeMappings[type] || "text";
	// Make the child widgets
	this.makeChildWidgets([{
		type: "edit-" + editorType,
		attributes: {
			title: {type: "string", value: this.editTitle},
			field: {type: "string", value: this.editField},
			index: {type: "string", value: this.editIndex},
			"class": {type: "string", value: this.editClass}
		}
	}]);
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
EditWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.tiddler || changedAttributes.field || changedAttributes.index) {
		this.refreshSelf();
		return true;
	} else {
		return this.refreshChildren(changedTiddlers);		
	}
};

exports.edit = EditWidget;

})();
