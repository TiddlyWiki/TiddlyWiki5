/*\
title: $:/core/modules/editor/engines/framed.js
type: application/javascript
module-type: library

Text editor engine based on a simple input or textarea within an iframe. This is done so that the selection is preserved even when clicking away from the textarea

\*/
(function(){

/*jslint node: true,browser: true */
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
	var paletteTitle = this.widget.wiki.getTiddlerText("$:/palette");
	var colorScheme = (this.widget.wiki.getTiddler(paletteTitle) || {fields: {}}).fields["color-scheme"] || "light";
	this.iframeDoc.open();
	this.iframeDoc.write("<meta name='color-scheme' content='" + colorScheme + "'>");
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
	// Set the text
	if(this.widget.editTag === "textarea") {
		this.domNode.appendChild(this.iframeDoc.createTextNode(this.value));
	} else {
		this.domNode.value = this.value;
	}
	// Set the attributes
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
	if(this.widget.editTabIndex) {
		this.iframeNode.setAttribute("tabindex",this.widget.editTabIndex);
	}
	if(this.widget.editAutoComplete) {
		this.domNode.setAttribute("autocomplete",this.widget.editAutoComplete);
	}
	if(this.widget.isDisabled === "yes") {
		this.domNode.setAttribute("disabled",true);
	}
	// Copy the styles from the dummy textarea
	this.copyStyles();
	// Add event listeners
	$tw.utils.addEventListeners(this.domNode,[
		{name: "click",handlerObject: this,handlerMethod: "handleClickEvent"},
		{name: "input",handlerObject: this,handlerMethod: "handleInputEvent"},
		{name: "keydown",handlerObject: this.widget,handlerMethod: "handleKeydownEvent"},
		{name: "focus",handlerObject: this,handlerMethod: "handleFocusEvent"}
	]);
	// Add drag and drop event listeners if fileDrop is enabled
	if(this.widget.isFileDropEnabled) {
		$tw.utils.addEventListeners(this.domNode,[
			{name: "dragenter",handlerObject: this.widget,handlerMethod: "handleDragEnterEvent"},
			{name: "dragover",handlerObject: this.widget,handlerMethod: "handleDragOverEvent"},
			{name: "dragleave",handlerObject: this.widget,handlerMethod: "handleDragLeaveEvent"},
			{name: "dragend",handlerObject: this.widget,handlerMethod: "handleDragEndEvent"},
			{name: "drop", handlerObject: this.widget,handlerMethod: "handleDropEvent"},
			{name: "paste", handlerObject: this.widget,handlerMethod: "handlePasteEvent"},
			{name: "click",handlerObject: this.widget,handlerMethod: "handleClickEvent"}
		]);
	}
	// Insert the element into the DOM
	this.iframeDoc.body.appendChild(this.domNode);
}

/*
Copy styles from the dummy text area to the textarea in the iframe
*/
FramedEngine.prototype.copyStyles = function() {
	// Copy all styles
	$tw.utils.copyStyles(this.dummyTextArea,this.domNode);
	// Override the ones that should not be set the same as the dummy textarea
	this.domNode.style.display = "block";
	this.domNode.style.width = "100%";
	this.domNode.style.margin = "0";
	// In Chrome setting -webkit-text-fill-color overrides the placeholder text colour
	this.domNode.style["-webkit-text-fill-color"] = "currentcolor";
};

/*
Set the text of the engine if it doesn't currently have focus
*/
FramedEngine.prototype.setText = function(text,type) {
	if(!this.domNode.isTiddlyWikiFakeDom) {
		if(this.domNode.ownerDocument.activeElement !== this.domNode) {
			this.updateDomNodeText(text);
		}
		// Fix the height if needed
		this.fixHeight();
	}
};

/*
Update the DomNode with the new text
*/
FramedEngine.prototype.updateDomNodeText = function(text) {
	try {
		this.domNode.value = text;
	} catch(e) {
		// Ignore
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
	// Make sure styles are updated
	this.copyStyles();
	// Adjust height
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
Handle a focus event
*/
FramedEngine.prototype.handleFocusEvent = function(event) {
	if(this.widget.editCancelPopups) {
		$tw.popup.cancel(0);
	}
};

/*
Handle a click
*/
FramedEngine.prototype.handleClickEvent = function(event) {
	this.fixHeight();
	return true;
};

/*
Handle a dom "input" event which occurs when the text has changed
*/
FramedEngine.prototype.handleInputEvent = function(event) {
	this.widget.saveChanges(this.getText());
	this.fixHeight();
	if(this.widget.editInputActions) {
		this.widget.invokeActionString(this.widget.editInputActions,this,event,{actionValue: this.getText()});
	}
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
		newText = operation.text.substring(0,operation.cutStart) + operation.replacement + operation.text.substring(operation.cutEnd);
		// Attempt to use a execCommand to modify the value of the control
		if(this.iframeDoc.queryCommandSupported("insertText") && this.iframeDoc.queryCommandSupported("delete") && !$tw.browser.isFirefox) {
			this.domNode.focus();
			this.domNode.setSelectionRange(operation.cutStart,operation.cutEnd);
			if(operation.replacement === "") {
				this.iframeDoc.execCommand("delete",false,"");
			} else {
				this.iframeDoc.execCommand("insertText",false,operation.replacement);
			}
		} else {
			this.domNode.value = newText;
		}
		this.domNode.focus();
		this.domNode.setSelectionRange(operation.newSelStart,operation.newSelEnd);
	}
	this.domNode.focus();
	return newText;
};

exports.FramedEngine = FramedEngine;

})();
