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

exports.startup = function() {
	// getting parameters
	var GA_ACCOUNT = $tw.wiki.getTiddlerText("$:/GoogleAnalyticsAccount","").replace(/\n/g,""),
		GA_DOMAIN = $tw.wiki.getTiddlerText("$:/GoogleAnalyticsDomain","").replace(/\n/g,"");
	if (GA_DOMAIN == "" || GA_DOMAIN == undefined) GA_DOMAIN = "auto";

	// using ga "isogram" function
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

  ga('create', GA_ACCOUNT, GA_DOMAIN);
  ga('send', 'pageview');
};

})();
