/*\
title: $:/core/modules/widgets/keyboard.js
type: application/javascript
module-type: widget

Keyboard shortcut widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var KeyboardWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
KeyboardWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
KeyboardWidget.prototype.render = function(parent,nextSibling) {
	var self = this;
	// Remember parent
	this.parentDomNode = parent;
	// Compute attributes and execute state
	this.computeAttributes();
	this.execute();
	// Create element
	var domNode = this.document.createElement("div");
	// Assign classes
	var classes = (this["class"] || "").split(" ");
	classes.push("tw-keyboard");
	domNode.className = classes.join(" ");
	// Add a keyboard event handler
	domNode.addEventListener("keydown",function (event) {
		if(event.keyCode === self.keyInfo.keyCode && 
			event.shiftKey === self.keyInfo.shiftKey && 
			event.altKey === self.keyInfo.altKey && 
			event.ctrlKey === self.keyInfo.ctrlKey) {
			self.dispatchMessage(event);
			event.preventDefault();
			event.stopPropagation();
			return true;
		}
		return false;
	},false);
	// Insert element
	parent.insertBefore(domNode,nextSibling);
	this.renderChildren(domNode,null);
	this.domNodes.push(domNode);
};

KeyboardWidget.prototype.dispatchMessage = function(event) {
	this.dispatchEvent({type: this.message, param: this.param, tiddlerTitle: this.getVariable("currentTiddler")});
};

/*
Compute the internal state of the widget
*/
KeyboardWidget.prototype.execute = function() {
	// Get attributes
	this.message = this.getAttribute("message");
	this.param = this.getAttribute("param");
	this.key = this.getAttribute("key");
	this.keyInfo = $tw.utils.parseKeyDescriptor(this.key);
	this["class"] = this.getAttribute("class");
	// Make child widgets
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
KeyboardWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.message || changedAttributes.param || changedAttributes.key || changedAttributes["class"]) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

exports.keyboard = KeyboardWidget;

})();
