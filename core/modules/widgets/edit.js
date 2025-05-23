/*\
title: $:/core/modules/widgets/edit.js
type: application/javascript
module-type: widget

Edit widget is a meta-widget chooses the appropriate actual editting widget

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

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

// Mappings from content type to editor type are stored in tiddlers with this prefix
var EDITOR_MAPPING_PREFIX = "$:/config/EditorTypeMappings/";

/*
Compute the internal state of the widget
*/
EditWidget.prototype.execute = function() {
	// Get our parameters
	this.editTitle = this.getAttribute("tiddler",this.getVariable("currentTiddler"));
	this.editField = this.getAttribute("field","text");
	// Choose the appropriate edit widget
	this.editorType = this.getEditorType();
	// Make the child widgets
	this.makeChildWidgets([{
		type: "edit-" + this.editorType,
		attributes: this.parseTreeNode.attributes,
		children: this.parseTreeNode.children
	}]);
};

EditWidget.prototype.getEditorType = function() {
	// Get the content type of the thing we're editing
	var type;
	if(this.editField === "text") {
		var tiddler = this.wiki.getTiddler(this.editTitle);
		if(tiddler) {
			type = tiddler.fields.type;
		}
	}
	type = type || "text/vnd.tiddlywiki";
	var editorType = this.wiki.getTiddlerText(EDITOR_MAPPING_PREFIX + type);
	if(!editorType) {
		var typeInfo = $tw.config.contentTypeInfo[type];
		if(typeInfo && typeInfo.encoding === "base64") {
			editorType = "binary";
		} else {
			editorType = "text";
		}
	}
	return editorType;
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
EditWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	// Refresh if the editor type has changed
	if(changedAttributes.tiddler || changedAttributes.field || (this.getEditorType() !== this.editorType)) {
		this.refreshSelf();
		return true;
	} else {
		return this.refreshChildren(changedTiddlers);
	}
};

exports.edit = EditWidget;
