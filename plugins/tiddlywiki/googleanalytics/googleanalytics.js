/*\
title: $:/plugins/tiddlywiki/googleanalytics/googleanalytics.js
type: application/javascript
module-type: startup

Runs Google Analytics with the account number in the tiddler `$:/GoogleAnalyticsAccount` and the domain name in `$:/GoogleAnalyticsDomain`

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Export name and synchronous status
exports.name = "google-analytics";
exports.platforms = ["browser"];
exports.synchronous = true;

var CONFIG_CONSENT_REQUIRED_TITLE = "$:/config/cookie-consent-required",
	CONSENT_TITLE = "$:/state/consent-banner/accepted"; // "": undeclared, "yes": accepted, "no": declined

exports.startup = function() {
	var hasInitialised = false,
		initialiseGoogleAnalytics = function() {
			console.log("Initialising Google Analytics");
			hasInitialised = true;
			var gaAccount = $tw.wiki.getTiddlerText("$:/GoogleAnalyticsAccount","").replace(/\n/g,""),
				gaDomain = $tw.wiki.getTiddlerText("$:/GoogleAnalyticsDomain","auto").replace(/\n/g,"");
			// Using ga "isogram" function
			(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
			(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
			m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
			})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
			ga('create',gaAccount,gaDomain);
			ga('send','pageview');
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



})();
