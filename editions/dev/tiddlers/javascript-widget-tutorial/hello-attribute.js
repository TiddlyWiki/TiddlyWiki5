/*\

Hello, World widget

\*/
"use strict";

const Widget = require("$:/core/modules/widgets/widget.js").widget;

const MyWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
MyWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
MyWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	const message = this.getAttribute("message","World");
	const textNode = this.document.createTextNode(`Hello, ${message}!`);
	parent.insertBefore(textNode,nextSibling);
	this.domNodes.push(textNode);
};

/*
A widget with optimized performance will selectively refresh, but here we refresh always
*/
MyWidget.prototype.refresh = function(changedTiddlers) {
	// Regenerate and rerender the widget and
	// replace the existing DOM node
	this.refreshSelf();
	return true;
};

exports.hello = MyWidget;
