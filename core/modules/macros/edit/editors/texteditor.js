/*\
title: $:/core/modules/macros/edit/editors/texteditor.js
type: application/javascript
module-type: editor

An editor plugin for editting text

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

function TextEditor(macroNode) {
	this.macroNode = macroNode;
}

TextEditor.prototype.getChildren = function() {
	var tiddler = this.macroNode.wiki.getTiddler(this.macroNode.tiddlerTitle),
		field = this.macroNode.hasParameter("field") ? this.macroNode.params.field : "title",
		value;
	if(tiddler) {
		value = tiddler.getFieldString(field);
	} else {
		switch(field) {
			case "text":
				value = "Type the text for the tiddler '" + this.macroNode.tiddlerTitle + "'";
				break;
			case "title":
				value = this.macroNode.tiddlerTitle;
				break;
			default:
				value = "";
				break;
		}
	}
	var attributes = {
			"class": ["tw-edit-field"]
		},
		tagName,
		content = [];
	if(field === "text") {
		tagName = "textarea";
		content.push($tw.Tree.Text(value));
	} else {
		tagName = "input";
		attributes.type = "text";
		attributes.value = value;
	}
	return [$tw.Tree.Element(tagName,attributes,content)];
};

TextEditor.prototype.addEventHandlers = function() {
	this.macroNode.domNode.addEventListener("focus",this,false);
	this.macroNode.domNode.addEventListener("keyup",this,false);
};

TextEditor.prototype.handleEvent = function(event) {
	// Get the value of the field if it might have changed
	if("keyup".split(" ").indexOf(event.type) !== -1) {
		this.saveChanges();
	}
	// Whatever the event, fix the height of the textarea if required
	var self = this;
	window.setTimeout(function() {
		self.fixHeight();
	},5);
	return true;
};

TextEditor.prototype.saveChanges = function() {
	var text = this.macroNode.children[0].domNode.value,
		tiddler = this.macroNode.wiki.getTiddler(this.macroNode.tiddlerTitle);
	if(tiddler && text !== tiddler.fields[this.macroNode.params.field]) {
		var update = {};
		update[this.macroNode.params.field] = text;
		this.macroNode.wiki.addTiddler(new $tw.Tiddler(tiddler,update));
	}
};

TextEditor.prototype.fixHeight = function() {
	if(this.macroNode.children[0] && this.macroNode.children[0].domNode) {
		var wrapper = this.macroNode.domNode,
			textarea = this.macroNode.children[0].domNode;
		// Set the text area height to 1px temporarily, which allows us to read the true scrollHeight
		var prevWrapperHeight = wrapper.style.height;
		wrapper.style.height = textarea.style.height + "px";
		textarea.style.overflow = "hidden";
		textarea.style.height = "1px";
		textarea.style.height = textarea.scrollHeight + "px";
		wrapper.style.height = prevWrapperHeight;
	}
};

TextEditor.prototype.postRenderInDom = function() {
	this.fixHeight();
};

TextEditor.prototype.isRefreshable = function() {
	// Don't refresh the editor if it contains the caret or selection
	return document.activeElement !== this.macroNode.children[0].domNode;
};

exports["text/x-tiddlywiki"] = TextEditor;
exports["text/plain"] = TextEditor;

})();
