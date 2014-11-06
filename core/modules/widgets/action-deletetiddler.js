/*\
title: $:/core/modules/widgets/action-deletetiddler.js
type: application/javascript
module-type: widget

Action widget to delete a tiddler.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var DeleteTiddlerWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
DeleteTiddlerWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
DeleteTiddlerWidget.prototype.render = function(parent,nextSibling) {
	this.computeAttributes();
	this.execute();
};

/*
Compute the internal state of the widget
*/
DeleteTiddlerWidget.prototype.execute = function() {
	this.actionTiddler = this.getAttribute("$tiddler",this.getVariable("currentTiddler"));
	this.actionConfirm = this.getAttribute("$confirm");
};

/*
Refresh the widget by ensuring our attributes are up to date
*/
DeleteTiddlerWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes["$tiddler"] || changedAttributes["$confirm"]) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

/*
Invoke the action associated with this widget
*/
DeleteTiddlerWidget.prototype.invokeAction = function(triggeringWidget,event) {
	
	this.wiki.setText(this.actionTiddler,this.actionField,this.actionIndex,this.actionValue);
	return true; // Action was invoked
};

exports["action-deletetiddler"] = DeleteTiddlerWidget;

})();
