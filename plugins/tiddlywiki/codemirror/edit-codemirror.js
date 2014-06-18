/*\
title: $:/core/modules/widgets/edit-codemirror.js
type: application/javascript
module-type: widget

Codemirror-based text editor widget

Config options "$:/config/CodeMirror" e.g. to allow vim key bindings
 {
	"require": [
		"$:/plugins/tiddlywiki/codemirror/addon/dialog/dialog.js",
		"$:/plugins/tiddlywiki/codemirror/addon/search/searchcursor.js",
		"$:/plugins/tiddlywiki/codemirror/keymap/vim.js"
	],
	"configuration": {
			"keyMap": "vim",
			"showCursorWhenSelecting": true
	}
}

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var CODEMIRROR_OPTIONS = "$:/config/CodeMirror"

// Install CodeMirror
if($tw.browser && !window.CodeMirror) {
	window.CodeMirror = require("$:/plugins/tiddlywiki/codemirror/lib/codemirror.js");
	// Install required CodeMirror plugins
	var configOptions = $tw.wiki.getTiddlerData(CODEMIRROR_OPTIONS,{}),
		req = configOptions["require"];
	if(req) {
		if($tw.utils.isArray(req)) {
			for(var index=0; index<req.length; index++) {
				require(req[index]);
			}
		} else {
			require(req);
		}
	}
}

var MIN_TEXT_AREA_HEIGHT = 100; // Minimum height of textareas in pixels

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var EditCodeMirrorWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
EditCodeMirrorWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
EditCodeMirrorWidget.prototype.render = function(parent,nextSibling) {
	var self = this;
	// Save the parent dom node
	this.parentDomNode = parent;
	// Compute our attributes
	this.computeAttributes();
	// Execute our logic
	this.execute();
	// Get the configuration options for the CodeMirror object
	var config = $tw.wiki.getTiddlerData(CODEMIRROR_OPTIONS,{}).configuration || {},
		editInfo = this.getEditInfo();
	if(!("lineWrapping" in config)) {
		config.lineWrapping = true;
	}
	if(!("lineNumbers" in config)) {
		config.lineNumbers = true;
	}
	config.mode = editInfo.type;
	config.value = editInfo.value;
	// Create the CodeMirror instance
	var cm = window.CodeMirror(function(domNode) {
		parent.insertBefore(domNode,nextSibling);
		self.domNodes.push(domNode);
	},config);
	// Set up a change event handler
	cm.on("change",function() {
		self.saveChanges(cm.getValue());
	});
	this.codeMirrorInstance = cm;
};

/*
Get the tiddler being edited and current value
*/
EditCodeMirrorWidget.prototype.getEditInfo = function() {
	// Get the edit value
	var self = this,
		value,
		type = "text/plain",
		update;
	if(this.editIndex) {
		value = this.wiki.extractTiddlerDataItem(this.editTitle,this.editIndex,this.editDefault);
		update = function(value) {
			var data = self.wiki.getTiddlerData(self.editTitle,{});
			if(data[self.editIndex] !== value) {
				data[self.editIndex] = value;
				self.wiki.setTiddlerData(self.editTitle,data);
			}
		};
	} else {
		// Get the current tiddler and the field name
		var tiddler = this.wiki.getTiddler(this.editTitle);
		if(tiddler) {
			// If we've got a tiddler, the value to display is the field string value
			value = tiddler.getFieldString(this.editField);
			if(this.editField === "text") {
				type = tiddler.fields.type || "text/vnd.tiddlywiki";
			}
		} else {
			// Otherwise, we need to construct a default value for the editor
			switch(this.editField) {
				case "text":
					value = "Type the text for the tiddler '" + this.editTitle + "'";
					type = "text/vnd.tiddlywiki";
					break;
				case "title":
					value = this.editTitle;
					break;
				default:
					value = "";
					break;
			}
			if(this.editDefault !== undefined) {
				value = this.editDefault;
			}
		}
		update = function(value) {
			var tiddler = self.wiki.getTiddler(self.editTitle),
				updateFields = {
					title: self.editTitle
				};
			updateFields[self.editField] = value;
			self.wiki.addTiddler(new $tw.Tiddler(self.wiki.getCreationFields(),tiddler,updateFields,self.wiki.getModificationFields()));
		};
	}
	if(this.editType) {
		type = this.editType;
	}
	return {value: value, type: type, update: update};
};

/*
Compute the internal state of the widget
*/
EditCodeMirrorWidget.prototype.execute = function() {
	// Get our parameters
	this.editTitle = this.getAttribute("tiddler",this.getVariable("currentTiddler"));
	this.editField = this.getAttribute("field","text");
	this.editIndex = this.getAttribute("index");
	this.editDefault = this.getAttribute("default");
	this.editType = this.getAttribute("type");
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
EditCodeMirrorWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	// Completely rerender if any of our attributes have changed
	if(changedAttributes.tiddler || changedAttributes.field || changedAttributes.index) {
		this.refreshSelf();
		return true;
	} else if(changedTiddlers[this.editTitle]) {
		this.updateEditor(this.getEditInfo().value);
		return true;
	}
	return false;
};

/*
Update the editor with new text. This method is separate from updateEditorDomNode()
so that subclasses can override updateEditor() and still use updateEditorDomNode()
*/
EditCodeMirrorWidget.prototype.updateEditor = function(text) {
	this.updateEditorDomNode(text);
};

/*
Update the editor dom node with new text
*/
EditCodeMirrorWidget.prototype.updateEditorDomNode = function(text) {
	if(this.codeMirrorInstance) {
		if(!this.codeMirrorInstance.hasFocus()) {
			this.codeMirrorInstance.setValue(text);
		}
	}
};

EditCodeMirrorWidget.prototype.saveChanges = function(text) {
	var editInfo = this.getEditInfo();
	if(text !== editInfo.value) {
		editInfo.update(text);
	}
};

exports["edit-codemirror"] = EditCodeMirrorWidget;

})();
