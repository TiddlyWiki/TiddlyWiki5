/*\
title: $:/core/modules/widgets/fill.js
type: application/javascript
module-type: widget

Sub-widget used by the transclude widget for specifying values for slots within transcluded content. It doesn't do anything by itself because the transclude widget only ever deals with the parse tree nodes, and doesn't instantiate the widget itself

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var FillWidget = function(parseTreeNode,options) {
	// Initialise
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
FillWidget.prototype = new Widget();

FillWidget.prototype.execute = function() {
	// Do nothing. Make no child widgets. $Fill widgets should be invisible when naturally encountered. Instead, their parseTreeNodes are made available to $slot widgets that want it.
};

exports.fill = FillWidget;
