/*\

title: $:/core/modules/widgets/action-confirm.js
type: application/javascript
module-type: widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var ConfirmWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
ConfirmWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
ConfirmWidget.prototype.render = function(parent,nextSibling) {
	this.computeAttributes();
	this.execute();
	this.parentDomNode = parent;
	this.renderChildren(parent,nextSibling);
};

/*
Compute the internal state of the widget
*/
ConfirmWidget.prototype.execute = function() {
	this.message = this.getAttribute("$message");
	this.prompt = (this.getAttribute("$prompt","yes") == "yes" ? true : false);
	this.makeChildWidgets();
};

/*
Refresh the widget by ensuring our attributes are up to date
*/
ConfirmWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes["$message"] || changedAttributes["$prompt"]) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

/*
Invoke the action associated with this widget
*/
ConfirmWidget.prototype.invokeAction = function(triggeringWidget,event) {
	var invokeActions = true,
		handled = true;
	if(this.message && this.prompt) {
		invokeActions = confirm(this.message);
	}
	if(invokeActions) {
		handled = this.invokeActions(triggeringWidget,event);
	}
	return handled;
};

ConfirmWidget.prototype.allowActionPropagation = function() {
	return false;
};

exports["action-confirm"] = ConfirmWidget;

})();