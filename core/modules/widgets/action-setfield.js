/*\
title: $:/core/modules/widgets/action-setfield.js
type: application/javascript
module-type: widget
\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var SetFieldWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

SetFieldWidget.prototype = new Widget();

SetFieldWidget.prototype.render = function(parent,nextSibling) {
	this.computeAttributes();
	this.execute();
};

SetFieldWidget.prototype.execute = function() {
	this.actionTiddler = this.getAttribute("$tiddler") || (!this.hasParseTreeNodeAttribute("$tiddler") && this.getVariable("currentTiddler"));
	this.actionField = this.getAttribute("$field");
	this.actionIndex = this.getAttribute("$index");
	this.actionValue = this.getAttribute("$value");
	this.actionTimestamp = this.getAttribute("$timestamp","yes") === "yes";
};

SetFieldWidget.prototype.refresh = function(changedTiddlers) {
	// Nothing to refresh
	return this.refreshChildren(changedTiddlers);
};

SetFieldWidget.prototype.invokeAction = function(triggeringWidget,event) {
	var self = this,
		options = {};
	if(this.actionTiddler) {
		options.suppressTimestamp = !this.actionTimestamp;
		if((typeof this.actionField == "string") || (typeof this.actionIndex == "string")  || (typeof this.actionValue == "string")) {
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
