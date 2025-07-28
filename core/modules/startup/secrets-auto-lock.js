/*\
title: $:/core/modules/startup/secrets-auto-lock.js
type: application/javascript
module-type: startup

Auto-lock secrets vault after inactivity

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Export name and synchronous status
exports.name = "secrets-auto-lock";
exports.platforms = ["browser"];
exports.after = ["startup"];
exports.synchronous = true;

exports.startup = function() {
	var autoLockTimer = null;
	var DEFAULT_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds
	
	// Get configured timeout or use default
	var getAutoLockTimeout = function() {
		var timeout = $tw.wiki.getTiddlerText("$:/config/SecretsAutoLockTimeout");
		if(timeout) {
			var minutes = parseFloat(timeout);
			if(!isNaN(minutes) && minutes > 0) {
				return minutes * 60 * 1000;
			}
		}
		return DEFAULT_TIMEOUT;
	};
	
	// Reset the auto-lock timer
	var resetAutoLockTimer = function() {
		// Clear existing timer
		if(autoLockTimer) {
			clearTimeout(autoLockTimer);
			autoLockTimer = null;
		}
		
		// Only set timer if vault is unlocked
		if($tw.utils.getSecretsStoreState() === "unlocked") {
			var timeout = getAutoLockTimeout();
			autoLockTimer = setTimeout(function() {
				// Lock the vault by clearing the password
				$tw.crypto.setPassword(null);
				// Notify user
				$tw.notifier.display("$:/language/Notifications/SecretsVaultAutoLocked");
				// Force refresh
				$tw.rootWidget.dispatchEvent({type: "tm-refresh"});
			}, timeout);
		}
	};
	
	// Listen for any wiki changes (user activity)
	$tw.wiki.addEventListener("change", function(changes) {
		// Reset timer on any activity
		resetAutoLockTimer();
	});
	
	// Listen for password changes
	$tw.rootWidget.addEventListener("tm-password-change", function() {
		resetAutoLockTimer();
	});
	
	// Also reset on user interactions
	if($tw.browser) {
		["click", "keypress", "touchstart"].forEach(function(eventType) {
			document.addEventListener(eventType, function() {
				resetAutoLockTimer();
			}, true);
		});
	}
	
	// Initial setup
	resetAutoLockTimer();
};

})();
