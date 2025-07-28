/*\
title: $:/core/modules/widgets/action-change-password.js
type: application/javascript
module-type: widget

Action widget to change the secrets vault password

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var ActionChangePasswordWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
ActionChangePasswordWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
ActionChangePasswordWidget.prototype.render = function(parent,nextSibling) {
	this.computeAttributes();
	this.execute();
};

/*
Compute the internal state of the widget
*/
ActionChangePasswordWidget.prototype.execute = function() {
	// Make child widgets
	this.makeChildWidgets();
};

/*
Invoke the action associated with this widget
*/
ActionChangePasswordWidget.prototype.invokeAction = function(triggeringWidget,event) {
	var self = this;
	
	// Check if secrets are currently unlocked
	var state = $tw.utils.getSecretsStoreState();
	if(state !== "unlocked") {
		$tw.notifier.display("$:/language/Notifications/SecretsNotUnlocked",{
			variables: {
				state: state
			}
		});
		return true;
	}
	
	// Prompt for current password
	$tw.passwordPrompt.createPrompt({
		serviceName: $tw.language.getString("Secrets/ChangePassword/CurrentPassword/Prompt"),
		noUserName: true,
		submitText: $tw.language.getString("Secrets/ChangePassword/CurrentPassword/Button"),
		canCancel: true,
		callback: function(data) {
			if(!data || !data.password) return false;
			var currentPassword = data.password;
			
			// Verify current password
			if(!$tw.utils.verifySecretsPassword(currentPassword)) {
				$tw.notifier.display("$:/language/Notifications/IncorrectPassword");
				return true;
			}
			
			// Prompt for new password
			$tw.passwordPrompt.createPrompt({
				serviceName: $tw.language.getString("Secrets/ChangePassword/NewPassword/Prompt"),
				noUserName: true,
				submitText: $tw.language.getString("Secrets/ChangePassword/NewPassword/Button"),
				canCancel: true,
				callback: function(data) {
					if(!data || !data.password) return false;
					var newPassword = data.password;
					
					// Prompt for confirmation
					$tw.passwordPrompt.createPrompt({
						serviceName: $tw.language.getString("Secrets/ChangePassword/ConfirmPassword/Prompt"),
						noUserName: true,
						submitText: $tw.language.getString("Secrets/ChangePassword/ConfirmPassword/Button"),
						canCancel: true,
						callback: function(data) {
							if(!data || !data.password) return false;
							var confirmPassword = data.password;
							
							// Check passwords match
							if(newPassword !== confirmPassword) {
								$tw.notifier.display("$:/language/Notifications/PasswordsDoNotMatch");
								return true;
							}
							
							// Change the password
							var result = $tw.utils.changeSecretsPassword(currentPassword, newPassword);
							
							if(result.success) {
								$tw.notifier.display("$:/language/Notifications/PasswordChanged");
							} else {
								$tw.notifier.display("$:/language/Notifications/PasswordChangeFailed",{
									variables: {
										error: result.error
									}
								});
							}
							
							return true;
						}
					});
					return true;
				}
			});
			return true;
		}
	});
	return true;
};

/*
Refresh the widget by ensuring our attributes are up to date
*/
ActionChangePasswordWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(Object.keys(changedAttributes).length) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

exports["action-change-password"] = ActionChangePasswordWidget;

})();
