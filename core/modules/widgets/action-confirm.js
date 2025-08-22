/*\

title: $:/core/modules/widgets/action-confirm.js
type: application/javascript
module-type: widget

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

class ConfirmWidget extends Widget {
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
		this.parentDomNode = parent;
		this.renderChildren(parent, nextSibling);
	}
	/*
	Compute the internal state of the widget
	*/
	execute() {
		this.message = this.getAttribute("$message", $tw.language.getString("ConfirmAction"));
		this.prompt = (this.getAttribute("$prompt", "yes") == "no" ? false : true);
		this.makeChildWidgets();
	}
	/*
	Refresh the widget by ensuring our attributes are up to date
	*/
	refresh(changedTiddlers) {
		var changedAttributes = this.computeAttributes();
		if (changedAttributes["$message"] || changedAttributes["$prompt"]) {
			this.refreshSelf();
			return true;
		}
		return this.refreshChildren(changedTiddlers);
	}
	/*
	Invoke the action associated with this widget
	*/
	invokeAction(triggeringWidget, event) {
		var invokeActions = true, handled = true, win = event && event.event && event.event.view ? event.event.view : window;
		if (this.prompt) {
			invokeActions = win.confirm(this.message);
		}
		if (invokeActions) {
			handled = this.invokeActions(triggeringWidget, event);
		}
		return handled;
	}
	allowActionPropagation() {
		return false;
	}
}

exports["action-confirm"] = ConfirmWidget;
