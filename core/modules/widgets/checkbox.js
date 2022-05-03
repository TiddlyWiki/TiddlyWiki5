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
	var isChecked;
	// Save the parent dom node
	this.parentDomNode = parent;
	// Compute our attributes
	this.computeAttributes();
	// Execute our logic
	this.execute();
	// Create our elements
	this.labelDomNode = this.document.createElement("label");
	this.labelDomNode.setAttribute("class","tc-checkbox " + this.checkboxClass);
	this.inputDomNode = this.document.createElement("input");
	this.inputDomNode.setAttribute("type","checkbox");
	isChecked = this.getValue();
	if(isChecked) {
		this.inputDomNode.setAttribute("checked","true");
		$tw.utils.addClass(this.labelDomNode,"tc-checkbox-checked");
	}
	if(isChecked === undefined && this.checkboxIndeterminate === "yes") {
		this.inputDomNode.indeterminate = true;
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
	if(tiddler || this.checkboxFilter) {
		if(this.checkboxTag) {
			if(this.checkboxInvertTag === "yes") {
				return !tiddler.hasTag(this.checkboxTag);
			} else {
				return tiddler.hasTag(this.checkboxTag);
			}
		}
		if(this.checkboxField || this.checkboxIndex) {
			// Same logic applies to fields and indexes
			var value;
			if(this.checkboxField) {
				if($tw.utils.hop(tiddler.fields,this.checkboxField)) {
					value = tiddler.fields[this.checkboxField] || "";
				} else {
					value = this.checkboxDefault || "";
				}
			} else {
				value = this.wiki.extractTiddlerDataItem(tiddler,this.checkboxIndex,this.checkboxDefault || "");
			}
			if(value === this.checkboxChecked) {
				return true;
			}
			if(value === this.checkboxUnchecked) {
				return false;
			}
			// Neither value found: were both specified?
			if(this.checkboxChecked && !this.checkboxUnchecked) {
				return false; // Absence of checked value
			}
			if(this.checkboxUnchecked && !this.checkboxChecked) {
				return true; // Absence of unchecked value
			}
			if(this.checkboxChecked && this.checkboxUnchecked) {
				// Both specified but neither found: indeterminate or false, depending
				if(this.checkboxIndeterminate === "yes") {
					return undefined;
				} else {
					return false;
				}
			}
		}
		if(this.checkboxListField || this.checkboxListIndex || this.checkboxFilter) {
			// Same logic applies to lists and filters
			var list;
			if(this.checkboxListField) {
				if($tw.utils.hop(tiddler.fields,this.checkboxListField)) {
					list = tiddler.getFieldList(this.checkboxListField);
				} else {
					list = $tw.utils.parseStringArray(this.checkboxDefault || "") || [];
				}
			} else if (this.checkboxListIndex) {
				list = $tw.utils.parseStringArray(this.wiki.extractTiddlerDataItem(tiddler,this.checkboxListIndex,this.checkboxDefault || "")) || [];
			} else {
				list = this.wiki.filterTiddlers(this.checkboxFilter,this) || [];
			}
			if(list.indexOf(this.checkboxChecked) !== -1) {
				return true;
			}
			if(list.indexOf(this.checkboxUnchecked) !== -1) {
				return false;
			}
			// Neither one present
			if(this.checkboxChecked && !this.checkboxUnchecked) {
				return false; // Absence of checked value
			}
			if(this.checkboxUnchecked && !this.checkboxChecked) {
				return true; // Absence of unchecked value
			}
			if(this.checkboxChecked && this.checkboxUnchecked) {
				// Both specified but neither found: indeterminate or false, depending
				if(this.checkboxIndeterminate === "yes") {
					return undefined;
				} else {
					return false;
				}
			}
			// Neither specified, so empty list is false, non-empty is true
			return !!list.length;
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
		value = checked ? this.checkboxChecked : this.checkboxUnchecked,
		notValue = checked ? this.checkboxUnchecked : this.checkboxChecked;
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
	// Set the list field (or index) if specified
	if(this.checkboxListField || this.checkboxListIndex) {
		var listContents, oldPos, newPos;
		if(this.checkboxListField) {
			listContents = tiddler.getFieldList(this.checkboxListField);
		} else {
			listContents = $tw.utils.parseStringArray(this.wiki.extractTiddlerDataItem(this.checkboxTitle,this.checkboxListIndex) || "") || [];
		}
		oldPos = notValue ? listContents.indexOf(notValue) : -1;
		newPos = value ? listContents.indexOf(value) : -1;
		if(oldPos === -1 && newPos !== -1) {
			// old value absent, new value present: no change needed
		} else if(oldPos === -1) {
			// neither one was present
			if(value) {
				listContents.push(value);
				hasChanged = true;
			} else {
				// value unspecified? then leave list unchanged
			}
		} else if(newPos === -1) {
			// old value present, new value absent
			if(value) {
				listContents[oldPos] = value;
				hasChanged = true;
			} else {
				listContents.splice(oldPos, 1)
				hasChanged = true;
			}
		} else {
			// both were present: just remove the old one, leave new alone
			listContents.splice(oldPos, 1)
			hasChanged = true;
		}
		if(this.checkboxListField) {
			newFields[this.checkboxListField] = $tw.utils.stringifyList(listContents);
		}
		// The listIndex case will be handled in the if(hasChanged) block below
	}
	if(hasChanged) {
		if(this.checkboxIndex) {
			this.wiki.setText(this.checkboxTitle,"",this.checkboxIndex,value);
		} else if(this.checkboxListIndex) {
			var listIndexValue = (listContents && listContents.length) ? $tw.utils.stringifyList(listContents) : undefined;
			this.wiki.setText(this.checkboxTitle,"",this.checkboxListIndex,listIndexValue);
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
	this.checkboxListField = this.getAttribute("listField");
	this.checkboxListIndex = this.getAttribute("listIndex");
	this.checkboxFilter = this.getAttribute("filter");
	this.checkboxChecked = this.getAttribute("checked");
	this.checkboxUnchecked = this.getAttribute("unchecked");
	this.checkboxDefault = this.getAttribute("default");
	this.checkboxIndeterminate = this.getAttribute("indeterminate","no");
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
	if(changedAttributes.tiddler || changedAttributes.tag || changedAttributes.invertTag || changedAttributes.field || changedAttributes.index || changedAttributes.listField || changedAttributes.listIndex || changedAttributes.filter || changedAttributes.checked || changedAttributes.unchecked || changedAttributes["default"] || changedAttributes.indeterminate || changedAttributes["class"] || changedAttributes.disabled) {
		this.refreshSelf();
		return true;
	} else {
		var refreshed = false;
		if(changedTiddlers[this.checkboxTitle]) {
			var isChecked = this.getValue();
			this.inputDomNode.checked = !!isChecked;
			this.inputDomNode.indeterminate = (isChecked === undefined);
			refreshed = true;
			if(isChecked) {
				$tw.utils.addClass(this.labelDomNode,"tc-checkbox-checked");
			} else {
				$tw.utils.removeClass(this.labelDomNode,"tc-checkbox-checked");
			}
		}
		return this.refreshChildren(changedTiddlers) || refreshed;
	}
};

exports.checkbox = CheckboxWidget;

})();
