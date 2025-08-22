/*\
title: $:/core/modules/widgets/action-navigate.js
type: application/javascript
module-type: widget

Action widget to navigate to a tiddler

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

class NavigateWidget extends Widget {
	constructor(parseTreeNode, options) {
		super();
		this.initialise(parseTreeNode, options);
	}
	/*
	Render this widget into the DOM
	*/
	render(parent, nextSibling) {
		this.computeAttributes();
		this.execute();
	}
	/*
	Compute the internal state of the widget
	*/
	execute() {
		this.actionTo = this.getAttribute("$to");
		this.actionScroll = this.getAttribute("$scroll");
	}
	/*
	Refresh the widget by ensuring our attributes are up to date
	*/
	refresh(changedTiddlers) {
		var changedAttributes = this.computeAttributes();
		if (changedAttributes["$to"] || changedAttributes["$scroll"]) {
			this.refreshSelf();
			return true;
		}
		return this.refreshChildren(changedTiddlers);
	}
	/*
	Invoke the action associated with this widget
	*/
	invokeAction(triggeringWidget, event) {
		event = event || {};
		var bounds = triggeringWidget && triggeringWidget.getBoundingClientRect && triggeringWidget.getBoundingClientRect(), suppressNavigation = event.metaKey || event.ctrlKey || (event.button === 1);
		if (this.actionScroll === "yes") {
			suppressNavigation = false;
		} else if (this.actionScroll === "no") {
			suppressNavigation = true;
		}
		this.dispatchEvent({
			type: "tm-navigate",
			navigateTo: this.actionTo === undefined ? this.getVariable("currentTiddler") : this.actionTo,
			navigateFromTitle: this.getVariable("storyTiddler"),
			navigateFromNode: triggeringWidget,
			navigateFromClientRect: bounds && {
				top: bounds.top, left: bounds.left, width: bounds.width, right: bounds.right, bottom: bounds.bottom, height: bounds.height
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
	}
}

exports["action-navigate"] = NavigateWidget;
