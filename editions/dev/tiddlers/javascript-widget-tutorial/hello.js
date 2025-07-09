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
	const textNode = this.document.createTextNode("Hello, World!");
	parent.insertBefore(textNode,nextSibling);
	this.domNodes.push(textNode);
};

exports.hello = MyWidget;
