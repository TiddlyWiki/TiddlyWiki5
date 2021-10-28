/*\
title: $:/core/modules/widgets/attributes/macro.js
type: application/javascript
module-type: attributevalue

An attribute value acquired via macro expansion.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var MacroAttribute = function(widget,node) {
	this.widget = widget;
	this.macro = node.value;
	this.value = this.compute();
};

/*
Inherit from the base ??? class
*/
//FormulaAttribute.prototype = new AttributeGizmo();

MacroAttribute.prototype.compute = function() {
	var value = this.widget.getVariable(this.macro.name,{params: this.macro.params});
	if (value == null) value = "";
	return value;
};

MacroAttribute.prototype.refresh = function(changedTiddlers) {
	this.value = this.compute();
	return this.value;
};


exports.macro = MacroAttribute;

})();
	