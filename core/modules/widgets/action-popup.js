/*\
title: $:/core/modules/widgets/action-popup.js
type: application/javascript
module-type: widget

Action widget to trigger a popup.

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var Popup = require("$:/core/modules/utils/dom/popup.js");

class ActionPopupWidget extends Widget {
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
		this.actionState = this.getAttribute("$state");
		this.actionCoords = this.getAttribute("$coords");
		this.floating = this.getAttribute("$floating", "no") === "yes";
	}
	/*
	Refresh the widget by ensuring our attributes are up to date
	*/
	refresh(changedTiddlers) {
		var changedAttributes = this.computeAttributes();
		if (changedAttributes["$state"] || changedAttributes["$coords"]) {
			this.refreshSelf();
			return true;
		}
		return this.refreshChildren(changedTiddlers);
	}
	/*
	Invoke the action associated with this widget
	*/
	invokeAction(triggeringWidget, event) {
		// Trigger the popup
		var coordinates = Popup.parseCoordinates(this.actionCoords || "");
		if (coordinates) {
			$tw.popup.triggerPopup({
				domNode: null,
				domNodeRect: {
					left: coordinates.left,
					top: coordinates.top,
					width: coordinates.width,
					height: coordinates.height
				},
				title: this.actionState,
				wiki: this.wiki,
				floating: this.floating,
				absolute: coordinates.absolute
			});
		} else {
			$tw.popup.cancel(0);
		}
		return true; // Action was invoked
	}
}

exports["action-popup"] = ActionPopupWidget;
