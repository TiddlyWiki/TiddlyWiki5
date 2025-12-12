/*\
title: $:/plugins/tiddlywiki/googleanalytics/googleanalytics.js
type: application/javascript
module-type: startup

Runs Google Analytics with the measurement ID in the tiddler `$:/GoogleAnalyticsMeasurementID`

\*/

"use strict";

// Export name and synchronous status
exports.name = "google-analytics";
exports.platforms = ["browser"];
exports.synchronous = true;

var CONFIG_CONSENT_REQUIRED_TITLE = "$:/config/cookie-consent-required", // "yes" or "no" (the default)
	CONSENT_TITLE = "$:/state/consent-banner/accepted"; // "": undeclared, "yes": accepted, "no": declined

exports.startup = function() {
	var hasInitialised = false,
		initialiseGoogleAnalytics = function() {
			console.log("Initialising Google Analytics");
			hasInitialised = true;
			var gaMeasurementID = $tw.wiki.getTiddlerText("$:/GoogleAnalyticsMeasurementID","").replace(/\n/g,"");
			var url ="https://www.googletagmanager.com/gtag/js?id=" + gaMeasurementID;
			window.dataLayer = window.dataLayer || [];
			window.gtag = function() { if(window.dataLayer) window.dataLayer.push(arguments); };
			window.gtag("js",new Date());
			window.gtag("config",gaMeasurementID);
			const scriptElement = window.document.createElement("script");
			scriptElement.async = true;
			scriptElement.src = url;
			window.document.head.appendChild(scriptElement);
		};
	// Initialise now if consent isn't required
	if($tw.wiki.getTiddlerText(CONFIG_CONSENT_REQUIRED_TITLE) !== "yes") {
		initialiseGoogleAnalytics();
	} else {
		// Or has been granted already
		if($tw.wiki.getTiddlerText(CONSENT_TITLE) === "yes") {
			initialiseGoogleAnalytics();
		} else {
			// Or when our config tiddler changes
			$tw.wiki.addEventListener("change",function(changes) {
				if(changes[CONSENT_TITLE]) {
					if(!hasInitialised && $tw.wiki.getTiddlerText(CONSENT_TITLE) === "yes") {
						initialiseGoogleAnalytics();
					}
				}
			});
		}
	}
};
