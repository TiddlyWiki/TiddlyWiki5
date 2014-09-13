/*\
title: $:/core/modules/startup/password.js
type: application/javascript
module-type: startup

Password handling

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Export name and synchronous status
exports.name = "password";
exports.platforms = ["browser"];
exports.after = ["startup"];
exports.synchronous = true;

exports.startup = function() {
	$tw.rootWidget.addEventListener("tm-set-password",function(event) {
		$tw.passwordPrompt.createPrompt({
			serviceName: "Set a new password for this TiddlyWiki",
			noUserName: true,
			submitText: "Set password",
			canCancel: true,
			callback: function(data) {
				if(data) {
					$tw.crypto.setPassword(data.password);
				}
				return true; // Get rid of the password prompt
			}
		});
	});
	$tw.rootWidget.addEventListener("tm-clear-password",function(event) {
		$tw.crypto.setPassword(null);
	});
	// Ensure that $:/isEncrypted is maintained properly
	$tw.wiki.addEventListener("change",function(changes) {
		if($tw.utils.hop(changes,"$:/isEncrypted")) {
			$tw.crypto.updateCryptoStateTiddler();
		}
	});
};

})();
