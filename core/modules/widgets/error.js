/*\
title: $:/core/modules/widgets/error.js
type: application/javascript
module-type: widget
\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var ErrorWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

ErrorWidget.prototype = new Widget();

ErrorWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	var message = this.getAttribute("$message","Unknown error"),
		domNode = this.document.createElement("span");
	domNode.appendChild(this.document.createTextNode(message));
	domNode.className = "tc-error";
	parent.insertBefore(domNode,nextSibling);
	this.domNodes.push(domNode);
};

ErrorWidget.prototype.execute = function() {
	// Nothing to do for a text node
};

ErrorWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes["$message"]) {
		this.refreshSelf();
		return true;
	} else {
		return false;
	}
};

exports.error = ErrorWidget;
