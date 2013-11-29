/*\
title: $:/core/modules/widgets/radio.js
type: application/javascript
module-type: widget

Radio widget

<$radio field="fieldname" value="value" tiddler="title">Labeltext</$radio>

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var RadioWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
RadioWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
RadioWidget.prototype.render = function(parent,nextSibling) {
	// Save the parent dom node
	this.parentDomNode = parent;
	// Compute our attributes
	this.computeAttributes();
	// Execute our logic
	this.execute();
	// Create our elements
	this.labelDomNode = this.document.createElement("label");
	this.labelDomNode.setAttribute("class", "tw-radio-widget");
	this.inputDomNode = this.document.createElement("input");
	this.inputDomNode.setAttribute("type","radio");
	this.inputDomNode.setAttribute("name",this.radioTitle + "!!" + this.radioField);
	// this.inputDomNode.setAttribute("value",this.radioValue);
	if(this.getValue() == this.radioValue) {
		this.inputDomNode.setAttribute("checked","true");
	}
	this.labelDomNode.appendChild(this.inputDomNode);
	this.spanDomNode = this.document.createElement("span");
	this.labelDomNode.appendChild(this.spanDomNode);
	// Add a click event handler
	$tw.utils.addEventListeners(this.inputDomNode,[
		{name: "change", handlerObject: this, handlerMethod: "handleChangeEvent"}
	]);
	// Insert the label into the DOM and render any children
	parent.insertBefore(this.labelDomNode,nextSibling);
	this.renderChildren(this.spanDomNode,null);
	this.domNodes.push(this.labelDomNode);
};

RadioWidget.prototype.getValue = function() {
	return $tw.wiki.getTextReference(this.inputDomNode.name);
};

RadioWidget.prototype.handleChangeEvent = function(event) {
	var checked = this.inputDomNode.checked;
	if (!checked) return
	$tw.wiki.setTextReference(this.inputDomNode.name, this.radioValue);
};

/*
Compute the internal state of the widget
*/
RadioWidget.prototype.execute = function() {
	// Get the parameters from the attributes
	this.radioTitle = this.getAttribute("tiddler",this.getVariable("currentTiddler"));
	this.radioField = this.getAttribute("field");
	this.radioValue = this.getAttribute("value");
	// Make the child widgets
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
RadioWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.tiddler || changedAttributes.tag || changedAttributes["class"]) {
		this.refreshSelf();
		return true;
	} else {
		var refreshed = false;
		if(changedTiddlers[this.radioTitle]) {
			this.inputDomNode.checked = this.getValue();
			refreshed = true;
		}
		return this.refreshChildren(changedTiddlers) || refreshed;
	}
};

exports.radio = RadioWidget;

})();
