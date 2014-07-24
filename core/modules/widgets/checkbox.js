/*\
title: $:/core/modules/widgets/checkbox.js
type: application/javascript
module-type: widget

Checkbox widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

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
	if(tiddler) {
		if(this.checkboxTag) {
			return tiddler.hasTag(this.checkboxTag);
		}
		if(this.checkboxField) {
			var value = tiddler.fields[this.checkboxField] || this.checkboxDefault || "";
			if(value === this.checkboxChecked) {
				return true;
			}
			if(value === this.checkboxUnchecked) {
				return false;
			}
		}
	} else {
		if(this.checkboxTag) {
			return false;
		}
		if(this.checkboxField) {
			if(this.checkboxDefault === this.checkboxChecked) {
				return true;
			}
			if(this.checkboxDefault === this.checkboxUnchecked) {
				return false;
			}
		}
	}
	return false;
};

CheckboxWidget.prototype.handleChangeEvent = function(event) {
	var checked = this.inputDomNode.checked,
		tiddler = this.wiki.getTiddler(this.checkboxTitle),
		newFields = {title: this.checkboxTitle, text: ""},
		hasChanged = false;
	// Set the tag if specified
	if(this.checkboxTag && (!tiddler || tiddler.hasTag(this.checkboxTag) !== checked)) {
		newFields.tags = tiddler ? (tiddler.fields.tags || []).slice(0) : [];
		var pos = newFields.tags.indexOf(this.checkboxTag);
		if(pos !== -1) {
			newFields.tags.splice(pos,1);
		}
		if(checked) {
			newFields.tags.push(this.checkboxTag);
		}
		hasChanged = true;
	}
	// Set the field if specified
	if(this.checkboxField) {
		var value = checked ? this.checkboxChecked : this.checkboxUnchecked;
		if(!tiddler || tiddler.fields[this.checkboxField] !== value) {
			newFields[this.checkboxField] = value;
			hasChanged = true;
		}
	}
	if(hasChanged) {
		this.wiki.addTiddler(new $tw.Tiddler(tiddler,newFields,this.wiki.getModificationFields()));
	}
};

/*
Compute the internal state of the widget
*/
CheckboxWidget.prototype.execute = function() {
	// Get the parameters from the attributes
	this.checkboxTitle = this.getAttribute("tiddler",this.getVariable("currentTiddler"));
	this.checkboxTag = this.getAttribute("tag");
	this.checkboxField = this.getAttribute("field");
	this.checkboxChecked = this.getAttribute("checked");
	this.checkboxUnchecked = this.getAttribute("unchecked");
	this.checkboxDefault = this.getAttribute("default");
	// Make the child widgets
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
CheckboxWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.tiddler || changedAttributes.tag || changedAttributes.field || changedAttributes.checked || changedAttributes.unchecked || changedAttributes["default"] || changedAttributes["class"]) {
		this.refreshSelf();
		return true;
	} else {
		var refreshed = false;
		if(changedTiddlers[this.checkboxTitle]) {
			this.inputDomNode.checked = this.getValue();
			refreshed = true;
		}
		return this.refreshChildren(changedTiddlers) || refreshed;
	}
};

exports.checkbox = CheckboxWidget;

})();
