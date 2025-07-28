/*\
title: $:/core/modules/widgets/action-unlock-secrets.js
type: application/javascript
module-type: widget

Action widget to unlock the secrets vault

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var ActionUnlockSecretsWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
ActionUnlockSecretsWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
ActionUnlockSecretsWidget.prototype.render = function(parent,nextSibling) {
	this.computeAttributes();
	this.execute();
};

/*
Compute the internal state of the widget
*/
ActionUnlockSecretsWidget.prototype.execute = function() {
	// No attributes needed
};

/*
Refresh the widget
*/
ActionUnlockSecretsWidget.prototype.refresh = function(changedTiddlers) {
	return this.refreshChildren(changedTiddlers);
};

/*
Invoke the action
*/
ActionUnlockSecretsWidget.prototype.invokeAction = function(triggeringWidget,event) {
	var self = this;
	
	$tw.passwordPrompt.createPrompt({
		serviceName: "Unlock secrets vault",
		noUserName: true,
		canCancel: true,
		submitText: "Unlock",
		callback: function(data) {
			if(!data) return true;
			if($tw.utils.verifySecretsPassword(data.password)) {
				$tw.crypto.setPassword(data.password);
				// Force refresh
				self.wiki.dispatchEvent({type: "tm-refresh"});
				return true;
			}
			return false;
		}
	});
	
	return true;
};

exports["action-unlock-secrets"] = ActionUnlockSecretsWidget;

})();
