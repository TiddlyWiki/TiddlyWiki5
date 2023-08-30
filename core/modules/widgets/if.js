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
};

/*
Inherit from the base widget class
*/
IfWidget.prototype = new Widget();

/*
Prepare child then and/or else widgets before they are created
*/
IfWidget.prototype.preprocessChildNodes = function() {
	var filter = this.parseTreeNode.attributes.filter;
	$tw.utils.each(this.parseTreeNode.children,function(childNode) {
		if(childNode.type === "then") {
			if(filter) {
				$tw.utils.addAttributeToParseTreeNode(childNode,filter);
			}
		} else if(childNode.type === "else") {
			$tw.utils.addAttributeToParseTreeNode(childNode,"filter","yes");
		}
		// elseif widgets have their own filter and don't need to be pre-processed
	});
}

/*
Compute the internal state of the widget
*/
IfWidget.prototype.execute = function() {
	// Set up then and/or else filters in parse tree
	this.preprocessChildNodes();
	// Make the child widgets
	this.makeChildWidgets();
	// Ensure each condition widget knows its next sibling
	this.linkConditions();
};

IfWidget.prototype.linkConditions = function() {
	var self = this,
		conditions = [];
	$tw.utils.each(this.children,function(childWidget) {
		if(self.isConditionChild(childWidget)) {
			conditions.push(childWidget);
		}
	});
	$tw.utils.each(conditions,function(childWidget,idx) {
		if(idx > 0) {
			conditions[idx-1].nextCondition = childWidget;
		}
	});
	// Last one will have nextCondition still undefined, which is what we want
}

IfWidget.prototype.isConditionChild = function(childWidget) {
	var type = childWidget.parseTreeNode.type;
	return (type === "then" || type === "else" || type === "elseif");
}

var ConditionWidget = function(parseTreeNode,options) {
	this.oldShouldRender = false;
	this.shouldRender = false;
	this.shortCircuited = false;
	this.nextCondition = undefined;
	this.initialise(parseTreeNode,options);
};
ConditionWidget.prototype = new Widget();

ConditionWidget.prototype.shortCircuit = function() {
	this.oldShouldRender = this.shouldRender;
	this.shouldRender = false;
	this.shortCircuited = true;
	if(this.nextCondition) {
		this.nextCondition.shortCircuit();
	}
}

ConditionWidget.prototype.calculateFilter = function() {
	if(this.shortCircuited) {
		return;
	}
	this.oldShouldRender = this.shouldRender;
	var result = this.wiki.filterTiddlers(this.filter,this);
	this.shouldRender = !!(result && result.length);
	if(this.shouldRender && this.nextCondition) {
		this.nextCondition.shortCircuit();
	}
}

ConditionWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent,nextSibling);
};

ConditionWidget.prototype.execute = function() {
	this.filter = this.getAttribute("filter","");
	this.calculateFilter();
	this.shortCircuited = false;
	var childNodes = this.shouldRender ? this.parseTreeNode.children : [];
	this.makeChildWidgets(childNodes);
};

ConditionWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.filter) {
		this.filter = this.getAttribute("filter","");
	}
	this.calculateFilter();
	this.shortCircuited = false;
	if(this.oldShouldRender === this.shouldRender) {
		return this.refreshChildren(changedTiddlers);
	} else {
		if(this.shouldRender) {
			// Went from false -> true, so we didn't have child widgets before
			this.makeChildWidgets();
			// Re-render self, but don't re-compute filter as it might be expensive and we already know the result
			this.shortCircuited = true;
			this.refreshSelf();
			return true;
		} else {
			// Went from true -> false, so skip refreshSelf as there's no need for the this.findNextSiblingDomNode() step
			this.removeChildDomNodes();
			return true;
		}
	}
}

exports.if = IfWidget;
exports.then = ConditionWidget;
exports.else = ConditionWidget;
exports.elseif = ConditionWidget;

})();
