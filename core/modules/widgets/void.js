/*\
title: $:/core/modules/widgets/void.js
type: application/javascript
module-type: widget

Void widget that corresponds to pragma and comment AST nodes, etc. It does not render itself but renders all its children.

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var VoidNodeWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
VoidNodeWidget.prototype = new Widget();

exports.void = VoidNodeWidget;
