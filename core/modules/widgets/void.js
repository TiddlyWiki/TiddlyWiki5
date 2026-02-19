/*\
title: $:/core/modules/widgets/void.js
type: application/javascript
module-type: widget
\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var VoidNodeWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

VoidNodeWidget.prototype = new Widget();

exports.void = VoidNodeWidget;
