/*\
title: $:/core/modules/new_widgets/reveal.js
type: application/javascript
module-type: new_widget

Reveal widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/new_widgets/widget.js").widget;

var RevealWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
RevealWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
RevealWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	var domNode = this.document.createElement("div");
	parent.insertBefore(domNode,nextSibling);
	this.renderChildren(domNode,null);
	this.domNodes.push(domNode);
};

/*
Compute the internal state of the widget
*/
RevealWidget.prototype.execute = function() {
	// Get our parameters
	this.state = this.getAttribute("state");
	this.type = this.getAttribute("type");
	this.text = this.getAttribute("text");
	this.position = this.getAttribute("position");
	this["default"] = this.getAttribute("default","");
	this.qualifyTiddlerTitles = this.getAttribute("qualifyTiddlerTitles");
	this["class"] = this.getAttribute("class");
	this.animate = this.getAttribute("animate","no");
	// Compute the title of the state tiddler and read it
	this.stateTitle = this.state;
	if(this.qualifyTiddlerTitles) {
		this.stateTitle =  this.stateTitle + "-" + this.getStateQualifier();
	}
	this.readState();
	// Construct the child widgets
	var childNodes = this.isOpen ? this.parseTreeNode.children : [];
	this.makeChildWidgets(childNodes);
};

/*
Read the state tiddler
*/
RevealWidget.prototype.readState = function() {
	// Read the information from the state tiddler
	if(this.stateTitle) {
		var state = this.wiki.getTextReference(this.stateTitle,this["default"],this.getVariable("tiddlerTitle"));
		switch(this.type) {
			case "popup":
				this.readPopupState(state);
				break;
			case "match":
				this.readMatchState(state);
				break;
			case "nomatch":
				this.readMatchState(state);
				this.isOpen = !this.isOpen;
				break;
		}
	}
};

RevealWidget.prototype.readMatchState = function(state) {
	this.isOpen = state === this.text;
};

RevealWidget.prototype.readPopupState = function(state) {
	var popupLocationRegExp = /^\((-?[0-9\.E]+),(-?[0-9\.E]+),(-?[0-9\.E]+),(-?[0-9\.E]+)\)$/,
		match = popupLocationRegExp.exec(state);
	// Check if the state matches the location regexp
	if(match) {
		// If so, we're open
		this.isOpen = true;
		// Get the location
		this.popup = {
			left: parseFloat(match[1]),
			top: parseFloat(match[2]),
			width: parseFloat(match[3]),
			height: parseFloat(match[4])
		};
	} else {
		// If not, we're closed
		this.isOpen = false;
	}
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
RevealWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.state || changedAttributes.type || changedAttributes.text || changedAttributes.position || changedAttributes["default"] || changedAttributes.qualifyTiddlerTitles || changedAttributes["class"] || changedAttributes.animate || changedTiddlers[this.stateTitle]) {
		this.refreshSelf();
		return true;
	} else {
		return this.refreshChildren(changedTiddlers);		
	}
};

/*
Remove any DOM nodes created by this widget or its children
*/
RevealWidget.prototype.removeChildDomNodes = function() {
	$tw.utils.each(this.domNodes,function(domNode) {
		domNode.parentNode.removeChild(domNode);
	});
	this.domNodes = [];
};

exports.reveal = RevealWidget;

})();
