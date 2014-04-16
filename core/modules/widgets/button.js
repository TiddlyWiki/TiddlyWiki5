/*\
title: $:/core/modules/widgets/button.js
type: application/javascript
module-type: widget

Button widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var ButtonWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
ButtonWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
ButtonWidget.prototype.render = function(parent,nextSibling) {
	var self = this;
	// Remember parent
	this.parentDomNode = parent;
	// Compute attributes and execute state
	this.computeAttributes();
	this.execute();
	// Create element
	var domNode = this.document.createElement("button");
	// Assign classes
	var classes = this["class"].split(" ") || [];
	if(this.selectedClass) {
		if(this.set && this.setTo && this.isSelected()) {
			$tw.utils.pushTop(classes,this.selectedClass.split(" "));
		}
		if(this.popup && this.isPoppedUp()) {
			$tw.utils.pushTop(classes,this.selectedClass.split(" "));
		}
	}
	domNode.className = classes.join(" ");
	// Assign classes
	if(this.style) {
		domNode.setAttribute("style",this.style);
	}
	// Add a click event handler
	domNode.addEventListener("click",function (event) {
		var handled = false;
		if(self.to) {
			self.navigateTo(event);
			handled = true;
		}
		if(self.message) {
			self.dispatchMessage(event);
			handled = true;
		}
		if(self.popup) {
			self.triggerPopup(event);
			handled = true;
		}
		if(self.set) {
			self.setTiddler();
			handled = true;
		}
		if(handled) {
			event.preventDefault();
			event.stopPropagation();
		}
		return handled;
	},false);
	// Insert element
	parent.insertBefore(domNode,nextSibling);
	this.renderChildren(domNode,null);
	this.domNodes.push(domNode);
};

ButtonWidget.prototype.isSelected = function() {
	var tiddler = this.wiki.getTiddler(this.set);
	return tiddler ? tiddler.fields.text === this.setTo : this.defaultSetValue === this.setTo;
};

ButtonWidget.prototype.isPoppedUp = function() {
	var tiddler = this.wiki.getTiddler(this.popup);
	var result = tiddler && tiddler.fields.text ? $tw.popup.readPopupState(this.popup,tiddler.fields.text) : false;
	return result;
};

ButtonWidget.prototype.navigateTo = function(event) {
	var bounds = this.domNodes[0].getBoundingClientRect();
	this.dispatchEvent({
		type: "tw-navigate",
		navigateTo: this.to,
		navigateFromTitle: this.getVariable("storyTiddler"),
		navigateFromNode: this,
		navigateFromClientRect: { top: bounds.top, left: bounds.left, width: bounds.width, right: bounds.right, bottom: bounds.bottom, height: bounds.height
		},
		navigateSuppressNavigation: event.metaKey || event.ctrlKey || (event.button === 1)
	});
};

ButtonWidget.prototype.dispatchMessage = function(event) {
	this.dispatchEvent({type: this.message, param: this.param, tiddlerTitle: this.getVariable("currentTiddler")});
};

ButtonWidget.prototype.triggerPopup = function(event) {
	$tw.popup.triggerPopup({
		domNode: this.domNodes[0],
		title: this.popup,
		wiki: this.wiki
	});
};

ButtonWidget.prototype.setTiddler = function() {
	this.wiki.setTextReference(this.set,this.setTo,this.getVariable("currentTiddler"));
};

/*
Compute the internal state of the widget
*/
ButtonWidget.prototype.execute = function() {
	// Get attributes
	this.to = this.getAttribute("to");
	this.message = this.getAttribute("message");
	this.param = this.getAttribute("param");
	this.set = this.getAttribute("set");
	this.setTo = this.getAttribute("setTo");
	this.popup = this.getAttribute("popup");
	this.hover = this.getAttribute("hover");
	this["class"] = this.getAttribute("class","");
	this.style = this.getAttribute("style");
	this.selectedClass = this.getAttribute("selectedClass");
	this.defaultSetValue = this.getAttribute("default");
	// Make child widgets
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
ButtonWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.to || changedAttributes.message || changedAttributes.param || changedAttributes.set || changedAttributes.setTo || changedAttributes.popup || changedAttributes.hover || changedAttributes["class"] || changedAttributes.selectedClass || changedAttributes.style || (this.set && changedTiddlers[this.set]) || (this.popup && changedTiddlers[this.popup])) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

exports.button = ButtonWidget;

})();
