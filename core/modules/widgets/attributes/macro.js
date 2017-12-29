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

var Formulas = require("$:/plugins/ebalster/formula/compile.js");
var Operands = require("$:/plugins/ebalster/formula/operands.js");

var MacroAttribute = function(widget, node) {
	this.widget = widget;
	this.macro = node.value;
	this.value = this.compute();
};

/*
Inherit from the base ??? class
*/
//FormulaAttribute.prototype = new Widget();

MacroAttribute.prototype.compute = function() {
	var val = this.widget.getVariable(this.macro.name, {params: this.macro.params});
	if (val == null) val = "";
	return val;
};

MacroAttribute.prototype.refresh = function(changedTiddlers) {
	this.value = this.compute();
	return this.value;
};


exports.macro = MacroAttribute;

})();
	