/*\
title: $:/core/modules/widgets/genesis.js
type: application/javascript
module-type: widget

Genesis widget for dynamically creating widgets

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var GenesisWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
GenesisWidget.prototype = new Widget();

GenesisWidget.prototype.computeAttributes = function(options) {
	options = options || Object.create(null);
	options.filterFn = function(name) {
		// Only compute our own attributes which start with a single dollar
		return name.charAt(0) === "$" && name.charAt(1) !== "$";
	}
	return Widget.prototype.computeAttributes.call(this,options);
};

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
	this.genesisType = this.getAttribute("$type");
	this.genesisRemappable = this.getAttribute("$remappable","yes") === "yes";
	this.genesisNames = this.getAttribute("$names","");
	this.genesisValues = this.getAttribute("$values","");
	this.genesisIsBlock = this.getAttribute("$mode",this.parseTreeNode.isBlock && "block") === "block";
	// Do not create a child widget if the $type attribute is missing or blank
	if(!this.genesisType) {
		this.makeChildWidgets(this.parseTreeNode.children);
		return;
	}
	// Construct parse tree
	var isElementWidget = this.genesisType.charAt(0) !== "$",
		nodeType = isElementWidget ? "element" : this.genesisType.substr(1),
		nodeTag = isElementWidget ? this.genesisType : undefined;
	var parseTreeNodes = [{
		type: nodeType,
		tag: nodeTag,
		attributes: {},
		orderedAttributes: [],
		isBlock: this.genesisIsBlock,
		children: this.parseTreeNode.children || [],
		isNotRemappable: !this.genesisRemappable
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
	$tw.utils.each($tw.utils.getOrderedAttributesFromParseTreeNode(this.parseTreeNode),function(attribute) {
		var name = attribute.name;
		if(name.charAt(0) === "$") {
			if(name.charAt(1) === "$") {
				// Double $$ is changed to a single $
				name = name.substr(1);
			} else {
				// Single dollar is ignored
				return;
			}
		}
		$tw.utils.addAttributeToParseTreeNode(parseTreeNodes[0],$tw.utils.extend({},attribute,{name: name}));
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
