/*\
title: $:/core/modules/widgets/macrocall.js
type: application/javascript
module-type: widget

Macrocall widget

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var MacroCallWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
MacroCallWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
MacroCallWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent,nextSibling);
};

/*
Compute the internal state of the widget
*/
MacroCallWidget.prototype.execute = function() {
	this.macroName = this.parseTreeNode.name || this.getAttribute("$name"),
	this.parseType = this.getAttribute("$type","text/vnd.tiddlywiki");
	this.renderOutput = this.getAttribute("$output","text/html");
	// Merge together the parameters specified in the parse tree with the specified attributes
	var params = this.parseTreeNode.params ? this.parseTreeNode.params.slice(0) : [];
	$tw.utils.each(this.attributes,function(attribute,name) {
		if(name.charAt(0) !== "$") {
			params.push({name: name, value: attribute});
		}
	});
	// Make a transclude widget
	var positionalName = 0,
		parseTreeNodes = [{
			type: "transclude",
			isBlock: this.parseTreeNode.isBlock,
			children: this.parseTreeNode.children
		}];
	$tw.utils.addAttributeToParseTreeNode(parseTreeNodes[0],"$variable",this.macroName);
	$tw.utils.addAttributeToParseTreeNode(parseTreeNodes[0],"$type",this.parseType);
	$tw.utils.addAttributeToParseTreeNode(parseTreeNodes[0],"$output",this.renderOutput);
	$tw.utils.each(params,function(param) {
		var name = param.name;
		if(name) {
			if(name.charAt(0) === "$") {
				name = "$" + name;
			}
			$tw.utils.addAttributeToParseTreeNode(parseTreeNodes[0],name,param.value);
		} else {
			$tw.utils.addAttributeToParseTreeNode(parseTreeNodes[0],(positionalName++) + "",param.value);
		}
	});
	// Construct the child widgets
	this.makeChildWidgets(parseTreeNodes);
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
MacroCallWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if($tw.utils.count(changedAttributes) > 0) {
		// Rerender ourselves
		this.refreshSelf();
		return true;
	} else {
		return this.refreshChildren(changedTiddlers);
	}
};

exports.macrocall = MacroCallWidget;
