/*\
title: $:/core/modules/widgets/browser-variable.js
type: application/javascript
module-type: widget

Browser-variable widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var BrowserVariableWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
BrowserVariableWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
BrowserVariableWidget.prototype.render = function(parent,nextSibling) {
	// Save the parent dom node
	this.parentDomNode = parent;
	// Compute our attributes
	this.computeAttributes();
	// Execute our logic
	this.execute();
	// Get the current value
	var value = $tw.browser ? $tw.utils.getBrowserVariable(this.variableName) || "" : "";
	// Create our element
	var domNode = this.document.createElement("input");
	domNode.setAttribute("type","text");
	domNode.setAttribute("value",value);
	// Add a click event handler
	$tw.utils.addEventListeners(domNode,[
		{name: "change", handlerObject: this, handlerMethod: "handleChangeEvent"}
	]);
	// Insert the label into the DOM and render any children
	parent.insertBefore(domNode,nextSibling);
	this.renderChildren(domNode,null);
	this.domNodes.push(domNode);
};

BrowserVariableWidget.prototype.handleChangeEvent = function(event) {
	var value = this.domNodes[0].value;
	return $tw.utils.saveBrowserVariable(this.variableName,value);
};

/*
Compute the internal state of the widget
*/
BrowserVariableWidget.prototype.execute = function() {
	// Get the parameters from the attributes
	this.variableName = this.getAttribute("name","");
	// Make the child widgets
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
BrowserVariableWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.name) {
		this.refreshSelf();
		return true;
	} else {
		return this.refreshChildren(changedTiddlers);
	}
};

exports["browser-variable"] = BrowserVariableWidget;

})();
