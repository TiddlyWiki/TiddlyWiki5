/*\
title: $:/core/modules/widgets/action-setfields.js
type: application/javascript
module-type: widget

Action widget to set multiple fields on a tiddler.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var SetFieldsWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
SetFieldsWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
SetFieldsWidget.prototype.render = function(parent,nextSibling) {
	this.computeAttributes();
	this.execute();
};

/*
Compute the internal state of the widget
*/
SetFieldsWidget.prototype.execute = function() {
	this.actionTiddler = this.getAttribute("$tiddler",this.getVariable("currentTiddler"));
};

/*
Refresh the widget by ensuring our attributes are up to date
*/
SetFieldsWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes["$tiddler"]) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

/*
Invoke the action associated with this widget
*/
SetFieldsWidget.prototype.invokeAction = function(triggeringWidget,event) {
	var self = this;
	$tw.utils.each(this.attributes,function(attribute,name) {
		if(name.charAt(0) !== "$") {
			self.wiki.setText(self.actionTiddler,name,undefined,attribute);
		}
	});
	return true; // Action was invoked
};

exports["action-setfields"] = SetFieldsWidget;

})();
