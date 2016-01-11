/*\
title: $:/core/modules/widgets/checklist.js
type: application/javascript
module-type: widget

The Checklist widget toggles (or exchanges) the specified item in the specified list

\*/
(function() {
/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";
var Widget = require("$:/core/modules/widgets/widget.js").widget;

/**
 * 	Inherit from the base widget class
 */
var ChecklistWidget = function(parseTreeNode, options) {
	this.initialise(parseTreeNode, options);
};
ChecklistWidget.prototype = new Widget();

/**
 * 	Render this widget into the DOM
 */
ChecklistWidget.prototype.render = function(parent, nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.labelDomNode = this.document.createElement("label");
	this.labelDomNode.setAttribute("class", this.checkboxClass);
	this.inputDomNode = this.document.createElement("input");
	this.inputDomNode.setAttribute("type", "checkbox");
	if(this.getValue()) {
		this.inputDomNode.setAttribute("checked", "true");
	}
	this.labelDomNode.appendChild(this.inputDomNode);
	this.spanDomNode = this.document.createElement("span");
	this.labelDomNode.appendChild(this.spanDomNode);
	$tw.utils.addEventListeners(this.inputDomNode, [{
		name: "change",
		handlerObject: this,
		handlerMethod: "handleChangeEvent"
	}]);
	parent.insertBefore(this.labelDomNode, nextSibling);
	this.renderChildren(this.spanDomNode, null);
	this.domNodes.push(this.labelDomNode);
};

/**
 * Fetch the tiddler to be manipulated
 */
ChecklistWidget.prototype.getTiddler = function() {
	return(this.checklistIndex) ? this.wiki.getTiddlerData(this.checklistTitle, {}) :
		this.wiki.getTiddler(this.checklistTitle);
};

/**
 * Extract the list to be manipulated as an array
 */
ChecklistWidget.prototype.getArray = function(tiddler) {
	var list;
	if(tiddler) {
		list = (this.checklistIndex) ? (tiddler[this.checklistIndex] || []) : (
			tiddler.fields[this.checklistField] || []);
	}
	return(tiddler) ? $tw.utils.parseStringArray(list).slice(0) : [];
};

/**
 * Determine if the item is present in the list
 */
ChecklistWidget.prototype.hasItem = function() {
	var tiddler = this.getTiddler();
	var array = this.getArray(tiddler);
	return array.indexOf(this.checklistItem) !== -1;
};

/**
 * Determine the correct state of the checkbox
 */
ChecklistWidget.prototype.getValue = function() {
	var HasItem = this.hasItem();
	return(this.checklistInvert === "yes") ? !HasItem : HasItem;
};

/**
 * Determine if the checkbox state matches the correct state
 */
ChecklistWidget.prototype.itemCheck = function() {
	var hasItem = this.hasItem();
	var checked = this.inputDomNode.checked;
	return(this.checklistItem) ? (this.checklistInvert === "yes") ? (hasItem ===
			checked) :
		(hasItem !== checked) : false;
};

/**
 * 	Invoke the action associated with this widget
 */
ChecklistWidget.prototype.handleChangeEvent = function(event) {
	var tiddler = this.getTiddler();
	var array = this.getArray(tiddler);
	var checked = this.inputDomNode.checked;
	var pos,
		altpos,
		fallbackFields,
		newFields;
	if(this.checklistItem && this.itemCheck()) {
		pos = array.indexOf(this.checklistItem);
		altpos = array.indexOf(this.checklistAlt);
		if(this.checklistAlt === "") {
			if(pos !== -1) {
				array.splice(pos, 1);
			} else if(this.checklistInvert === "yes" && !checked) {
				array.push(this.checklistItem);

			} else if(checked) {
				array.push(this.checklistItem);
			}
		} else {
			if(pos !== -1) {
				array[pos] = this.checklistAlt;
			} else if(altpos !== -1) {
				array[altpos] = this.checklistItem;
			} else {
				array.push(this.checklistItem);
			}
		}
		if(this.checklistIndex) {
			tiddler[this.checklistIndex] = $tw.utils.stringifyList(array);
			this.wiki.setTiddlerData(this.checklistTitle, tiddler, this.wiki.getModificationFields(),
				this.wiki.getCreationFields());
		} else if(this.checklistField) {
			fallbackFields = {
				text: ""
			};
			newFields = {
				title: this.checklistTitle
			};
			newFields[this.checklistField] = $tw.utils.stringifyList(array);
			this.wiki.addTiddler(new $tw.Tiddler(this.wiki.getCreationFields(),
				fallbackFields, tiddler, newFields,
				this.wiki.getModificationFields()));
		}
	}
};

/**
 * 	Compute the internal state of the widget
 */
ChecklistWidget.prototype.execute = function() {
	this.checklistTitle = this.getAttribute("tiddler", this.getVariable(
		"currentTiddler"));
	this.checklistItem = this.getAttribute("item");
	this.checklistAlt = this.getAttribute("alt", "");
	this.checklistClass = this.getAttribute("class", "");
	this.checklistInvert = this.getAttribute("invert", "");
	this.checklistField = this.getAttribute("field", "tags");
	this.checklistIndex = this.getAttribute("index");
	this.makeChildWidgets();
};

/**
 * 	Selectively refresh the widget if needed
 */
ChecklistWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.tiddler || changedAttributes.item ||
		changedAttributes.alt || changedAttributes.invert ||
		changedAttributes.field || changedAttributes.index || changedAttributes[
			"class"]) {
		this.refreshSelf();
		return true;
	} else {
		var refreshed = false;
		if(changedTiddlers[this.checklistTitle]) {
			this.inputDomNode.checked = this.getValue();
			refreshed = true;
		}
		return this.refreshChildren(changedTiddlers) || refreshed;
	}
};

exports.checklist = ChecklistWidget;

})();
