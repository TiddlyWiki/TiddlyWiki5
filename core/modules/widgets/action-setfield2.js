/*\
title: $:/core/modules/widgets/action-setfield2.js
type: application/javascript
module-type: widget

Same as action-setfield but attempts to resend on widget refresh. Buggy.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var SetFieldWidget2 = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
SetFieldWidget2.prototype = new Widget();

/*
Render this widget into the DOM
*/
SetFieldWidget2.prototype.render = function(parent,nextSibling) {
	this.computeAttributes();
	this.execute();
};

/*
Compute the internal state of the widget
*/
SetFieldWidget2.prototype.execute = function() {
	this.actionTiddler = this.getAttribute("$tiddler",this.getVariable("currentTiddler"));
	this.actionField = this.getAttribute("$field");
	this.actionIndex = this.getAttribute("$index");
	this.actionValue = this.getAttribute("$value");
	this.actionTimestamp = this.getAttribute("$timestamp","yes") === "yes";
};

/*
Refresh the widget by ensuring our attributes are up to date
*/
SetFieldWidget2.prototype.refresh = function(changedTiddlers) {
	// console.log('refreshing setfield2 widget');
	var changedAttributes = this.computeAttributes();
	if(changedAttributes["$tiddler"] || changedAttributes["$field"] || changedAttributes["$index"] || changedAttributes["$value"]) {
		this.refreshSelf();
		return true;
	}
	
	return this.refreshChildren(changedTiddlers);
};

/*
// Same as widget.js except invokes action
*/
SetFieldWidget2.prototype.refreshChildren = function(changedTiddlers) {
	var self = this,
		refreshed = false;
	$tw.utils.each(this.children,function(childWidget) {
		refreshed = childWidget.refresh(changedTiddlers) || refreshed;
	});
	if (refreshed == false) {
		// Invokes after this and children are done refreshing
		this.invokeAction(); 
	}
	return refreshed;
};

/*
Invoke the action associated with this widget
*/
SetFieldWidget2.prototype.invokeAction = function(triggeringWidget,event) {
	console.log('invoking setfield2: ' + this.actionValue);
	var self = this,
		options = {};
	options.suppressTimestamp = !this.actionTimestamp;
	if((typeof this.actionField == "string") || (typeof this.actionIndex == "string")  || (typeof this.actionValue == "string")) {
		this.wiki.setText(this.actionTiddler,this.actionField,this.actionIndex,this.actionValue,options);
	}
	$tw.utils.each(this.attributes,function(attribute,name) {
		if(name.charAt(0) !== "$") {
			self.wiki.setText(self.actionTiddler,name,undefined,attribute,options);
		}
	});
	return true; // Action was invoked
};

exports["action-setfield2"] = SetFieldWidget2;

})();
