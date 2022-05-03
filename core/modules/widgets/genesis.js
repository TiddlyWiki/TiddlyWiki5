/*\
title: $:/core/modules/widgets/genesis.js
type: application/javascript
module-type: widget

Genesis widget for dynamically creating widgets

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var GenesisWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
GenesisWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
GenesisWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent,nextSibling);
};

/*
Compute the internal state of the widget
*/
GenesisWidget.prototype.execute = function() {
	var self = this;
	// Collect attributes
	this.genesisType = this.getAttribute("$type","element");
	this.genesisTag = this.getAttribute("$tag","div");
	this.genesisNames = this.getAttribute("$names","");
	this.genesisValues = this.getAttribute("$values","");
	// Construct parse tree
	var parseTreeNodes = [{
		type: this.genesisType,
		tag: this.genesisTag,
		attributes: {},
		orderedAttributes: [],
		children: this.parseTreeNode.children || []
	}];
	// Apply attributes in $names/$values
	this.attributeNames = [];
	this.attributeValues = [];
	if(this.genesisNames && this.genesisValues) {
		this.attributeNames = this.wiki.filterTiddlers(self.genesisNames,this);
		this.attributeValues = this.wiki.filterTiddlers(self.genesisValues,this);
		$tw.utils.each(this.attributeNames,function(varname,index) {
			$tw.utils.addAttributeToParseTreeNode(parseTreeNodes[0],varname,self.attributeValues[index] || "");
		});
	}
	// Apply explicit attributes
	$tw.utils.each(this.attributes,function(value,name) {
		if(name.charAt(0) === "$") {
			if(name.charAt(1) === "$") {
				// Double $$ is changed to a single $
				name = name.substr(1);
			} else {
				// Single dollar is ignored
				return;
			}
		}
		$tw.utils.addAttributeToParseTreeNode(parseTreeNodes[0],name,value);
	});
	// Construct the child widgets
	this.makeChildWidgets(parseTreeNodes);
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
GenesisWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes(),
		filterNames = this.getAttribute("$names",""),
		filterValues = this.getAttribute("$values",""),
		attributeNames = this.wiki.filterTiddlers(filterNames,this),
		attributeValues = this.wiki.filterTiddlers(filterValues,this);
	if($tw.utils.count(changedAttributes) > 0 || !$tw.utils.isArrayEqual(this.attributeNames,attributeNames) || !$tw.utils.isArrayEqual(this.attributeValues,attributeValues)) {
		this.refreshSelf();
		return true;
	} else {
		return this.refreshChildren(changedTiddlers);
	}
};

exports.genesis = GenesisWidget;

})();
