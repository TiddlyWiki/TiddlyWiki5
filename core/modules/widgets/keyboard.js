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
	var domNode = this.document.createElement(tag);
	// Assign classes
	var classes = (this["class"] || "").split(" ");
	classes.push("tc-keyboard");
	domNode.className = classes.join(" ");
	// Add a keyboard event handler
	domNode.addEventListener("keydown",function (event) {
		if($tw.keyboardManager.checkKeyDescriptors(event,self.keyInfoArray)) {
			var handled = self.invokeActions(self,event);
			if(self.actions) {
				self.invokeActionString(self.actions,self,event);
			}
			self.dispatchMessage(event);
			if(handled || self.actions || self.message) {
				event.preventDefault();
				event.stopPropagation();
			}
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
	var self = this;
	// Get attributes
	this.actions = this.getAttribute("actions","");
	this.message = this.getAttribute("message","");
	this.param = this.getAttribute("param","");
	this.key = this.getAttribute("key","");
	this.tag = this.getAttribute("tag","");
	this.keyInfoArray = $tw.keyboardManager.parseKeyDescriptors(this.key);
	this["class"] = this.getAttribute("class","");
	if(this.key.substr(0,2) === "((" && this.key.substr(-2,2) === "))") {
		this.shortcutTiddlers = [];
		var name = this.key.substring(2,this.key.length -2);
		$tw.utils.each($tw.keyboardManager.lookupNames,function(platformDescriptor) {
			self.shortcutTiddlers.push("$:/config/" + platformDescriptor + "/" + name);
		});
	}
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
	// Update the keyInfoArray if one of its shortcut-config-tiddlers has changed
	if(this.shortcutTiddlers && $tw.utils.hopArray(changedTiddlers,this.shortcutTiddlers)) {
		this.keyInfoArray = $tw.keyboardManager.parseKeyDescriptors(this.key);
	}
	return this.refreshChildren(changedTiddlers);
};

exports.keyboard = KeyboardWidget;

})();
