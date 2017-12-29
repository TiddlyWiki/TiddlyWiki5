/*\
title: $:/core/modules/widgets/attributes/indirect.js
type: application/javascript
module-type: attributevalue

An attribute value acquired via filter expression.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var IndirectAttribute = function(widget,node) {
	this.widget = widget;
	this.textReference = $tw.utils.parseTextReference(node.textReference);
	if (!this.textReference.title) this.currentTiddler = this.widget.getVariable("currentTiddler");
	this.value = this.compute();
};

/*
Inherit from the base ??? class
*/
//FormulaAttribute.prototype = new AttributeGizmo();

IndirectAttribute.prototype.compute = function() {
	var tr = this.textReference,
		title = tr.title || this.currentTiddler,
		wiki = this.widget.wiki;
	if(tr.field) {
		var tiddler = wiki.getTiddler(title);
		if(tr.field === "title") { // Special case so we can return the title of a non-existent tiddler
			return title;
		} else if(tiddler && $tw.utils.hop(tiddler.fields,tr.field)) {
			return tiddler.getFieldString(tr.field);
		} else {
			return "";
		}
	} else if(tr.index) {
		return wiki.extractTiddlerDataItem(title,tr.index,"");
	} else {
		return wiki.getTiddlerText(title,"");
	}
};

IndirectAttribute.prototype.refresh = function(changedTiddlers) {
	if (this.textReference.title) {
		// Recompute if the title tiddler changed.
		if (changedTiddlers[this.textReference.title])
			this.value = this.compute();
	}
	else {
		// Did currentTiddler change?
		var newTiddler = this.widget.getVariable("currentTiddler");
		if (newTiddler != this.currentTiddler) {
			this.currentTiddler = newTiddler;
			this.value = this.compute();
		}
		else if (changedTiddlers[this.currentTiddler]) {
			// Recompute if the tiddler changed.
			this.value = this.compute();
		}
	}
	// Return the latest value.
	return this.value;
};


exports.indirect = IndirectAttribute;

})();
	