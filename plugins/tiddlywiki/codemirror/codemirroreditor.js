/*\
title: $:/plugins/tiddlywiki/codemirror/codemirroreditor.js
type: application/javascript
module-type: editor

A Codemirror text editor

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

if($tw.browser) {
	require("./codemirror.js")
}

var CodeMirrorEditor = function(editWidget,tiddlerTitle,fieldName) {
	this.editWidget = editWidget;
	this.tiddlerTitle = tiddlerTitle;
	this.fieldName = fieldName;
};

/*
Get the tiddler being edited and current value
*/
CodeMirrorEditor.prototype.getEditInfo = function() {
	// Get the current tiddler and the field name
	var tiddler = this.editWidget.renderer.renderTree.wiki.getTiddler(this.tiddlerTitle),
		value;
	// If we've got a tiddler, the value to display is the field string value
	if(tiddler) {
		value = tiddler.getFieldString(this.fieldName);
	} else {
		// Otherwise, we need to construct a default value for the editor
		switch(this.fieldName) {
			case "text":
				value = "Type the text for the tiddler '" + this.tiddlerTitle + "'";
				break;
			case "title":
				value = this.tiddlerTitle;
				break;
			default:
				value = "";
				break;
		}
		value = this.editWidget.renderer.getAttribute("default",value);
	}
	return {tiddler: tiddler, value: value};
};

CodeMirrorEditor.prototype.render = function() {
	// Get the initial value of the editor
	var editInfo = this.getEditInfo();
	// Create the editor nodes
	var node = {
		type: "element",
		attributes: {}
	};
	this.type = this.editWidget.renderer.getAttribute("type",this.fieldName === "text" ? "textarea" : "input");
	switch(this.type) {
		case "textarea":
			node.tag = "textarea";
			node.children = [{
				type: "text",
				text: editInfo.value
			}];
			break;
		case "search":
			node.tag = "input";
			node.attributes.type = {type: "string", value: "search"};
			node.attributes.value = {type: "string", value: editInfo.value};
			break;
		default: // "input"
			node.tag = "input";
			node.attributes.type = {type: "string", value: "text"};
			node.attributes.value = {type: "string", value: editInfo.value};
			break;
	}
	// Set the element details
	this.editWidget.tag = this.editWidget.renderer.parseTreeNode.isBlock ? "div" : "span";
	this.editWidget.attributes = {
		"class": "tw-edit-CodeMirrorEditor"
	};
	this.editWidget.children = this.editWidget.renderer.renderTree.createRenderers(this.editWidget.renderer.renderContext,[node]);
};

CodeMirrorEditor.prototype.postRenderInDom = function() {
	if(this.type === "textarea") {
		CodeMirror.fromTextArea(this.editWidget.children[0].domNode,{
			lineWrapping: true,
			lineNumbers: true
		});
	}
};

CodeMirrorEditor.prototype.refreshInDom = function() {
	if(document.activeElement !== this.editWidget.children[0].domNode) {
		var editInfo = this.getEditInfo();
		this.editWidget.children[0].domNode.value = editInfo.value;
	}
};

exports["text/vnd.tiddlywiki"] = CodeMirrorEditor;
exports["text/plain"] = CodeMirrorEditor;

})();
