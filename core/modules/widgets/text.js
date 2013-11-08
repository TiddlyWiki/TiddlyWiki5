/*\
title: $:/core/modules/widgets/text.js
type: application/javascript
module-type: widget

Text node widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
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
	this.execute();
	var textNode = this.document.createTextNode(this.parseTreeNode.text);
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
	return false;
};

/*
Remove any DOM nodes created by this widget
*/
TextNodeWidget.prototype.removeChildDomNodes = function() {
	$tw.utils.each(this.domNodes,function(domNode) {
		domNode.parentNode.removeChild(domNode);
	});
	this.domNodes = [];
};

exports.text = TextNodeWidget;

})();
