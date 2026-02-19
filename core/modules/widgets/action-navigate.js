/*\
title: $:/core/modules/widgets/action-navigate.js
type: application/javascript
module-type: widget
\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var NavigateWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

NavigateWidget.prototype = new Widget();

NavigateWidget.prototype.render = function(parent,nextSibling) {
	this.computeAttributes();
	this.execute();
};

NavigateWidget.prototype.execute = function() {
	this.actionTo = this.getAttribute("$to");
	this.actionScroll = this.getAttribute("$scroll");
};

NavigateWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes["$to"] || changedAttributes["$scroll"]) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

NavigateWidget.prototype.invokeAction = function(triggeringWidget,event) {
	event = event || {};
	var bounds = triggeringWidget && triggeringWidget.getBoundingClientRect && triggeringWidget.getBoundingClientRect(),
		suppressNavigation = event.metaKey || event.ctrlKey || (event.button === 1);
	if(this.actionScroll === "yes") {
		suppressNavigation = false;
	} else if(this.actionScroll === "no") {
		suppressNavigation = true;
	}
	this.dispatchEvent({
		type: "tm-navigate",
		navigateTo: this.actionTo === undefined ? this.getVariable("currentTiddler") : this.actionTo,
		navigateFromTitle: this.getVariable("storyTiddler"),
		navigateFromNode: triggeringWidget,
		navigateFromClientRect: bounds && { top: bounds.top, left: bounds.left, width: bounds.width, right: bounds.right, bottom: bounds.bottom, height: bounds.height
		},
		navigateFromClientTop: bounds && bounds.top,
		navigateFromClientLeft: bounds && bounds.left,
		navigateFromClientWidth: bounds && bounds.width,
		navigateFromClientRight: bounds && bounds.right,
		navigateFromClientBottom: bounds && bounds.bottom,
		navigateFromClientHeight: bounds && bounds.height,
		navigateSuppressNavigation: suppressNavigation,
		metaKey: event.metaKey,
		ctrlKey: event.ctrlKey,
		altKey: event.altKey,
		shiftKey: event.shiftKey,
		event: event
	});
	return true; // Action was invoked
};

exports["action-navigate"] = NavigateWidget;
