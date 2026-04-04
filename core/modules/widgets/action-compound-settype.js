/*\
title: $:/core/modules/widgets/action-compound-settype.js
type: application/javascript
module-type: widget

Action widget to set the type metadata on a sub-entry in a text/vnd.tiddlywiki-fields tiddler.

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var CompoundSetTypeWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

CompoundSetTypeWidget.prototype = new Widget();

CompoundSetTypeWidget.prototype.render = function(parent,nextSibling) {
	this.computeAttributes();
	this.execute();
};

CompoundSetTypeWidget.prototype.execute = function() {
	this.actionTiddler = this.getAttribute("$tiddler",this.getVariable("currentTiddler"));
	this.actionIndex = this.getAttribute("$index");
	this.actionType = this.getAttribute("$type");
};

CompoundSetTypeWidget.prototype.refresh = function(changedTiddlers) {
	return this.refreshChildren(changedTiddlers);
};

CompoundSetTypeWidget.prototype.invokeAction = function(triggeringWidget,event) {
	if(this.actionTiddler && this.actionIndex) {
		var data = this.wiki.getTiddlerData(this.actionTiddler,Object.create(null));
		var entry = data[this.actionIndex];
		var currentValue;
		// Extract current value from plain string or metadata object
		if(entry !== null && typeof entry === "object" && $tw.utils.hop(entry,"value")) {
			currentValue = entry.value;
		} else {
			currentValue = (entry !== undefined && entry !== null) ? entry.toString() : "";
		}
		if(this.actionType) {
			// Set type: wrap as metadata object
			data[this.actionIndex] = {value: currentValue, type: this.actionType};
		} else {
			// Remove type: unwrap to plain string
			data[this.actionIndex] = currentValue;
		}
		this.wiki.setTiddlerData(this.actionTiddler,data);
	}
	return true;
};

exports["action-compound-settype"] = CompoundSetTypeWidget;
