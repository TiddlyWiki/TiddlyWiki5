/*\
title: $:/core/modules/widgets/macrocall.js
type: application/javascript
module-type: widget

Macrocall widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
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
	// Get the parse type if specified
	this.parseType = this.getAttribute("$type","text/vnd.tiddlywiki");
	this.renderOutput = this.getAttribute("$output","text/html");
	// Merge together the parameters specified in the parse tree with the specified attributes
	var params = this.parseTreeNode.params ? this.parseTreeNode.params.slice(0) : [];
	$tw.utils.each(this.attributes,function(attribute,name) {
		if(name.charAt(0) !== "$") {
			params.push({name: name, value: attribute});			
		}
	});
	// Get the macro value
	var macroName = this.parseTreeNode.name || this.getAttribute("$name"),
		variableInfo = this.getVariableInfo(macroName,{params: params}),
		text = variableInfo.text,
		parseTreeNodes;
	// Are we rendering to HTML?
	if(this.renderOutput === "text/html") {
		// If so we'll return the parsed macro
		// Check if we've already cached parsing this macro
		var mode = this.parseTreeNode.isBlock ? "blockParser" : "inlineParser",
			parser;
		if(variableInfo.srcVariable && variableInfo.srcVariable[mode]) {
			parser = variableInfo.srcVariable[mode];
		} else {
			parser = this.wiki.parseText(this.parseType,text,
								{parseAsInline: !this.parseTreeNode.isBlock});
			if(variableInfo.isCacheable && variableInfo.srcVariable) {
				variableInfo.srcVariable[mode] = parser;
			}
		}
		var parseTreeNodes = parser ? parser.tree : [];
		// Wrap the parse tree in a vars widget assigning the parameters to variables named "__paramname__"
		var attributes = {};
		$tw.utils.each(variableInfo.params,function(param) {
			var name = "__" + param.name + "__";
			attributes[name] = {
				name: name,
				type: "string",
				value: param.value
			};
		});
		parseTreeNodes = [{
			type: "vars",
			attributes: attributes,
			children: parseTreeNodes
		}];
	} else if(this.renderOutput === "text/raw") {
		parseTreeNodes = [{type: "text", text: text}];
	} else {
		// Otherwise, we'll render the text
		var plainText = this.wiki.renderText("text/plain",this.parseType,text,{parentWidget: this});
		parseTreeNodes = [{type: "text", text: plainText}];
	}
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
