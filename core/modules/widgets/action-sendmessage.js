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
   
   	// Get the parameter
	var param = this.actionParam;
	
	if(!param) {
	  param = Object.create(null);
	}
	
	// Merge all other attributes into the object to allow additional parameters
	// if properties of actionParam get overriden, its the users explicit choice
	var count = 0;
	$tw.utils.each(this.attributes,function(attribute,name) {
	  if(name.charAt(0) !== "$") {
	    param[name] = attribute;
	    count++;
	  }
	});
	
	// Revert to an empty parameter if param was originally empty and no parameters where added
	if(!this.actionParam && count == 0) {
	  param = undefined;
	}
	
	// Dispatch the message
	this.dispatchEvent({type: this.actionMessage, param: param, tiddlerTitle: this.getVariable("currentTiddler")});
	return true; // Action was invoked
};

exports["action-sendmessage"] = SendMessageWidget;

})();
