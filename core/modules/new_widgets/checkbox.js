/*\
title: $:/core/modules/new_widgets/checkbox.js
type: application/javascript
module-type: new_widget

Checkbox widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/new_widgets/widget.js").widget;

var CheckboxWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
CheckboxWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
CheckboxWidget.prototype.render = function(parent,nextSibling) {
	// Save the parent dom node
	this.parentDomNode = parent;
	// Compute our attributes
	this.computeAttributes();
	// Execute our logic
	this.execute();
	// Create our elements
	this.labelDomNode = this.document.createElement("label");
	this.inputDomNode = this.document.createElement("input");
	this.inputDomNode.setAttribute("type","checkbox");
	if(this.getValue()) {
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

CheckboxWidget.prototype.getValue = function() {
	var tiddler = this.wiki.getTiddler(this.checkboxTitle);
	return tiddler ? tiddler.hasTag(this.checkboxTag) : false;
};

CheckboxWidget.prototype.handleChangeEvent = function(event) {
	var checked = this.inputDomNode.checked,
		tiddler = this.wiki.getTiddler(this.checkboxTitle);
	if(tiddler && tiddler.hasTag(this.checkboxTag) !== checked) {
		var newTags = tiddler.fields.tags.slice(0),
			pos = newTags.indexOf(this.checkboxTag);
		if(pos !== -1) {
			newTags.splice(pos,1);
		}
		if(checked) {
			newTags.push(this.checkboxTag);
		}
		this.wiki.addTiddler(new $tw.Tiddler(tiddler,{tags: newTags}));
	}
};

/*
Compute the internal state of the widget
*/
CheckboxWidget.prototype.execute = function() {
	// Get the parameters from the attributes
	this.checkboxTitle = this.getAttribute("title",this.getVariable("currentTiddler"));
	this.checkboxTag = this.getAttribute("tag");
	this.checkboxClass = this.getAttribute("class");
	// Make the child widgets
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
CheckboxWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.title || changedAttributes.tag || changedAttributes["class"]) {
		this.refreshSelf();
		return true;
	} else {
		if(changedTiddlers[this.checkboxTitle]) {
			this.inputDomNode.checked = this.getValue();
		}
		return this.refreshChildren(changedTiddlers);
	}
};

/*
Remove any DOM nodes created by this widget or its children
*/
CheckboxWidget.prototype.removeChildDomNodes = function() {
	$tw.utils.each(this.domNodes,function(domNode) {
		domNode.parentNode.removeChild(domNode);
	});
	this.domNodes = [];
};

exports.checkbox = CheckboxWidget;

})();
