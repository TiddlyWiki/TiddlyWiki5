/*\
title: $:/core/modules/widgets/action-sendmessage.js
type: application/javascript
module-type: widget

Action widget to send a message

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var SendMessageWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
SendMessageWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
SendMessageWidget.prototype.render = function(parent,nextSibling) {
	this.computeAttributes();
	this.execute();
};

/*
Compute the internal state of the widget
*/
SendMessageWidget.prototype.execute = function() {
	this.actionMessage = this.getAttribute("$message");
	this.actionParam = this.getAttribute("$param");
};

/*
Refresh the widget by ensuring our attributes are up to date
*/
SendMessageWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes["$message"] || changedAttributes["$param"]) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

/*
Invoke the action associated with this widget
*/
SendMessageWidget.prototype.invokeAction = function(triggeringWidget,event) {
	// Get the string parameter
	var param = this.actionParam;
	// Assemble the attributes as a hashmap
	var paramObject = Object.create(null);
	var count = 0;
	$tw.utils.each(this.attributes,function(attribute,name) {
		if(name.charAt(0) !== "$") {
			paramObject[name] = attribute;
			count++;
		}
	});
	// Dispatch the message
	this.dispatchEvent({type: this.actionMessage, param: param, paramObject: paramObject, tiddlerTitle: this.getVariable("currentTiddler")});
	return true; // Action was invoked
};

exports["action-sendmessage"] = SendMessageWidget;

})();
