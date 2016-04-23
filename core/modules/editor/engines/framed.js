/*\
title: $:/core/modules/editor/engines/framed.js
type: application/javascript
module-type: library

Text editor engine based on a simple input or textarea within an iframe. This is done so that the selection is preserved even when clicking away from the textarea

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var HEIGHT_VALUE_TITLE = "$:/config/TextEditor/EditorHeight/Height";

function FramedEngine(options) {
	// Save our options
	options = options || {};
	this.widget = options.widget;
	this.value = options.value;
	this.parentNode = options.parentNode;
	this.nextSibling = options.nextSibling;
	// Create our hidden dummy text area for reading styles
	this.dummyTextArea = this.widget.document.createElement("textarea");
	if(this.widget.editClass) {
		this.dummyTextArea.className = this.widget.editClass;
	}
	this.dummyTextArea.setAttribute("hidden","true");
	this.parentNode.insertBefore(this.dummyTextArea,this.nextSibling);
	this.widget.domNodes.push(this.dummyTextArea);
	// Create the iframe
	this.iframeNode = this.widget.document.createElement("iframe");
	this.parentNode.insertBefore(this.iframeNode,this.nextSibling);
	this.iframeDoc = this.iframeNode.contentWindow.document;
	// (Firefox requires us to put some empty content in the iframe)
	this.iframeDoc.open();
	this.iframeDoc.write("");
	this.iframeDoc.close();
	// Style the iframe
	this.iframeNode.className = this.dummyTextArea.className;
	this.iframeNode.style.border = "none";
	this.iframeNode.style.padding = "0";
	this.iframeNode.style.resize = "none";
	this.iframeDoc.body.style.margin = "0";
	this.iframeDoc.body.style.padding = "0";
	this.widget.domNodes.push(this.iframeNode);
	// Construct the textarea or input node
	var tag = this.widget.editTag;
	if($tw.config.htmlUnsafeElements.indexOf(tag) !== -1) {
		tag = "input";
	}
	this.domNode = this.iframeDoc.createElement(tag);
	if(this.widget.editType) {
		this.domNode.setAttribute("type",this.widget.editType);
	}
	if(this.widget.editPlaceholder) {
		this.domNode.setAttribute("placeholder",this.widget.editPlaceholder);
	}
	if(this.widget.editSize) {
		this.domNode.setAttribute("size",this.widget.editSize);
	}
	if(this.widget.editRows) {
		this.domNode.setAttribute("rows",this.widget.editRows);
	}
	// Copy the styles from the dummy textarea
	$tw.utils.copyStyles(this.dummyTextArea,this.domNode);
	this.domNode.style.display = "block";
	this.domNode.style.width = "100%";
	this.domNode.style.margin = "0";
	// Set the text
	if(this.widget.editTag === "textarea") {
		this.domNode.appendChild(this.iframeDoc.createTextNode(this.value));
	} else {
		this.domNode.value = this.value;
	}
	// Add event listeners
	$tw.utils.addEventListeners(this.domNode,[
		{name: "input", handlerObject: this, handlerMethod: "handleInputEvent"},
		{name: "keydown", handlerObject: this.widget, handlerMethod: "handleKeydownEvent"}
	]);
	// Insert the element into the DOM
	this.iframeDoc.body.appendChild(this.domNode);
}

/*
Set the text of the engine if it doesn't currently have focus
*/
FramedEngine.prototype.setText = function(text,type) {
	if(!this.domNode.isTiddlyWikiFakeDom) {
		if(this.domNode.ownerDocument.activeElement !== this.domNode) {
			this.domNode.value = text;
		}
		// Fix the height if needed
		this.fixHeight();
	}
};

/*
Get the text of the engine
*/
FramedEngine.prototype.getText = function() {
	return this.domNode.value;
};

/*
Fix the height of textarea to fit content
*/
FramedEngine.prototype.fixHeight = function() {
	if(this.widget.editTag === "textarea") {
		if(this.widget.editAutoHeight) {
			if(this.domNode && !this.domNode.isTiddlyWikiFakeDom) {
				var newHeight = $tw.utils.resizeTextAreaToFit(this.domNode,this.widget.editMinHeight);
				this.iframeNode.style.height = (newHeight + 14) + "px"; // +14 for the border on the textarea
			}
		} else {
			var fixedHeight = parseInt(this.widget.wiki.getTiddlerText(HEIGHT_VALUE_TITLE,"400px"),10);
			fixedHeight = Math.max(fixedHeight,20);
			this.domNode.style.height = fixedHeight + "px";
			this.iframeNode.style.height = (fixedHeight + 14) + "px";
		}
	}
};

/*
Focus the engine node
*/
FramedEngine.prototype.focus  = function() {
	if(this.domNode.focus && this.domNode.select) {
		this.domNode.focus();
		this.domNode.select();
	}
};

/*
Handle a dom "input" event which occurs when the text has changed
*/
FramedEngine.prototype.handleInputEvent = function(event) {
	this.widget.saveChanges(this.getText());
	this.fixHeight();
	return true;
};

/*
Create a blank structure representing a text operation
*/
FramedEngine.prototype.createTextOperation = function() {
	var operation = {
		text: this.domNode.value,
		selStart: this.domNode.selectionStart,
		selEnd: this.domNode.selectionEnd,
		cutStart: null,
		cutEnd: null,
		replacement: null,
		newSelStart: null,
		newSelEnd: null
	};
	operation.selection = operation.text.substring(operation.selStart,operation.selEnd);
	return operation;
};

/*
Execute a text operation
*/
FramedEngine.prototype.executeTextOperation = function(operation) {
	// Perform the required changes to the text area and the underlying tiddler
	var newText = operation.text;
	if(operation.replacement !== null) {
		// Work around the problem that textInput can't be used directly to delete text without also replacing it with a non-zero length string
		if(operation.replacement === "") {
			operation.replacement = operation.text.substring(0,operation.cutStart) + operation.text.substring(operation.cutEnd);
			operation.cutStart = 0;
			operation.cutEnd = operation.text.length;
		}
		newText = operation.text.substring(0,operation.cutStart) + operation.replacement + operation.text.substring(operation.cutEnd);
		// Attempt to use a TextEvent to modify the value of the control
		var textEvent = this.domNode.ownerDocument.createEvent("TextEvent");
		if(textEvent.initTextEvent) {
			textEvent.initTextEvent("textInput", true, true, null, operation.replacement, 9, "en-US");
			this.domNode.focus();
			this.domNode.setSelectionRange(operation.cutStart,operation.cutEnd);
			this.domNode.dispatchEvent(textEvent);
		} else {
			this.domNode.value = newText;
		}
		this.domNode.focus();
		this.domNode.setSelectionRange(operation.newSelStart,operation.newSelEnd);
	}
	this.domNode.focus();
	return newText;
};

/*
Execute a command
*/
FramedEngine.prototype.execCommand = function(command) {
	this.iframeNode.focus();
	this.domNode.focus();
	switch(command) {
		case "undo":
			this.iframeDoc.execCommand("undo", false, null);
			break;
		case "redo":
			this.iframeDoc.execCommand("redo", false, null);
			break;
	}
};

exports.FramedEngine = FramedEngine;

})();
