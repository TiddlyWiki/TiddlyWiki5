/*\
title: $:/core/modules/widgets/tiddler.js
type: application/javascript
module-type: new_widget

Tiddler widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var TiddlerWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
	this.addEventListeners([
		{type: "tw-navigate", handler: "handleNavigateEvent"}
	]);
};

/*
Inherit from the base widget class
*/
TiddlerWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
TiddlerWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent,nextSibling);
};

/*
Compute the internal state of the widget
*/
TiddlerWidget.prototype.execute = function() {
	// Get our parameters
	this.tiddlerTitle = this.getAttribute("title","");
	// Set context variable
	this.setVariable("tiddlerTitle",this.tiddlerTitle);
	// Construct the child widgets
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
TiddlerWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.name || changedAttributes.value) {
		this.refreshSelf();
		return true;
	} else {
		return this.refreshChildren(changedTiddlers);		
	}
};

/*
Handle a tw-navigate event
*/
TiddlerWidget.prototype.handleNavigateEvent = function(event) {
console.log("Setting navigateFromTitle to",this.tiddlerTitle)
	event.navigateFromTitle = this.tiddlerTitle;
	return true;
};

exports.tiddler = TiddlerWidget;

})();
