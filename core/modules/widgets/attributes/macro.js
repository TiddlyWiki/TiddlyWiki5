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
	return this.widget.getVariable(this.macro.name, {params: this.macro.params});
};

MacroAttribute.prototype.recompute = function(changedTiddlers) {
	this.value = this.compute();
	return this.value;
};


exports.macro = MacroAttribute;

})();
	