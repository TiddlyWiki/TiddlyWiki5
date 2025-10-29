/*\
title: $:/core/modules/widgets/keyboard.js
type: application/javascript
module-type: widget

Keyboard shortcut widget

\*/

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
	this.domNode = domNode;
	this.assignDomNodeClasses();
	// Add a keyboard event handler
	$tw.utils.addEventListeners(domNode,[
		{name: "keydown", handlerObject: this, handlerMethod: "handleChangeEvent"}
	]);
	// Insert element
	parent.insertBefore(domNode,nextSibling);
	this.renderChildren(domNode,null);
	this.domNodes.push(domNode);
};

KeyboardWidget.prototype.handleChangeEvent = function(event) {
	if ($tw.keyboardManager.handleKeydownEvent(event, {onlyPriority: true})) {
		return true;
	}

	var keyInfo = $tw.keyboardManager.getMatchingKeyDescriptor(event,this.keyInfoArray);
	if(keyInfo) {
		var handled = this.invokeActions(this,event);
		if(this.actions) {
			var variables = {
					"event-key": event.key,
					"event-code": event.code,
					"modifier": $tw.keyboardManager.getEventModifierKeyDescriptor(event)
				};
			if(keyInfo.keyDescriptor) {
				variables["event-key-descriptor"] = keyInfo.keyDescriptor;
			}
			this.invokeActionString(this.actions,this,event,variables);
		}
		this.dispatchMessage(event);
		if(handled || this.actions || this.message) {
			event.preventDefault();
			event.stopPropagation();
		}
		return true;
	}
	return false;
}

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
	if($tw.keyboardManager) {
		this.keyInfoArray = $tw.keyboardManager.parseKeyDescriptors(this.key);
		if(this.key.substr(0,2) === "((" && this.key.substr(-2,2) === "))") {
			this.shortcutTiddlers = [];
			var name = this.key.substring(2,this.key.length -2);
			$tw.utils.each($tw.keyboardManager.lookupNames,function(platformDescriptor) {
				self.shortcutTiddlers.push("$:/config/" + platformDescriptor + "/" + name);
			});
		}	
	}
	// Make child widgets
	this.makeChildWidgets();
};

KeyboardWidget.prototype.assignDomNodeClasses = function() {
	var classes = this.getAttribute("class","").split(" ");
	classes.push("tc-keyboard");
	this.domNode.className = classes.join(" ");
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
KeyboardWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.message || changedAttributes.param || changedAttributes.key || changedAttributes.tag) {
		this.refreshSelf();
		return true;
	} else if(changedAttributes["class"]) {
		this.assignDomNodeClasses();
	}
	// Update the keyInfoArray if one of its shortcut-config-tiddlers has changed
	if(this.shortcutTiddlers && $tw.utils.hopArray(changedTiddlers,this.shortcutTiddlers) && $tw.keyboardManager) {
		this.keyInfoArray = $tw.keyboardManager.parseKeyDescriptors(this.key);
	}
	return this.refreshChildren(changedTiddlers);
};

exports.keyboard = KeyboardWidget;
