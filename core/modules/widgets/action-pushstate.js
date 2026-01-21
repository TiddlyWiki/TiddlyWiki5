/*\
title: $:/core/modules/widgets/action-pushstate.js
type: application/javascript
module-type: widget

Action widget to push a tiddler title to browser history

\*/
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var PushStateWidget = function(parseTreeNode, options) {
	this.initialise(parseTreeNode, options);
};

/*
Inherit from the base widget class
*/
PushStateWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
PushStateWidget.prototype.render = function(parent, nextSibling) {
	this.computeAttributes();
	this.execute();
};

/*
Compute the internal state of the widget
*/
PushStateWidget.prototype.execute = function() {
	this.actionTiddler = this.getAttribute("$tiddler") || this.getVariable("currentTiddler");
};

/*
Refresh the widget by ensuring our attributes are up to date
*/
PushStateWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes["$tiddler"]) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

/*
Invoke the action associated with this widget
*/
PushStateWidget.prototype.invokeAction = function(triggeringWidget, event) {
	if(this.actionTiddler && typeof window !== "undefined" && window.history) {
		// Push state without changing URL
		window.history.pushState(
			{ tiddler: this.actionTiddler },
			"",
			window.location.href
		);
	}
	return true; // Action was invoked
};

exports["action-pushstate"] = PushStateWidget;
