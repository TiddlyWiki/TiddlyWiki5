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

/*
A widget with optimized performance will selectively refresh, but here we refresh always
*/
MyWidget.prototype.refresh = function(changedTiddlers) {
	// Regenerate and rerender the widget and
	// replace the existing DOM node
	this.refreshSelf();
	return true;
};

exports.tiddlerfield = MyWidget;
