/*\
title: $:/core/modules/widgets/text.js
type: application/javascript
module-type: widget

Text node widget

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var TextNodeWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
TextNodeWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
TextNodeWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	var text = this.getAttribute("text",this.parseTreeNode.text || "");
	text = text.replace(/\r/mg,"");
	var textNode = this.document.createTextNode(text);
	parent.insertBefore(textNode,nextSibling);
	this.domNodes.push(textNode);
};

/*
Compute the internal state of the widget
*/
TextNodeWidget.prototype.execute = function() {
	// Nothing to do for a text node
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
TextNodeWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.text) {
		this.refreshSelf();
		return true;
	} else {
		return false;
	}
};

exports.text = TextNodeWidget;
