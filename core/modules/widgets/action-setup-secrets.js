/*\
title: $:/core/modules/widgets/action-setup-secrets.js
type: application/javascript
module-type: widget

Action widget to set up the secrets vault with a password

\*/

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var ActionSetupSecretsWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
ActionSetupSecretsWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
ActionSetupSecretsWidget.prototype.render = function(parent,nextSibling) {
	this.computeAttributes();
	this.execute();
};

/*
Compute the internal state of the widget
*/
ActionSetupSecretsWidget.prototype.execute = function() {
	// No attributes needed
};

/*
Refresh the widget
*/
ActionSetupSecretsWidget.prototype.refresh = function(changedTiddlers) {
	return this.refreshChildren(changedTiddlers);
};

/*
Invoke the action
*/
ActionSetupSecretsWidget.prototype.invokeAction = function(triggeringWidget,event) {
	var self = this;
	
	$tw.passwordPrompt.createPrompt({
		serviceName: "Set up secrets vault",
		noUserName: true,
		submitText: "Set Password",
		canCancel: true,
		repeatPassword: true,
		callback: function(data) {
			if(data) {
				// Set the password
				$tw.cryptovault.setPassword(data.password);
				
				// Create the vault with verification field
				var verificationEncrypted = $tw.utils.encryptSecret("VALID_PASSWORD");
				if(verificationEncrypted) {
					$tw.wiki.addTiddler(new $tw.Tiddler({
						title: "$:/secrets/vault",
						"secrets-verification": verificationEncrypted
					}));
				}
				
				// Force refresh
				self.wiki.dispatchEvent({type: "tm-refresh"});
				
				// Send notification
				$tw.notifier.display("$:/language/Notifications/SecretsVaultCreated");
			}
			return true; // Get rid of the password prompt
		}
	});
	
	return true;
};

exports["action-setup-secrets"] = ActionSetupSecretsWidget;
