/*\
title: $:/core/modules/new_widgets/macrocall.js
type: application/javascript
module-type: new_widget

Macrocall widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/new_widgets/widget.js").widget;

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
	// Merge together the parameters specified in the parse tree with the specified attributes
	var params = this.parseTreeNode.params ? this.parseTreeNode.params.slice(0) : [];
	$tw.utils.each(this.attributes,function(attribute,name) {
		params.push({name: name, value: attribute});
	});
	// Get the macro value
	var text = this.getVariable(this.parseTreeNode.name || this.getAttribute("$name"),{params: params});
	// Parse the macro
	var parser = this.wiki.new_parseText("text/vnd.tiddlywiki",text,
						{parseAsInline: !this.parseTreeNode.isBlock}),
		parseTreeNodes = parser ? parser.tree : [];
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

})();
