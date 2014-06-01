/*\
title: $:/core/modules/widgets/radio.js
type: application/javascript
module-type: widget

Radio widget

Will set a field to the selected value:

```
	<$radio field="myfield" value="check 1">one</$radio>
	<$radio field="myfield" value="check 2">two</$radio>
	<$radio field="myfield" value="check 3">three</$radio>
```

|Parameter |Description |h
|tiddler |Name of the tiddler in which the field should be set. Defaults to current tiddler |
|field |The name of the field to be set |
|value |The value to set |
|class |Optional class name(s) |


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
	this.labelDomNode.setAttribute("class",this.radioClass);
	this.inputDomNode = this.document.createElement("input");
	this.inputDomNode.setAttribute("type","radio");
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
	var tiddler = this.wiki.getTiddler(this.radioTitle);
	return tiddler && tiddler.getFieldString(this.radioField);
};

RadioWidget.prototype.setValue = function() {
	if(this.radioField) {
		var tiddler = this.wiki.getTiddler(this.radioTitle),
			addition = {};
		addition[this.radioField] = this.radioValue;
		this.wiki.addTiddler(new $tw.Tiddler(tiddler,addition));
	}
};

RadioWidget.prototype.handleChangeEvent = function(event) {
	if(this.inputDomNode.checked) {
		this.setValue();
	}
};

/*
Compute the internal state of the widget
*/
RadioWidget.prototype.execute = function() {
	// Get the parameters from the attributes
	this.radioTitle = this.getAttribute("tiddler",this.getVariable("currentTiddler"));
	this.radioField = this.getAttribute("field","text");
	this.radioValue = this.getAttribute("value");
	this.radioClass = this.getAttribute("class","");
	if(this.radioClass !== "") {
		this.radioClass += " ";
	}
	this.radioClass += "tw-radio";
	// Make the child widgets
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
RadioWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.tiddler || changedAttributes.field || changedAttributes.value || changedAttributes["class"]) {
		this.refreshSelf();
		return true;
	} else {
		var refreshed = false;
		if(changedTiddlers[this.radioTitle]) {
			this.inputDomNode.checked = this.getValue() === this.radioValue;
			refreshed = true;
		}
		return this.refreshChildren(changedTiddlers) || refreshed;
	}
};

exports.radio = RadioWidget;

})();
