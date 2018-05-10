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
	var tag = this.parseTreeNode.isBlock ? "div" : "span";
	if(this.tag && $tw.config.htmlUnsafeElements.indexOf(this.tag) === -1) {
		tag = this.tag;
	}
	// Create element
	var domNode,
	    classes;
	if(this.global !== "yes") {
		domNode = this.document.createElement(tag);
		// Assign classes
		classes = (this["class"] || "").split(" ");
		classes.push("tc-keyboard");
		domNode.className = classes.join(" ");
	} else {
		domNode = document.body;
	}
	// Add a keyboard event handler
	var actionInvoked = null,
	    messageInvoked = null;
	domNode.addEventListener("keydown",function (event) {
		if($tw.keyboardManager.checkKeyDescriptors(event,self.keyInfoArray)) {
			self.invokeActions(self,event);
			if(self.actions && actionInvoked === null) {
				self.invokeActionString(self.actions,self,event);
				actionInvoked = "done";
			}
			if(self.message && messageInvoked === null) {
				self.dispatchMessage(event);
				messageInvoked = "done";
			}
			event.preventDefault();
			event.stopPropagation();
			actionInvoked = null;
			messageInvoked = null;
			return true;
		}
		return false;
	},false);
	if(this.global !== "yes") {
		// Insert element
		parent.insertBefore(domNode,nextSibling);
	}
	this.renderChildren(domNode,null);
	if(this.global !== "yes") {
		this.domNodes.push(domNode);
	}
};

KeyboardWidget.prototype.dispatchMessage = function(event) {
	this.dispatchEvent({type: this.message, param: this.param, tiddlerTitle: this.getVariable("currentTiddler")});
};

/*
Compute the internal state of the widget
*/
KeyboardWidget.prototype.execute = function() {
	// Get attributes
	this.actions = this.getAttribute("actions");
	this.message = this.getAttribute("message");
	this.param = this.getAttribute("param");
	this.key = this.getAttribute("key");
	this.tag = this.getAttribute("tag");
	this.keyInfoArray = $tw.keyboardManager.parseKeyDescriptors(this.key);
	this.global = this.getAttribute("global","no");
	this["class"] = this.getAttribute("class");
	// Make child widgets
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
KeyboardWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.message || changedAttributes.param || changedAttributes.key || changedAttributes["class"] || changedAttributes.tag) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

exports.keyboard = KeyboardWidget;

})();
