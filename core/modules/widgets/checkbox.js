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
	this.labelDomNode.setAttribute("class",this.checkboxClass);
	this.inputDomNode = this.document.createElement("input");
	this.inputDomNode.setAttribute("type","checkbox");
	if(this.getValue()) {
		this.inputDomNode.setAttribute("checked","true");
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

CheckboxWidget.prototype.getValue = function() {
	var tiddler = this.wiki.getTiddler(this.checkboxTitle);
	if(tiddler) {
		if(this.checkboxTag) {
			if(this.checkboxInvertTag) {
				return !tiddler.hasTag(this.checkboxTag);
			} else {
				return tiddler.hasTag(this.checkboxTag);
			}
		}
		if(this.checkboxField) {
			var value;
			if($tw.utils.hop(tiddler.fields,this.checkboxField)) {
				value = tiddler.fields[this.checkboxField] || "";
			} else {
				value = this.checkboxDefault || "";
			}
			if(value === this.checkboxChecked) {
				return true;
			}
			if(value === this.checkboxUnchecked) {
				return false;
			}
		}
		if(this.checkboxIndex) {
			var value = this.wiki.extractTiddlerDataItem(tiddler,this.checkboxIndex,this.checkboxDefault || "");
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
		fallbackFields = {text: ""},
		newFields = {title: this.checkboxTitle},
		hasChanged = false,
		tagCheck = false,
		hasTag = tiddler && tiddler.hasTag(this.checkboxTag),
		value = checked ? this.checkboxChecked : this.checkboxUnchecked;
	if(this.checkboxTag && this.checkboxInvertTag === "yes") {
		tagCheck = hasTag === checked;
	} else {
		tagCheck = hasTag !== checked;
	}
	// Set the tag if specified
	if(this.checkboxTag && (!tiddler || tagCheck)) {
		newFields.tags = tiddler ? (tiddler.fields.tags || []).slice(0) : [];
		var pos = newFields.tags.indexOf(this.checkboxTag);
		if(pos !== -1) {
			newFields.tags.splice(pos,1);
		}
		if(this.checkboxInvertTag === "yes" && !checked) {
			newFields.tags.push(this.checkboxTag);
		} else if(this.checkboxInvertTag !== "yes" && checked) {
			newFields.tags.push(this.checkboxTag);
		}
		hasChanged = true;
	}
	// Set the field if specified
	if(this.checkboxField) {
		if(!tiddler || tiddler.fields[this.checkboxField] !== value) {
			newFields[this.checkboxField] = value;
			hasChanged = true;
		}
	}
	// Set the index if specified
	if(this.checkboxIndex) {
		var indexValue = this.wiki.extractTiddlerDataItem(this.checkboxTitle,this.checkboxIndex);
		if(!tiddler || indexValue !== value) {
			hasChanged = true;
		}
	}
	if(hasChanged) {
		if(this.checkboxIndex) {
			this.wiki.setText(this.checkboxTitle,"",this.checkboxIndex,value);
		} else {
			this.wiki.addTiddler(new $tw.Tiddler(this.wiki.getCreationFields(),fallbackFields,tiddler,newFields,this.wiki.getModificationFields()));
		}
	}
	// Trigger actions
	if(this.checkboxActions) {
		this.invokeActionString(this.checkboxActions,this,event);
	}
	if(this.checkboxCheckActions && checked) {
		this.invokeActionString(this.checkboxCheckActions,this,event);
	}
	if(this.checkboxUncheckActions && !checked) {
		this.invokeActionString(this.checkboxUncheckActions,this,event);
	}
};

/*
Compute the internal state of the widget
*/
CheckboxWidget.prototype.execute = function() {
	// Get the parameters from the attributes
	this.checkboxActions = this.getAttribute("actions");
	this.checkboxCheckActions = this.getAttribute("checkactions");
	this.checkboxUncheckActions = this.getAttribute("uncheckactions");
	this.checkboxTitle = this.getAttribute("tiddler",this.getVariable("currentTiddler"));
	this.checkboxTag = this.getAttribute("tag");
	this.checkboxField = this.getAttribute("field");
	this.checkboxIndex = this.getAttribute("index");
	this.checkboxChecked = this.getAttribute("checked");
	this.checkboxUnchecked = this.getAttribute("unchecked");
	this.checkboxDefault = this.getAttribute("default");
	this.checkboxClass = this.getAttribute("class","");
	this.checkboxInvertTag = this.getAttribute("invertTag","");
	this.isDisabled = this.getAttribute("disabled","no");
	// Make the child widgets
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
CheckboxWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.tiddler || changedAttributes.tag || changedAttributes.invertTag || changedAttributes.field || changedAttributes.index || changedAttributes.checked || changedAttributes.unchecked || changedAttributes["default"] || changedAttributes["class"] || changedAttributes.disabled) {
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
