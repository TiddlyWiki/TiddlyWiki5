/*\
title: $:/core/modules/widgets/if.js
type: application/javascript
module-type: widget

If-then-elseif-else widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var IfWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
	this.conditions = [];
};

/*
Inherit from the base widget class
*/
IfWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
IfWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent,nextSibling);
};

IfWidget.prototype.safelyComputeAttribute = function(attribute,defaultValue) {
	return attribute ? this.computeAttribute(attribute) : defaultValue;
}

IfWidget.prototype.computeConditions = function() {
	var self = this;
	this.filterString = this.safelyComputeAttribute(this.parseTreeNode.attributes.filter,"");
	this.conditions = [{filter: this.filterString, parseTree: undefined}];
	$tw.utils.each(this.parseTreeNode.children,function(childNode) {
		if(childNode.type === "then") {
			self.conditions[0].parseTree = childNode;
		} else if(childNode.type === "elseif") {
			var childFilter = self.safelyComputeAttribute(childNode.attributes && childNode.attributes.filter,"")
			self.conditions.push({filter: childFilter, parseTree: childNode});
		} else if(childNode.type === "else") {
			self.conditions.push({filter: true, parseTree: childNode});
		}
	});
}

IfWidget.prototype.findFirstCondition = function() {
	var self = this;
	var resultIdx = -1;
	$tw.utils.each(this.conditions,function(condition,idx) {
		var filter = condition && condition.filter || "";
		if(filter === true) {
			resultIdx = idx;
			return false; // Short-circuit
		}
		var filterResult = self.wiki.filterTiddlers(filter,self) || [];
		if(filterResult && filterResult.length) {
			resultIdx = idx;
			return false; // Short-circuit
		}
	})
	return resultIdx;
}

/*
Compute the internal state of the widget
*/
IfWidget.prototype.execute = function() {
	// Get our parameters
	this.computeConditions();
	// Choose the appropriate child widget to construct
	this.activeConditionIdx = this.findFirstCondition();
	if(this.activeConditionIdx < 0) {
		this.activeChildNodes = [];
	} else {
		var condition = this.conditions[this.activeConditionIdx];
		this.activeChildNodes = condition && condition.parseTree && condition.parseTree.children;
	}
	// Make the child widgets
	this.makeChildWidgets(this.activeChildNodes || []);
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
IfWidget.prototype.refresh = function(changedTiddlers) {
	var previousConditions = this.conditions;
	this.computeConditions();
	var changed = previousConditions.length !== this.conditions.length;
	var previousActiveIdx = this.activeConditionIdx;
	this.activeConditionIdx = this.findFirstCondition();
	changed = this.activeConditionIdx !== previousActiveIdx || changed;
	// Refresh if an attribute has changed, or the type associated with the target tiddler has changed
	if(changed) {
		this.refreshSelf();
		return true;
	} else {
		return this.refreshChildren(changedTiddlers);
	}
};

exports.if = IfWidget;
// exports['if'] = IfWidget; // Uncomment if the above is a syntax error

})();
