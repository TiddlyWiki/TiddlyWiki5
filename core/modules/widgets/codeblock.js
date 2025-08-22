/*\
title: $:/core/modules/widgets/codeblock.js
type: application/javascript
module-type: widget

Code block node widget

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

class CodeBlockWidget extends Widget {
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
		var codeNode = this.document.createElement("code"), domNode = this.document.createElement("pre");
		codeNode.appendChild(this.document.createTextNode(this.getAttribute("code")));
		domNode.appendChild(codeNode);
		parent.insertBefore(domNode, nextSibling);
		this.domNodes.push(domNode);
		if (this.postRender) {
			this.postRender();
		}
	}
	/*
	Compute the internal state of the widget
	*/
	execute() {
		this.language = this.getAttribute("language");
	}
	/*
	Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
	*/
	refresh(changedTiddlers) {
		var changedAttributes = this.computeAttributes();
		if (changedAttributes.code || changedAttributes.language) {
			this.refreshSelf();
			return true;
		} else {
			return false;
		}
	}
}

exports.codeblock = CodeBlockWidget;
