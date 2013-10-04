/*\
title: $:/core/modules/widgets/entity.js
type: application/javascript
module-type: new_widget

HTML entity widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var EntityWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
EntityWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
EntityWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.execute();
	var textNode = this.document.createTextNode($tw.utils.entityDecode(this.parseTreeNode.entity));
	parent.insertBefore(textNode,nextSibling);
	this.domNodes.push(textNode);
};

/*
Compute the internal state of the widget
*/
EntityWidget.prototype.execute = function() {
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
EntityWidget.prototype.refresh = function(changedTiddlers) {
	return false;
};

/*
Remove any DOM nodes created by this widget
*/
EntityWidget.prototype.removeChildDomNodes = function() {
	$tw.utils.each(this.domNodes,function(domNode) {
		domNode.parentNode.removeChild(domNode);
	});
	this.domNodes = [];
};

exports.entity = EntityWidget;

})();
