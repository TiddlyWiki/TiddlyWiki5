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
Refresh if the attribute value changed since render
*/
MyWidget.prototype.refresh = function(changedTiddlers) {
	// Find which attributes have changed
	const changedAttributes = this.computeAttributes();
	if(changedAttributes.message) {
		this.refreshSelf();
		return true;
	} else {
		return false;
	}
};

exports.hello = MyWidget;
