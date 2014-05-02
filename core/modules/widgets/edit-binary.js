/*\
title: $:/core/modules/widgets/edit-binary.js
type: application/javascript
module-type: widget

Edit-binary widget; placeholder for editing binary tiddlers

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var BINARY_WARNING_MESSAGE = "$:/core/ui/BinaryWarning";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var EditBinaryWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
EditBinaryWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
EditBinaryWidget.prototype.render = function(parent,nextSibling) {
	var self = this;
	// Save the parent dom node
	this.parentDomNode = parent;
	// Compute our attributes
	this.computeAttributes();
	// Execute our logic
	this.execute();
	this.renderChildren(parent,nextSibling);
};

/*
Compute the internal state of the widget
*/
EditBinaryWidget.prototype.execute = function() {
	// Construct the child widgets
	this.makeChildWidgets([{
		type: "transclude",
		attributes: {
			tiddler: {type: "string", value: BINARY_WARNING_MESSAGE}
		}
	}]);
};

/*
Refresh by refreshing our child widget
*/
EditBinaryWidget.prototype.refresh = function(changedTiddlers) {
	return this.refreshChildren(changedTiddlers);
};

exports["edit-binary"] = EditBinaryWidget;

})();
