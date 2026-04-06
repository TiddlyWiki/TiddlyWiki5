/*\
title: $:/core/modules/widgets/action-setfield.js
type: application/javascript
module-type: widget

Action widget to set a single field or index on a tiddler.

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var SetFieldWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
SetFieldWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
SetFieldWidget.prototype.render = function(parent,nextSibling) {
	this.computeAttributes();
	this.execute();
};

/*
Compute the internal state of the widget
*/
SetFieldWidget.prototype.execute = function() {
	this.actionTiddler = this.getAttribute("$tiddler") || (!this.hasParseTreeNodeAttribute("$tiddler") && this.getVariable("currentTiddler"));
	this.actionField = this.getAttribute("$field");
	this.actionIndex = this.getAttribute("$index");
	this.actionIndexProperty = this.getAttribute("$indexProperty");
	this.actionValue = this.getAttribute("$value");
	this.actionTimestamp = this.getAttribute("$timestamp","yes") === "yes";
};

/*
Refresh the widget by ensuring our attributes are up to date
*/
SetFieldWidget.prototype.refresh = function(changedTiddlers) {
	// Nothing to refresh
	return this.refreshChildren(changedTiddlers);
};

/*
Invoke the action associated with this widget
*/
SetFieldWidget.prototype.invokeAction = function(triggeringWidget,event) {
	var self = this,
		options = {};
	if(this.actionTiddler) {
		options.suppressTimestamp = !this.actionTimestamp;
		if(this.actionIndex && this.actionIndexProperty) {
			// Set a metadata property on a data tiddler index entry
			var data = this.wiki.getTiddlerData(this.actionTiddler,Object.create(null));
			var entry = data[this.actionIndex];
			var currentValue;
			if(entry !== null && typeof entry === "object" && $tw.utils.hop(entry,"value")) {
				currentValue = entry.value;
			} else {
				currentValue = (entry !== undefined && entry !== null) ? entry.toString() : "";
			}
			if(this.actionValue) {
				// Set property: ensure entry is a metadata object
				if(entry === null || typeof entry !== "object" || !$tw.utils.hop(entry,"value")) {
					entry = {value: currentValue};
					data[this.actionIndex] = entry;
				}
				entry[this.actionIndexProperty] = this.actionValue;
			} else {
				// Remove property
				if(entry !== null && typeof entry === "object" && $tw.utils.hop(entry,"value")) {
					delete entry[this.actionIndexProperty];
					// If only "value" key remains, unwrap to plain string
					if(Object.keys(entry).length === 1) {
						data[this.actionIndex] = entry.value;
					}
				}
			}
			this.wiki.setTiddlerData(this.actionTiddler,data,{},options);
		} else if((typeof this.actionField == "string") || (typeof this.actionIndex == "string")  || (typeof this.actionValue == "string")) {
			this.wiki.setText(this.actionTiddler,this.actionField,this.actionIndex,this.actionValue,options);
		}
		$tw.utils.each(this.attributes,function(attribute,name) {
			if(name.charAt(0) !== "$") {
				self.wiki.setText(self.actionTiddler,name,undefined,attribute,options);
			}
		});
	}
	return true; // Action was invoked
};

exports["action-setfield"] = SetFieldWidget;
