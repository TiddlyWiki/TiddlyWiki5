/*\
title: $:/core/modules/widgets/importvariables.js
type: application/javascript
module-type: widget

Import variable definitions from other tiddlers

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var ImportVariablesWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
ImportVariablesWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
ImportVariablesWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent,nextSibling);
};

/*
Compute the internal state of the widget
*/
ImportVariablesWidget.prototype.execute = function(tiddlerList) {
	var self = this;
	// Get our parameters
	this.filter = this.getAttribute("filter");
	// Compute the filter
	this.tiddlerList = tiddlerList || this.wiki.filterTiddlers(this.filter,this);
	// Accumulate variables for every found <$set> widgets from each tiddler
	$tw.utils.each(this.tiddlerList,function(title) {
		var parser = self.wiki.parseTiddler(title);
		if(parser) {
			var parseTreeNode = parser.tree[0];
			while(parseTreeNode && parseTreeNode.type === "set") {
				var widget = self.makeChildWidget({
					type: "set",
					attributes: parseTreeNode.attributes,
					params: parseTreeNode.params,
					isMacroDefinition: parseTreeNode.isMacroDefinition
				});
				widget.computeAttributes();
				widget.execute();
				$tw.utils.extend(self.variables,widget.variables);
				parseTreeNode = parseTreeNode.children[0];
			}
		} 
	});
	// Construct the child widgets
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
ImportVariablesWidget.prototype.refresh = function(changedTiddlers) {
	// Recompute our attributes and the filter list
	var changedAttributes = this.computeAttributes(),
		tiddlerList = this.wiki.filterTiddlers(this.getAttribute("filter"),this);
	// Refresh if the filter has changed, or the list of tiddlers has changed, or any of the tiddlers in the list has changed
	function haveListedTiddlersChanged() {
		var changed = false;
		tiddlerList.forEach(function(title) {
			if(changedTiddlers[title]) {
				changed = true;
			}
		});
		return changed;
	}
	if(changedAttributes.filter || !$tw.utils.isArrayEqual(this.tiddlerList,tiddlerList) || haveListedTiddlersChanged()) {
		// Compute the filter
		this.removeChildDomNodes();
		this.execute(tiddlerList);
		this.renderChildren(this.parentDomNode,this.findNextSiblingDomNode());
		return true;
	} else {
		return this.refreshChildren(changedTiddlers);		
	}
};

exports.importvariables = ImportVariablesWidget;

})();
