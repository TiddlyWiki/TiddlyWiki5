/*\
title: $:/core/modules/widgets/browserpopstate.js
type: application/javascript
module-type: widget

Browser popstate listener widget that dispatches tm-navigate messages

\*/
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var BrowserPopStateWidget = function(parseTreeNode, options) {
	this.initialise(parseTreeNode, options);
};

/*
Inherit from the base widget class
*/
BrowserPopStateWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
BrowserPopStateWidget.prototype.render = function(parent, nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();

	// Set up the popstate listener
	if(typeof window !== "undefined" && window.history) {
		var self = this;
		this.popstateHandler = function(event) {
			self.handlePopState(event);
		};
		window.addEventListener("popstate", this.popstateHandler);
	}

	this.renderChildren(parent, nextSibling);
};

/*
Compute the internal state of the widget
*/
BrowserPopStateWidget.prototype.execute = function() {
	// Construct the child widgets
	this.makeChildWidgets();
};

/*
Handle popstate events from the browser
*/
BrowserPopStateWidget.prototype.handlePopState = function(event) {
	if(event.state && event.state.tiddler) {
		// Dispatch tm-navigate message that will bubble up to the parent NavigatorWidget
		this.dispatchEvent({
			type: "tm-navigate",
			navigateTo: event.state.tiddler,
			navigateSuppressNavigation: false // Don't add to history again
		});
	}
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
BrowserPopStateWidget.prototype.refresh = function(changedTiddlers) {
	return this.refreshChildren(changedTiddlers);
};

/*
Remove the event listener when the widget is removed
*/
BrowserPopStateWidget.prototype.removeChildDomNodes = function() {
	if(typeof window !== "undefined" && this.popstateHandler) {
		window.removeEventListener("popstate", this.popstateHandler);
	}
	// Call the base class method
	Object.getPrototypeOf(BrowserPopStateWidget.prototype).removeChildDomNodes.call(this);
};

exports.browserpopstate = BrowserPopStateWidget;
