/*\
title: $:/core/modules/widgets/Void.js
type: application/javascript
module-type: widget

Void widget that is not intended for render.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var VoidNodeWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
VoidNodeWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
VoidNodeWidget.prototype.render = function(parent,nextSibling) {
	// Nothing to do for a void node
};

/*
Compute the internal state of the widget
*/
VoidNodeWidget.prototype.execute = function() {
	// Nothing to do for a void node
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
VoidNodeWidget.prototype.refresh = function(changedTiddlers) {
	return false;
};

exports.void = VoidNodeWidget;

})();
