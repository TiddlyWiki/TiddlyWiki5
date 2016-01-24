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
var ChecklistWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/**
 * 	Inherit from the base widget class
 */
ChecklistWidget.prototype = new Widget();

/**
 * 	Render this widget into the DOM
 */
ChecklistWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.labelDomNode = this.document.createElement("label");
	this.labelDomNode.setAttribute("class",this.checkboxClass);
	this.inputDomNode = this.document.createElement("input");
	this.inputDomNode.setAttribute("type","checkbox");
	if(this.getValue()) {
		this.inputDomNode.setAttribute("checked","true");
	}
	this.labelDomNode.appendChild(this.inputDomNode);
	this.spanDomNode = this.document.createElement("span");
	this.labelDomNode.appendChild(this.spanDomNode);
	$tw.utils.addEventListeners(this.inputDomNode, [{
		name: "change",
		handlerObject: this,
		handlerMethod: "handleChangeEvent"
	}]);
	parent.insertBefore(this.labelDomNode,nextSibling);
	this.renderChildren(this.spanDomNode,null);
	this.domNodes.push(this.labelDomNode);
};

/**
 * Modules
 */

//  Extract the list to be manipulated as an array
ChecklistWidget.prototype.getArray = function() {
	var list;
	if(this.checklistIndex && this.checklistField === "tags") {
		var data = this.wiki.getTiddlerData(this.checklistTitle, {});
		list = (data && $tw.utils.hop(data, this.checklistIndex)) ? data[this.checklistIndex] : [];
	} else if(this.checklistField) {
		var tiddler = this.wiki.getTiddler(this.checklistTitle);
		list = (tiddler) ? tiddler.fields[this.checklistField] : [];
	}
	return(list) ? $tw.utils.parseStringArray(list).slice(0) : [];
};
// Determine if the item is present in the list
ChecklistWidget.prototype.hasItem = function() {
	var array = this.getArray();
	return array.indexOf(this.checklistItem) !== -1;
};
// Determine the correct state of the checkbox
ChecklistWidget.prototype.getValue = function() {
	var HasItem = this.hasItem();
	return(this.checklistInvert === "yes") ? !HasItem : HasItem;
};
// Determine if the checkbox state matches the correct state
ChecklistWidget.prototype.itemCheck = function() {
	var hasItem = this.hasItem();
	var checked = this.inputDomNode.checked;
	return(this.checklistItem) ? (this.checklistInvert === "yes") ? (hasItem ===
			checked) :
		(hasItem !== checked) : false;
};
// Update the array
ChecklistWidget.prototype.updateArray = function(array) {
	var checked = this.inputDomNode.checked;
	var pos,
		altpos;
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
	}
	return array;
};

/**
 * 	Invoke the action associated with this widget
 */
ChecklistWidget.prototype.handleChangeEvent = function(event) {
	var tiddler = this.wiki.getTiddler(this.checklistTitle);
	var data = this.wiki.getTiddlerData(this.checklistTitle,{});
	var array = this.getArray();
	var fallbackFields = {
		text: ""
	};
	var newFields = {
		title: this.checklistTitle
	};
	var newarray = this.updateArray(array);
	// Update the list in the field or index
	if(this.checklistIndex && this.checklistField === "tags") {
		data[this.checklistIndex] = $tw.utils.stringifyList(newarray);
		if(tiddler) {
			if(tiddler.fields.type === "application/x-tiddler-dictionary") {
				newFields.text = $tw.utils.makeTiddlerDictionary(data);
			}
		} else {
			newFields.text = $tw.utils.makeTiddlerDictionary(data);
			newFields.type = "application/x-tiddler-dictionary";
		}
	} else if(this.checklistField) {
		newFields[this.checklistField] = $tw.utils.stringifyList(newarray);
	}
	// Update the tiddler
	this.wiki.addTiddler(new $tw.Tiddler(this.wiki.getCreationFields(),fallbackFields,
	tiddler,newFields,this.wiki.getModificationFields()));
};

/**
 * 	Compute the internal state of the widget
 */
ChecklistWidget.prototype.execute = function() {
	this.checklistTitle = this.getAttribute("tiddler",this.getVariable(
		"currentTiddler"));
	this.checklistItem = this.getAttribute("item");
	this.checklistAlt = this.getAttribute("alt","");
	this.checklistClass = this.getAttribute("class","");
	this.checklistInvert = this.getAttribute("invert","");
	this.checklistField = this.getAttribute("field","tags");
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
		changedAttributes.field || changedAttributes.index ||
		changedAttributes["class"]) {
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
