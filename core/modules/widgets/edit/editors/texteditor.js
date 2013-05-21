/*\
title: $:/core/modules/widgets/edit/editors/texteditor.js
type: application/javascript
module-type: editor

A plain text editor

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var MIN_TEXT_AREA_HEIGHT = 100;

var TextEditor = function(editWidget,tiddlerTitle,fieldName) {
	this.editWidget = editWidget;
	this.tiddlerTitle = tiddlerTitle;
	this.fieldName = fieldName;
};

/*
Get the tiddler being edited and current value
*/
TextEditor.prototype.getEditInfo = function() {
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

TextEditor.prototype.render = function() {
	// Get the initial value of the editor
	var editInfo = this.getEditInfo();
	// Create the editor nodes
	var node = {
		type: "element",
		attributes: {}
	};
	var type = this.editWidget.renderer.getAttribute("type",this.fieldName === "text" ? "textarea" : "input");
	switch(type) {
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
		"class": "tw-edit-texteditor"
	};
	if(this.editWidget.renderer.parseTreeNode.attributes["class"]) {
		this.editWidget.attributes["class"] += " " + this.editWidget.renderer.parseTreeNode.attributes["class"].value;
	}
	if(this.editWidget.renderer.parseTreeNode.attributes.style) {
		this.editWidget.attributes.style = this.editWidget.attributes.style || "";
		this.editWidget.attributes.style += this.editWidget.renderer.parseTreeNode.attributes.style.value;
	}
	this.editWidget.children = this.editWidget.renderer.renderTree.createRenderers(this.editWidget.renderer,[node]);
	this.editWidget.events = [
		{name: "focus", handlerObject: this},
		{name: "blur", handlerObject: this},
		{name: "input", handlerObject: this}
	];
};

TextEditor.prototype.handleEvent = function(event) {
	// Get the value of the field if it might have changed
	if(["input","focus","blur"].indexOf(event.type) !== -1) {
		this.saveChanges();
	}
	// Fix the height of the textarea if required
	if(["input","focus"].indexOf(event.type) !== -1) {
		this.fixHeight();
	}
	return true;
};

TextEditor.prototype.saveChanges = function() {
	var text = this.editWidget.children[0].domNode.value,
		tiddler = this.editWidget.renderer.renderTree.wiki.getTiddler(this.tiddlerTitle);
	if(!tiddler) {
		tiddler = new $tw.Tiddler({title: this.tiddlerTitle});
	}
	if(text !== tiddler.fields[this.fieldName]) {
		var update = {};
		update[this.fieldName] = text;
		this.editWidget.renderer.renderTree.wiki.addTiddler(new $tw.Tiddler(tiddler,update));
	}
};

TextEditor.prototype.fixHeight = function() {
	var self = this;
	if(this.editWidget.children[0].domNode && this.editWidget.children[0].domNode.type === "textarea") {
		$tw.utils.nextTick(function() {
			// Resize the textarea to fit its content
			var textarea = self.editWidget.children[0].domNode,
				scrollPosition = $tw.utils.getScrollPosition(),
				scrollTop = scrollPosition.y;
			// Set its height to auto so that it snaps to the correct height
			textarea.style.height = "auto";
			// Calculate the revised height
			var newHeight = Math.max(textarea.scrollHeight + textarea.offsetHeight - textarea.clientHeight,MIN_TEXT_AREA_HEIGHT);
			// Only try to change the height if it has changed
			if(newHeight !== textarea.offsetHeight) {
				textarea.style.height =  newHeight + "px";
				// Make sure that the dimensions of the textarea are recalculated
				$tw.utils.forceLayout(textarea);
				// Check that the scroll position is still visible before trying to scroll back to it
				scrollTop = Math.min(scrollTop,self.editWidget.renderer.renderTree.document.body.scrollHeight - window.innerHeight);
				window.scrollTo(scrollPosition.x,scrollTop);
			}
		});
	}
};

TextEditor.prototype.postRenderInDom = function() {
	this.fixHeight();
};

TextEditor.prototype.refreshInDom = function() {
	if(this.editWidget.renderer.renderTree.document.activeElement !== this.editWidget.children[0].domNode) {
		var editInfo = this.getEditInfo();
		this.editWidget.children[0].domNode.value = editInfo.value;
	}
	// Fix the height if needed
	this.fixHeight();
};

exports["text/vnd.tiddlywiki"] = TextEditor;
exports["text/plain"] = TextEditor;

})();
