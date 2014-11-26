/*\
title: $:/core/modules/widgets/set.js
type: application/javascript
module-type: widget

Set variable widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var SetWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
SetWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
SetWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent,nextSibling);
};

/*
Compute the internal state of the widget
*/
SetWidget.prototype.execute = function() {
	// Get our parameters
	this.setName = this.getAttribute("name","currentTiddler");
	this.setFilter = this.getAttribute("filter");
	this.setValue = this.getAttribute("value");
	this.setEmptyValue = this.getAttribute("emptyValue");
	// Set context variable
	var value = this.setValue;
	if(this.setFilter) {
		var results = this.wiki.filterTiddlers(this.setFilter,this);
		if(!this.setValue) {
			value = $tw.utils.stringifyList(results);
		}
		if(results.length === 0 && this.setEmptyValue !== undefined) {
			value = this.setEmptyValue;
		}
	}
	this.setVariable(this.setName,value,this.parseTreeNode.params);
	// Construct the child widgets
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
SetWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.name || changedAttributes.filter || changedAttributes.value || changedAttributes.emptyValue) {
		this.refreshSelf();
		return true;
	} else {
		return this.refreshChildren(changedTiddlers);		
	}
};

exports.setvariable = SetWidget;
exports.set = SetWidget;

})();
