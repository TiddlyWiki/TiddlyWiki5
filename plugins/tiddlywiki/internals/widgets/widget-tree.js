/*\
title: $:/plugins/tiddlywiki/internals/widgets/widget-tree.js
type: application/javascript
module-type: widget

Widget to render the widget tree of a tiddler

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var WidgetTreeWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
WidgetTreeWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
WidgetTreeWidget.prototype.render = function(parent,nextSibling) {
	var self = this;
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent,nextSibling);
};

/*
Compute the internal state of the widget
*/
WidgetTreeWidget.prototype.execute = function() {
	// Get our parameters
	this.widgetTreeTitle = this.getAttribute("tiddler",this.getVariable("currentTiddler"));
	this.widgetTreeInlineMode = this.getAttribute("mode","block") === "inline";
	// Compute the widget tree
	var parser = this.wiki.parseTiddler(this.widgetTreeTitle,{parseAsInline: this.widgetTreeInlineMode}),
		results;
	if(parser) {
		var widgetNode = this.wiki.makeWidget(parser,{
				parentWidget: this
			}),
			container = $tw.fakeDocument.createElement("div"),
			copyNode = function(widgetNode,resultNode) {
				var type = widgetNode.parseTreeNode.type;
				resultNode.type = type;
				switch(type) {
					case "element":
						resultNode.tag = widgetNode.parseTreeNode.tag;
						break;
					case "text":
						resultNode.text = widgetNode.parseTreeNode.text;
						break;	
				}
				if(Object.keys(widgetNode.attributes || {}).length > 0) {
					resultNode.attributes = {};
					$tw.utils.each(widgetNode.attributes,function(attr,attrName) {
						resultNode.attributes[attrName] = widgetNode.getAttribute(attrName);
					});
				}
				if(Object.keys(widgetNode.children || {}).length > 0) {
					resultNode.children = [];
					$tw.utils.each(widgetNode.children,function(widgetChildNode) {
						var node = {};
						resultNode.children.push(node);
						copyNode(widgetChildNode,node);
					});
				}
			};
		widgetNode.render(container,null);
		results = {};
		copyNode(widgetNode,results);
	}
	// Make the child widgets
	this.makeChildWidgets([{
		type: "codeblock",
		attributes: {
			code: {type: "string", value: (results && results.children) ? JSON.stringify(results.children,0,$tw.config.preferences.jsonSpaces) : ""},
			language: {type: "string", value: "json"}
		}
	}]);
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
WidgetTreeWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	// Completely rerender if any of our attributes have changed
	if(changedAttributes.tiddler || changedAttributes.mode || changedTiddlers[this.widgetTreeTitle]) {
		this.refreshSelf();
		return true;
	}
	return false;
};

exports["widget-tree"] = WidgetTreeWidget;

})();
