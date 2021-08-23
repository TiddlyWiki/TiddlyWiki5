/*\
title: $:/core/modules/editor/engines/simple.js
type: application/javascript
module-type: library

Text editor engine based on a simple input or textarea tag

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var HEIGHT_VALUE_TITLE = "$:/config/TextEditor/EditorHeight/Height";

function SimpleEngine(options) {
	// Save our options
	options = options || {};
	this.widget = options.widget;
	this.value = options.value;
	this.parentNode = options.parentNode;
	this.nextSibling = options.nextSibling;
	// Construct the textarea or input node
	var tag = this.widget.editTag;
	if($tw.config.htmlUnsafeElements.indexOf(tag) !== -1) {
		tag = "input";
	}
	this.domNode = this.widget.document.createElement(tag);
	// Set the text
	if(this.widget.editTag === "textarea") {
		this.domNode.appendChild(this.widget.document.createTextNode(this.value));
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
	if(this.widget.editClass) {
		this.domNode.className = this.widget.editClass;
	}
	if(this.widget.editTabIndex) {
		this.domNode.setAttribute("tabindex",this.widget.editTabIndex);
	}
	if(this.widget.editAutoComplete) {
		this.domNode.setAttribute("autocomplete",this.widget.editAutoComplete);
	}
	if(this.widget.isDisabled === "yes") {
		this.domNode.setAttribute("disabled",true);
	}
	// Add an input event handler
	$tw.utils.addEventListeners(this.domNode,[
		{name: "focus", handlerObject: this, handlerMethod: "handleFocusEvent"},
		{name: "input", handlerObject: this, handlerMethod: "handleInputEvent"}
	]);
	// Insert the element into the DOM
	this.parentNode.insertBefore(this.domNode,this.nextSibling);
	this.widget.domNodes.push(this.domNode);
}

/*
Set the text of the engine if it doesn't currently have focus
*/
SimpleEngine.prototype.setText = function(text,type) {
	if(!this.domNode.isTiddlyWikiFakeDom) {
		if(this.domNode.ownerDocument.activeElement !== this.domNode || text === "") {
			this.updateDomNodeText(text);
		}
		// Fix the height if needed
		this.fixHeight();
	}
};

/*
Update the DomNode with the new text
*/
SimpleEngine.prototype.updateDomNodeText = function(text) {
	try {
		this.domNode.value = text;
	} catch(e) {
		// Ignore
	}
};

/*
Get the text of the engine
*/
SimpleEngine.prototype.getText = function() {
	return this.domNode.value;
};

/*
Fix the height of textarea to fit content
*/
SimpleEngine.prototype.fixHeight = function() {
	if(this.widget.editTag === "textarea") {
		if(this.widget.editAutoHeight) {
			if(this.domNode && !this.domNode.isTiddlyWikiFakeDom) {
				$tw.utils.resizeTextAreaToFit(this.domNode,this.widget.editMinHeight);
			}
		} else {
			var fixedHeight = parseInt(this.widget.wiki.getTiddlerText(HEIGHT_VALUE_TITLE,"400px"),10);
			fixedHeight = Math.max(fixedHeight,20);
			this.domNode.style.height = fixedHeight + "px";
		}
	}
};

/*
Focus the engine node
*/
SimpleEngine.prototype.focus  = function() {
	if(this.domNode.focus && this.domNode.select) {
		this.domNode.focus();
		this.domNode.select();
	}
};

/*
Handle a dom "input" event which occurs when the text has changed
*/
SimpleEngine.prototype.handleInputEvent = function(event) {
	this.widget.saveChanges(this.getText());
	this.fixHeight();
	if(this.widget.editInputActions) {
		this.widget.invokeActionString(this.widget.editInputActions);
	}
	return true;
};

/*
Handle a dom "focus" event
*/
SimpleEngine.prototype.handleFocusEvent = function(event) {
	if(this.widget.editCancelPopups) {
		$tw.popup.cancel(0);
	}
	if(this.widget.editFocusPopup) {
		$tw.popup.triggerPopup({
			domNode: this.domNode,
			title: this.widget.editFocusPopup,
			wiki: this.widget.wiki,
			force: true
		});
	}
	return true;
};

/*
Create a blank structure representing a text operation
*/
SimpleEngine.prototype.createTextOperation = function() {
	return null;
};

/*
Execute a text operation
*/
SimpleEngine.prototype.executeTextOperation = function(operation) {
};

exports.SimpleEngine = SimpleEngine;

})();
