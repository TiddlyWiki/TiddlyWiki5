/*\
title: $:/core/modules/widgets/error.js
type: application/javascript
module-type: widget

Error widget

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

class ErrorWidget extends Widget {
	constructor(parseTreeNode, options) {
		super();
		this.initialise(parseTreeNode, options);
	}
	/*
	Render this widget into the DOM
	*/
	render(parent, nextSibling) {
		this.parentDomNode = parent;
		this.computeAttributes();
		this.execute();
		var message = this.getAttribute("$message", "Unknown error"), domNode = this.document.createElement("span");
		domNode.appendChild(this.document.createTextNode(message));
		domNode.className = "tc-error";
		parent.insertBefore(domNode, nextSibling);
		this.domNodes.push(domNode);
	}
	/*
	Compute the internal state of the widget
	*/
	execute() {
		// Nothing to do for a text node
	}
	/*
	Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
	*/
	refresh(changedTiddlers) {
		var changedAttributes = this.computeAttributes();
		if (changedAttributes["$message"]) {
			this.refreshSelf();
			return true;
		} else {
			return false;
		}
	}
}

exports.error = ErrorWidget;
