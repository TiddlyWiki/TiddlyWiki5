/*\
title: $:/core/modules/widgets/radio.js
type: application/javascript
module-type: widget

Set a field or index at a given tiddler via radio buttons

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
	var isChecked = this.getValue() === this.radioValue;
	// Create our elements
	this.labelDomNode = this.document.createElement("label");
	this.labelDomNode.setAttribute("class",
		"tc-radio " + this.radioClass + (isChecked ? " tc-radio-selected" : "")
	);
	this.inputDomNode = this.document.createElement("input");
	this.inputDomNode.setAttribute("type","radio");
	this.assignAttributes(this.inputDomNode,{
		sourcePrefix: "data-",
		destPrefix: "data-"
	});
	if(isChecked) {
		this.inputDomNode.checked = true;
	}
	if(this.isDisabled === "yes") {
		this.inputDomNode.setAttribute("disabled",true);
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
	var value,
		tiddler = this.wiki.getTiddler(this.radioTitle);
	if(tiddler) {
		if(this.radioIndex) {
			value = this.wiki.extractTiddlerDataItem(this.radioTitle,this.radioIndex,this.radioDefault);
		} else {
			value = tiddler.getFieldString(this.radioField,this.radioDefault);
		}
	} else {
		value = this.radioDefault;
	}
	return value;
};

RadioWidget.prototype.setValue = function() {
	if(this.radioIndex) {
		this.wiki.setText(this.radioTitle,"",this.radioIndex,this.radioValue);
	} else {
		var tiddler = this.wiki.getTiddler(this.radioTitle),
			addition = {};
		addition[this.radioField] = this.radioValue;
		this.wiki.addTiddler(new $tw.Tiddler(this.wiki.getCreationFields(),{title: this.radioTitle},tiddler,addition,this.wiki.getModificationFields()));
	}
};

RadioWidget.prototype.handleChangeEvent = function(event) {
	if(this.inputDomNode.checked) {
		this.setValue();
	}
	// Trigger actions
	if(this.radioActions) {
		this.invokeActionString(this.radioActions,this,event,{"actionValue": this.radioValue});
	}
};

/*
Compute the internal state of the widget
*/
RadioWidget.prototype.execute = function() {
	// Get the parameters from the attributes
	this.radioTitle = this.getAttribute("tiddler",this.getVariable("currentTiddler"));
	this.radioField = this.getAttribute("field","text");
	this.radioIndex = this.getAttribute("index");
	this.radioValue = this.getAttribute("value");
	this.radioClass = this.getAttribute("class","");
	this.radioDefault = this.getAttribute("default");
	this.isDisabled = this.getAttribute("disabled","no");
	this.radioActions = this.getAttribute("actions","");
	// Make the child widgets
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
RadioWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(($tw.utils.count(changedAttributes) > 0)) {
		this.refreshSelf();
		return true;
	} else if(changedTiddlers[this.radioTitle]) {
		this.inputDomNode.checked = this.getValue() === this.radioValue;
		$tw.utils.toggleClass(this.labelDomNode,"tc-radio-selected",this.inputDomNode.checked);
		return this.refreshChildren(changedTiddlers);
	} else {
		return this.refreshChildren(changedTiddlers);
	}
};

exports.radio = RadioWidget;

})();
