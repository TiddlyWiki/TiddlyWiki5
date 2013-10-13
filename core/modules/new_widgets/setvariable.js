/*\
title: $:/core/modules/new_widgets/setvariable.js
type: application/javascript
module-type: new_widget

Setvariable widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/new_widgets/widget.js").widget;

var SetVariableWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
SetVariableWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
SetVariableWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent,nextSibling);
};

/*
Compute the internal state of the widget
*/
SetVariableWidget.prototype.execute = function() {
	// Get our parameters
	this.setName = this.getAttribute("name","tiddlerTitle");
	this.setValue = this.getAttribute("value");
	// Set context variable
	this.setVariable(this.setName,this.setValue,this.parseTreeNode.params);
	// Construct the child widgets
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
SetVariableWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.name || changedAttributes.value) {
		this.refreshSelf();
		return true;
	} else {
		return this.refreshChildren(changedTiddlers);		
	}
};

exports.setvariable = SetVariableWidget;

})();
