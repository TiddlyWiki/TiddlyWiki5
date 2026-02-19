/*\
title: $:/core/modules/widgets/action-sendmessage.js
type: application/javascript
module-type: widget
\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var SendMessageWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

SendMessageWidget.prototype = new Widget();

SendMessageWidget.prototype.render = function(parent,nextSibling) {
	this.computeAttributes();
	this.execute();
};

SendMessageWidget.prototype.execute = function() {
	this.actionMessage = this.getAttribute("$message");
	this.actionParam = this.getAttribute("$param");
	this.actionName = this.getAttribute("$name");
	this.actionValue = this.getAttribute("$value","");
	this.actionNames = this.getAttribute("$names");
	this.actionValues = this.getAttribute("$values");
};

SendMessageWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(Object.keys(changedAttributes).length) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

SendMessageWidget.prototype.invokeAction = function(triggeringWidget,event) {
	// Get the string parameter
	var param = this.actionParam;
	// Assemble the parameters as a hashmap
	var paramObject = Object.create(null);
	// Add names/values pairs if present
	if(this.actionNames && this.actionValues) {
		var names = this.wiki.filterTiddlers(this.actionNames,this),
			values = this.wiki.filterTiddlers(this.actionValues,this);
		$tw.utils.each(names,function(name,index) {
			paramObject[name] = values[index] || "";
		});
	}

	$tw.utils.each(this.attributes,function(attribute,name) {
		if(name.charAt(0) !== "$") {
			paramObject[name] = attribute;
		}
	});
	// Add name/value pair if present
	if(this.actionName) {
		paramObject[this.actionName] = this.actionValue;
	}

	var params = {
		type: this.actionMessage,
		param: param,
		paramObject: paramObject,
		event: event,
		tiddlerTitle: this.getVariable("currentTiddler"),
		navigateFromTitle: this.getVariable("storyTiddler")
	};
	this.dispatchEvent(params);
	return true; // Action was invoked
};

exports["action-sendmessage"] = SendMessageWidget;
