/*\
title: $:/core/modules/widgets/action-delete-secret.js
type: application/javascript
module-type: widget

Action widget to delete a secret

\*/

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var ActionDeleteSecretWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
ActionDeleteSecretWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
ActionDeleteSecretWidget.prototype.render = function(parent,nextSibling) {
	this.computeAttributes();
	this.execute();
};

/*
Compute the internal state of the widget
*/
ActionDeleteSecretWidget.prototype.execute = function() {
	this.secretName = this.getAttribute("$name");
};

/*
Refresh the widget
*/
ActionDeleteSecretWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(Object.keys(changedAttributes).length) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

/*
Invoke the action
*/
ActionDeleteSecretWidget.prototype.invokeAction = function(triggeringWidget,event) {
	if(this.secretName) {
		$tw.utils.deleteSecret(this.secretName);
		// Trigger refresh
		this.wiki.dispatchEvent({type: "tm-refresh"});
	}
	return true;
};

exports["action-delete-secret"] = ActionDeleteSecretWidget;
