/*\
title: $:/core/modules/startup/password.js
type: application/javascript
module-type: startup

Password handling

\*/

"use strict";

// Export name and synchronous status
exports.name = "password";
exports.platforms = ["browser"];
exports.after = ["startup"];
exports.synchronous = true;

exports.startup = function() {
	$tw.rootWidget.addEventListener("tm-set-password",function(event) {
		$tw.passwordPrompt.createPrompt({
			serviceName: $tw.language.getString("Encryption/PromptSetPassword"),
			noUserName: true,
			submitText: $tw.language.getString("Encryption/SetPassword"),
			canCancel: true,
			repeatPassword: true,
			callback: function(data) {
				if(data) {
					$tw.crypto.setPassword(data.password);
				}
				return true; // Get rid of the password prompt
			}
		});
	});
	$tw.rootWidget.addEventListener("tm-clear-password",function(event) {
		if($tw.browser) {
			if(!confirm($tw.language.getString("Encryption/ConfirmClearPassword"))) {
				return;
			}
		}
		$tw.crypto.setPassword(null);
	});
	// Ensure that $:/isEncrypted is maintained properly
	$tw.wiki.addEventListener("change",function(changes) {
		if($tw.utils.hop(changes,"$:/isEncrypted")) {
			$tw.crypto.updateCryptoStateTiddler();
		}
	});
};
