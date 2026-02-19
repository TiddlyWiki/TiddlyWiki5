/*\
title: $:/core/modules/widgets/fill.js
type: application/javascript
module-type: widget
\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var FillWidget = function(parseTreeNode,options) {
	// Initialise
	this.initialise(parseTreeNode,options);
};

FillWidget.prototype = new Widget();

FillWidget.prototype.execute = function() {
	// Do nothing. Make no child widgets. $Fill widgets should be invisible when naturally encountered. Instead, their parseTreeNodes are made available to $slot widgets that want it.
};

exports.fill = FillWidget;
