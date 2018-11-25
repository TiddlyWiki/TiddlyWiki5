/*\
title: $:/core/modules/widgets/qualify.js
type: application/javascript
module-type: widget

Qualify text to a variable 

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var QualifyWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
QualifyWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
QualifyWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent,nextSibling);
};

/*
Compute the internal state of the widget
*/
QualifyWidget.prototype.execute = function() {
	// Get our parameters
	this.qualifyName = this.getAttribute("name");
	this.qualifyTitle = this.getAttribute("title");
	// Set context variable
	if(this.qualifyName) {
		this.setVariable(this.qualifyName,this.qualifyTitle + "-" + this.getStateQualifier());
	}
	// Construct the child widgets
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
QualifyWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.name || changedAttributes.title) {
		this.refreshSelf();
		return true;
	} else {
		return this.refreshChildren(changedTiddlers);
	}
};

exports.qualify = QualifyWidget;

})();
