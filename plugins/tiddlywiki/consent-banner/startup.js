/*\
title: $:/plugins/tiddlywiki/consent-banner/startup.js
type: application/javascript
module-type: startup

Startup initialisation

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Export name and synchronous status
exports.name = "consent-banner";
exports.platforms = ["browser"];
exports.after = ["startup"];
exports.synchronous = true;

var CHECK_CONSENT_INTERVAL = 1000, // Milliseconds between checking local storage
	IS_LOGGED_IN_TITLE = "$:/status/IsLoggedIn",
	CONSENT_KEY = "COOKIE_CONSENT", // Local storage keyname
	CONSENT_TITLE = "$:/state/consent-banner/accepted"; // "": undeclared, "yes": accepted, "no": declined

exports.startup = function() {
	var self = this,
		consentState = "",
		setConsentStatus = function(state) {
			if(consentState !== state) {
				consentState = state;
				// Write to local storage
				window.localStorage.setItem(CONSENT_KEY,state);
				// Write to a state tiddler
				$tw.wiki.addTiddler(new $tw.Tiddler({
					title: CONSENT_TITLE,
					text: state
				}));
			}
		},
		calculateConsentStatus = function() {
			// Consent is implied for logged in users, otherwise we check local storage
			return ($tw.wiki.getTiddlerText(IS_LOGGED_IN_TITLE) === "yes" && "yes") || window.localStorage.getItem(CONSENT_KEY) || "";
		},
		checkConsentStatus = function() {
			setConsentStatus(calculateConsentStatus());
			if(consentState === "") {
				pollConsentStatus();
			}
		},
		pollConsentStatus = function() {
			setTimeout(checkConsentStatus,CHECK_CONSENT_INTERVAL);
		};
	// Set the current constant status
	checkConsentStatus();
	// Listen for tm-clear-browser-storage messages
	$tw.rootWidget.addEventListener("tm-consent-accept",function(event) {
		setConsentStatus("yes");
	});
	$tw.rootWidget.addEventListener("tm-consent-decline",function(event) {
		setConsentStatus("no");
	});
	$tw.rootWidget.addEventListener("tm-consent-clear",function(event) {
		setConsentStatus("");
	});
};

})();
