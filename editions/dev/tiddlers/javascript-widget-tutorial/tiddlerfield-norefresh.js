/*\

Hello, World widget

\*/
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var MyWidget = function(parseTreeNode, options) {
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
	var text = this.wiki.getTiddlerText("test", "<empty>")
	var textNode = this.document.createTextNode(text);
	parent.insertBefore(textNode, nextSibling);
	this.domNodes.push(textNode);
};

exports.tiddlerfield = MyWidget;
