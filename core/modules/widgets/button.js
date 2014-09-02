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
	this.mouseInside = false;
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
	// Assign other attributes
	if(this.style) {
		domNode.setAttribute("style",this.style);
	}
	if(this.title) {
		domNode.setAttribute("title",this.title);
	}
	if(this["aria-label"]) {
		domNode.setAttribute("aria-label",this["aria-label"]);
	}
	// Add a click or mouse event handlers
	if(this.action === "hover") {
		$tw.utils.addEventListeners(domNode, [{name: "mouseenter", handlerObject: this}]);
		$tw.utils.addEventListeners(domNode, [{name: "mouseleave", handlerObject: this}]);
	} else {
		// This.action could be === "click" but since "click" is the default, we
		// will just handle it here.
		$tw.utils.addEventListeners(domNode, [{name: "click", handlerObject: this}]);
	}
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
		type: "tm-navigate",
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
	this.action = this.getAttribute("action","click");
	this["class"] = this.getAttribute("class","");
	this["aria-label"] = this.getAttribute("aria-label");
	this.title = this.getAttribute("title");
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
	if(changedAttributes.to || changedAttributes.message || changedAttributes.param || changedAttributes.set || changedAttributes.setTo || changedAttributes.popup || changedAttributes.action || changedAttributes["class"] || changedAttributes.selectedClass || changedAttributes.style || (this.set && changedTiddlers[this.set]) || (this.popup && changedTiddlers[this.popup])) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

/*
Handler for click/mouse events
*/
ButtonWidget.prototype.handleEvent = function (event) {
	var self = this;
	var handled = false;
	switch (event.type) {
		case "click":
			handled =  self.triggerActions(event);
			break;
		case "mouseenter":
			if (self.mouseInside == false) {
				self.mouseInside = !self.mouseInside;

				handled = self.triggerActions(event);
			}
			break;
		case "mouseleave":
			//Trigger popup again (to close)
			//Other actions are not triggered again
			if (self.mouseInside == true) {
				self.mouseInside = !self.mouseInside;

				if (self.popup) {
					self.triggerPopup(event);
					handled = true;
				}
			}
			break;
		default:
			// Don't handle other events.
	}
	if(handled) {
		event.preventDefault();
		event.stopPropagation();
	}
	// This is expected to be a void function, thus nothing to return
}

/*
Trigger the configured actions
*/
ButtonWidget.prototype.triggerActions = function(event) {
	var self = this;
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
	return handled;
}

exports.button = ButtonWidget;

})();
