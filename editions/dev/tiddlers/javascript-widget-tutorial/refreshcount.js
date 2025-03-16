/*\

widget to count the number of times this widget refreshes

\*/
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var MyWidget = function(parseTreeNode, options) {
	this.refreshCount = 0;
	this.initialise(parseTreeNode, options);
};

/*
Inherit from the base widget class
*/
MyWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
MyWidget.prototype.render = function(parent, nextSibling) {
	this.parentDomNode = parent;
	var textNode = this.document.createTextNode(this.refreshCount + " refreshes");
	parent.insertBefore(textNode, nextSibling);
	this.domNodes.push(textNode);
};

MyWidget.prototype.refresh = function(changedTiddlers) {
	// Regenerate and rerender the widget and replace the existing DOM node
	this.refreshCount++;
	this.refreshSelf();
	return true;
};

exports.refreshcount = MyWidget;
