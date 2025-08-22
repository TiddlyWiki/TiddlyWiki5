/*\
title: $:/core/modules/widgets/action-setfield.js
type: application/javascript
module-type: widget

Action widget to set a single field or index on a tiddler.

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

class SetFieldWidget extends Widget {
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
		this.actionTiddler = this.getAttribute("$tiddler") || (!this.hasParseTreeNodeAttribute("$tiddler") && this.getVariable("currentTiddler"));
		this.actionField = this.getAttribute("$field");
		this.actionIndex = this.getAttribute("$index");
		this.actionValue = this.getAttribute("$value");
		this.actionTimestamp = this.getAttribute("$timestamp", "yes") === "yes";
	}
	/*
	Refresh the widget by ensuring our attributes are up to date
	*/
	refresh(changedTiddlers) {
		// Nothing to refresh
		return this.refreshChildren(changedTiddlers);
	}
	/*
	Invoke the action associated with this widget
	*/
	invokeAction(triggeringWidget, event) {
		var self = this, options = {};
		if (this.actionTiddler) {
			options.suppressTimestamp = !this.actionTimestamp;
			if ((typeof this.actionField == "string") || (typeof this.actionIndex == "string") || (typeof this.actionValue == "string")) {
				this.wiki.setText(this.actionTiddler, this.actionField, this.actionIndex, this.actionValue, options);
			}
			$tw.utils.each(this.attributes, function (attribute, name) {
				if (name.charAt(0) !== "$") {
					self.wiki.setText(self.actionTiddler, name, undefined, attribute, options);
				}
			});
		}
		return true; // Action was invoked
	}
}

exports["action-setfield"] = SetFieldWidget;
