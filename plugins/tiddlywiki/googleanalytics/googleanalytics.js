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

var GOOGLE_ANALYTICS_ACCOUNT = "$:/GoogleAnalyticsAccount",
	GOOGLE_ANALYTICS_DOMAIN = "$:/GoogleAnalyticsDomain";

exports.startup = function() {
	if($tw.browser) {
		window._gaq = window._gaq || [];
		_gaq.push(["_setAccount", $tw.wiki.getTiddlerText(GOOGLE_ANALYTICS_ACCOUNT)]);
		_gaq.push(["_setDomainName", $tw.wiki.getTiddlerText(GOOGLE_ANALYTICS_DOMAIN)]);
		_gaq.push(["_trackPageview"]);
		var ga = document.createElement("script");
		ga.type = "text/javascript";
		ga.async = true;
		ga.src = ("https:" == document.location.protocol ? "https://ssl" : "http://www") + ".google-analytics.com/ga.js";
		document.body.appendChild(ga);
	}
};

})();
