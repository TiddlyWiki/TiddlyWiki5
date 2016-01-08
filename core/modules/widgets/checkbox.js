/*\
title: $:/core/modules/widgets/checkbox.js
type: application/javascript
module-type: widget

Checkbox widget to toggle a tag, or set/reset the value of a field or index

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";
var Widget = require("$:/core/modules/widgets/widget.js").widget;

/*
Inherit from the base widget class
*/
var CheckboxWidget = function(parseTreeNode, options) {
	this.initialise(parseTreeNode, options);
};

CheckboxWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
CheckboxWidget.prototype.render = function(parent, nextSibling) {
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

/*
Determine if checkbox state matches the value/tag
*/
CheckboxWidget.prototype.getValue = function() {
	var tiddler = this.wiki.getTiddler(this.checkboxTitle),
		value,
		HasTag;
	if(tiddler) {
		if(this.checkboxTag) {
			HasTag = tiddler.hasTag(this.checkboxTag);
			return(this.checkboxInvertTag) ? !HasTag : HasTag;
		}
		value = (this.checkboxField) ? tiddler.fields[this.checkboxField]
		: (this.checkboxIndex) ? this.wiki.extractTiddlerDataItem(tiddler, this.checkboxIndex)
		: this.checkboxDefault || "";
	} else {
		value = this.checkboxDefault || "";
	}
	return(value === this.checkboxChecked) ? true
	: (value === this.checkboxUnchecked) ? false
	: (this.checkboxInvertTag) ? true : false;
};

/*
Invoke the action associated with this widget
*/
CheckboxWidget.prototype.handleChangeEvent = function(event) {
	var tiddler = this.wiki.getTiddler(this.checkboxTitle),
		fallbackFields = {
			text: ""
		},
		newFields = {
			title: this.checkboxTitle,
		},
		hastag = (tiddler && tiddler.hasTag(this.checkboxTag)),
		hasChanged = false,
		data,
		inverted = this.checkboxInvertTag === "yes",
		checked = this.inputDomNode.checked,
		value = checked ? this.checkboxChecked : this.checkboxUnchecked,
		tagCheck = (this.checkboxTag && inverted) ? hastag === checked
		: hastag !== checked;
	// Set the tag if specified
	if(this.checkboxTag && (!tiddler || tagCheck)) {
		newFields.tags = tiddler ? (tiddler.fields.tags || []).slice(0) : [];
		var pos = newFields.tags.indexOf(this.checkboxTag);
		if(pos !== -1) {
			newFields.tags.splice(pos, 1);
		}
		if(inverted) {
			if(!checked) {
				newFields.tags.push(this.checkboxTag);
			}
		} else if(checked) {
			newFields.tags.push(this.checkboxTag);
		}
		hasChanged = true;
	}
	// Set the field if specified
	if(this.checkboxField) {
		data = (tiddler) ? tiddler.fields[this.checkboxField] : "";
		if(!tiddler || data !== value) {
			newFields[this.checkboxField] = value;
			hasChanged = true;
		}
	// Set the index if specified
	} else if(this.checkboxIndex) {
		data = this.wiki.getTiddlerData(this.checkboxTitle, {});
		if(!tiddler || data[this.checkboxIndex] !== value) {
			data[this.checkboxIndex] = value;
			hasChanged = true;
		}
	}
	// Update the tiddler if value has changed
	if(hasChanged) {
		if(this.checkboxField || this.checkboxTag) {
			this.wiki.addTiddler(new $tw.Tiddler(this.wiki.getCreationFields(),
				fallbackFields, tiddler, newFields, this.wiki.getModificationFields()));
		} else if(this.checkboxIndex) {
			this.wiki.setTiddlerData(this.checkboxTitle, data, this.wiki.getModificationFields(),
				this.wiki.getCreationFields());
		}
	}
};

/*
Compute the internal state of the widget
*/
CheckboxWidget.prototype.execute = function() {
	// Get the parameters from the attributes
	this.checkboxTitle = this.getAttribute("tiddler", this.getVariable(
		"currentTiddler"));
	this.checkboxTag = this.getAttribute("tag");
	this.checkboxField = this.getAttribute("field");
	this.checkboxIndex = this.getAttribute("index");
	this.checkboxChecked = this.getAttribute("checked");
	this.checkboxUnchecked = this.getAttribute("unchecked");
	this.checkboxDefault = this.getAttribute("default");
	this.checkboxClass = this.getAttribute("class", "");
	this.checkboxInvertTag = this.getAttribute("invertTag", "");
	// Make the child widgets
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed.
*/
CheckboxWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.tiddler || changedAttributes.tag || changedAttributes.invertTag ||
		changedAttributes.field || changedAttributes.index || changedAttributes.checked ||
		changedAttributes.unchecked ||
		changedAttributes["default"] || changedAttributes["class"]) {
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
