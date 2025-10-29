/*\
title: $:/core/modules/widgets/range.js
type: application/javascript
module-type: widget

Range widget

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var RangeWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
RangeWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
RangeWidget.prototype.render = function(parent,nextSibling) {
	// Save the parent dom node
	this.parentDomNode = parent;
	// Compute our attributes
	this.computeAttributes();
	// Execute our logic
	this.execute();
	// Create our elements
	this.inputDomNode = this.document.createElement("input");
	this.inputDomNode.setAttribute("type","range");
	this.inputDomNode.setAttribute("class",this.elementClass);
	if(this.minValue){
		this.inputDomNode.setAttribute("min", this.minValue);
	}
	if(this.maxValue){
		this.inputDomNode.setAttribute("max", this.maxValue);
	}
	if(this.increment){
		this.inputDomNode.setAttribute("step", this.increment);
	}
	if(this.tabIndex) {
		this.inputDomNode.setAttribute("tabindex", this.tabIndex);
	}
	if(this.isDisabled === "yes") {
		this.inputDomNode.setAttribute("disabled",true);
	}
	this.inputDomNode.value = this.getValue();
	this.assignAttributes(this.inputDomNode,{
		sourcePrefix: "data-",
		destPrefix: "data-"
	});
	// Add a click event handler
	$tw.utils.addEventListeners(this.inputDomNode,[
		{name:"mousedown", handlerObject:this, handlerMethod:"handleMouseDownEvent"},
		{name:"mouseup",   handlerObject:this, handlerMethod:"handleMouseUpEvent"},
		{name:"change",    handlerObject:this, handlerMethod:"handleChangeEvent"},
		{name:"input",     handlerObject:this, handlerMethod:"handleInputEvent"},
	]);
	// Insert the label into the DOM and render any children
	parent.insertBefore(this.inputDomNode,nextSibling);
	this.domNodes.push(this.inputDomNode);
};

RangeWidget.prototype.getValue = function() {
	var tiddler = this.wiki.getTiddler(this.tiddlerTitle),
		fieldName = this.tiddlerField,
		value = this.defaultValue;
	if(tiddler) {
		if(this.tiddlerIndex) {
			value = this.wiki.extractTiddlerDataItem(tiddler,this.tiddlerIndex,this.defaultValue);
		} else {
			if($tw.utils.hop(tiddler.fields,fieldName)) {
				value = tiddler.fields[fieldName] || "";
			} else {
				value = this.defaultValue;
			}
		}
	}
	return value;
};

RangeWidget.prototype.getActionVariables = function(options) {
	options = options || {};
	var hasChanged = (this.startValue !== this.inputDomNode.value) ? "yes" : "no";
	// Trigger actions. Use variables = {key:value, key:value ...}
	// the "value" is needed.
	return $tw.utils.extend({"actionValue": this.inputDomNode.value, "actionValueHasChanged": hasChanged}, options);
}

// actionsStart
RangeWidget.prototype.handleMouseDownEvent = function(event) {
	this.handleEvent(event);
	// Trigger actions
	if(this.actionsMouseDown) {
		var variables = this.getActionVariables() // TODO this line will go into the function call below.
		this.invokeActionString(this.actionsMouseDown,this,event,variables);
	}
}

// actionsStop
RangeWidget.prototype.handleMouseUpEvent = function(event) {
	this.handleEvent(event);
	// Trigger actions
	if(this.actionsMouseUp) {
		var variables = this.getActionVariables()
		this.invokeActionString(this.actionsMouseUp,this,event,variables);
	}
}

RangeWidget.prototype.handleChangeEvent = function(event) {
	this.handleInputEvent(event);
};

RangeWidget.prototype.handleInputEvent = function(event) {
	this.handleEvent(event);
	// Trigger actions
	if(this.actionsInput) {
		// "tiddler" parameter may be missing. See .execute() below
		var variables = this.getActionVariables({"actionValueHasChanged": "yes"}) // TODO this line will go into the function call below.
		this.invokeActionString(this.actionsInput,this,event,variables);
	}
};

RangeWidget.prototype.handleEvent = function(event) {
	if(this.getValue() !== this.inputDomNode.value) {
		if(this.tiddlerIndex) {
			this.wiki.setText(this.tiddlerTitle,"",this.tiddlerIndex,this.inputDomNode.value);
		} else {
			this.wiki.setText(this.tiddlerTitle,this.tiddlerField,null,this.inputDomNode.value);
		}
	}
};

/*
Compute the internal state of the widget
*/
RangeWidget.prototype.execute = function() {
	// Get the parameters from the attributes
	this.tiddlerTitle = this.getAttribute("tiddler",this.getVariable("currentTiddler"));
	this.tiddlerField = this.getAttribute("field","text");
	this.tiddlerIndex = this.getAttribute("index");
	this.minValue = this.getAttribute("min");
	this.maxValue = this.getAttribute("max");
	this.increment = this.getAttribute("increment");
	this.defaultValue = this.getAttribute("default","");
	this.elementClass = this.getAttribute("class","");
	this.isDisabled = this.getAttribute("disabled","no");
	this.tabIndex = this.getAttribute("tabindex");
	// Actions since 5.1.23
	// Next 2 only fire once!
	this.actionsMouseDown = this.getAttribute("actionsStart","");
	this.actionsMouseUp = this.getAttribute("actionsStop","");
	// Input fires very often!
	this.actionsInput = this.getAttribute("actions","");
	// Make the child widgets
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
RangeWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if($tw.utils.count(changedAttributes) > 0) {
		this.refreshSelf();
		return true;
	} else {
		var refreshed = false;
		if(changedTiddlers[this.tiddlerTitle]) {
			var value = this.getValue();
			if(this.inputDomNode.value !== value) {
				this.inputDomNode.value = value;
			}
			refreshed = true;
		}
		return this.refreshChildren(changedTiddlers) || refreshed;
	}
};

exports.range = RangeWidget;
