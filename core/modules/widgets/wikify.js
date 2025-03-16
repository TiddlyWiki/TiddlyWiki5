/*\
title: $:/core/modules/widgets/wikify.js
type: application/javascript
module-type: widget

Widget to wikify text into a variable

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var WikifyWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
WikifyWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
WikifyWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent,nextSibling);
};

/*
Compute the internal state of the widget
*/
WikifyWidget.prototype.execute = function() {
	// Get our parameters
	this.wikifyName = this.getAttribute("name");
	this.wikifyText = this.getAttribute("text");
	this.wikifyType = this.getAttribute("type");
	this.wikifyMode = this.getAttribute("mode","block");
	this.wikifyOutput = this.getAttribute("output","text");
	// Create the parse tree
	this.wikifyParser = this.wiki.parseText(this.wikifyType,this.wikifyText,{
			parseAsInline: this.wikifyMode === "inline"
		});
	// Create the widget tree 
	this.wikifyWidgetNode = this.wiki.makeWidget(this.wikifyParser,{
			document: $tw.fakeDocument,
			parentWidget: this
		});
	// Render the widget tree to the container
	this.wikifyContainer = $tw.fakeDocument.createElement("div");
	this.wikifyWidgetNode.render(this.wikifyContainer,null);
	this.wikifyResult = this.getResult();
	// Set context variable
	this.setVariable(this.wikifyName,this.wikifyResult);
	// Construct the child widgets
	this.makeChildWidgets();
};

/*
Return the result string
*/
WikifyWidget.prototype.getResult = function() {
	var result;
	switch(this.wikifyOutput) {
		case "text":
			result = this.wikifyContainer.textContent;
			break;
		case "formattedtext":
			result = this.wikifyContainer.formattedTextContent;
			break;
		case "html":
			result = this.wikifyContainer.innerHTML;
			break;
		case "parsetree":
			result = JSON.stringify(this.wikifyParser.tree,0,$tw.config.preferences.jsonSpaces);
			break;
		case "widgettree":
			result = JSON.stringify(this.getWidgetTree(),0,$tw.config.preferences.jsonSpaces);
			break;
	}
	return result;
};

/*
Return a string of the widget tree
*/
WikifyWidget.prototype.getWidgetTree = function() {
	var copyNode = function(widgetNode,resultNode) {
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
		},
		results = {};
	copyNode(this.wikifyWidgetNode,results);
	return results;
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
WikifyWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	// Refresh ourselves entirely if any of our attributes have changed
	if(changedAttributes.name || changedAttributes.text || changedAttributes.type || changedAttributes.mode || changedAttributes.output) {
		this.refreshSelf();
		return true;
	} else {
		// Refresh the widget tree
		if(this.wikifyWidgetNode.refresh(changedTiddlers)) {
			// Check if there was any change
			var result = this.getResult();
			if(result !== this.wikifyResult) {
				// If so, save the change
				this.wikifyResult = result;
				this.setVariable(this.wikifyName,this.wikifyResult);
				// Refresh each of our child widgets
				$tw.utils.each(this.children,function(childWidget) {
					childWidget.refreshSelf();
				});
				return true;
			}
		}
		// Just refresh the children
		return this.refreshChildren(changedTiddlers);
	}
};

exports.wikify = WikifyWidget;
