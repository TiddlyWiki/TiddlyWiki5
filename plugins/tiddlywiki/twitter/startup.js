/*\
title: $:/plugins/tiddlywiki/twitter/startup.js
type: application/javascript
module-type: startup

Twitter initialisation

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Export name and synchronous status
exports.name = "twitter";
exports.before = ["startup"];
exports.synchronous = true;

exports.startup = function() {
	var logger = new $tw.utils.Logger("twitter-plugin");
	if($tw.browser && !window.twttr) {
		logger.alert("The plugin 'tiddlywiki/twitter' is disabled until this wiki is saved and reloaded again");
	}
};

})();
