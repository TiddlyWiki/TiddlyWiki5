/*\
title: $:/core/modules/widgets/fieldradio.js
type: application/javascript
module-type: widget

Fieldradio widget

Will set a field to the selected value:

```
	<$fieldradio field="myfield" value="check 1">one</$fieldradio>
	<$fieldradio field="myfield" value="check 2">two</$fieldradio>
	<$fieldradio field="myfield" value="check 3">three</$fieldradio>
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

var FieldradioWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
FieldradioWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
FieldradioWidget.prototype.render = function(parent,nextSibling) {
	// Save the parent dom node
	this.parentDomNode = parent;
	// Compute our attributes
	this.computeAttributes();
	// Execute our logic
	this.execute();
	// Create our elements
	this.labelDomNode = this.document.createElement("label");
	this.labelDomNode.setAttribute("class",this.fieldradioClass);
	this.inputDomNode = this.document.createElement("input");
	this.inputDomNode.setAttribute("type","radio");
	if(this.getValue() == this.fieldradioValue) {
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

FieldradioWidget.prototype.getValue = function() {
	var tiddler = this.wiki.getTiddler(this.fieldradioTitle);
	return tiddler && tiddler.getFieldString(this.fieldradioField);
};

FieldradioWidget.prototype.setValue = function() {
	var tiddler = this.wiki.getTiddler(this.fieldradioTitle);
	if(this.fieldradioField == "") {
		return;
	}
	var addition = {};
	addition[this.fieldradioField] = this.fieldradioValue;
	this.wiki.addTiddler(new $tw.Tiddler(tiddler,addition));
};

FieldradioWidget.prototype.handleChangeEvent = function(event) {
	if (this.inputDomNode.checked) {
		this.setValue();
	}
};

/*
Compute the internal state of the widget
*/
FieldradioWidget.prototype.execute = function() {
	// Get the parameters from the attributes
	this.fieldradioTitle = this.getAttribute("tiddler",this.getVariable("currentTiddler"));
	this.fieldradioField = this.getAttribute("field");
	this.fieldradioValue = this.getAttribute("value");
	this.fieldradioClass = this.getAttribute("class","");
	if (this.fieldradioClass !== "") {
		this.fieldradioClass += " ";
	}
	this.fieldradioClass += "tw-fieldradio";
	// Make the child widgets
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
FieldradioWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.tiddler || changedAttributes.field || changedAttributes.value || changedAttributes["class"]) {
		this.refreshSelf();
		return true;
	} else {
		var refreshed = false;
		if(changedTiddlers[this.fieldradioTitle]) {
			this.inputDomNode.checked = this.getValue();
			refreshed = true;
		}
		return this.refreshChildren(changedTiddlers) || refreshed;
	}
};

exports.fieldradio = FieldradioWidget;

})();
