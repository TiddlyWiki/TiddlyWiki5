/*\
title: $:/core/modules/widgets/raw.js
type: application/javascript
module-type: widget

Raw widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var RawWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
RawWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
RawWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.execute();
	var span = this.document.createElement("span");
	span.innerHTML=this.parseTreeNode.html;
	parent.insertBefore(span,nextSibling);
	this.domNodes.push(span);
};

/*
Compute the internal state of the widget
*/
RawWidget.prototype.execute = function() {
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
RawWidget.prototype.refresh = function(changedTiddlers) {
	return false;
};

exports.raw = RawWidget;

})();
