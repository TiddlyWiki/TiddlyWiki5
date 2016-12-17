/*\
title: $:/plugins/tiddlywiki/xlsx-utils/startup.js
type: application/javascript
module-type: startup

Initialisation

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Export name and synchronous status
exports.name = "xlsx-startup";
exports.after = ["load-modules"];
exports.synchronous = true;

exports.startup = function() {
	// Check JSZip is installed
	if(!$tw.utils.hop($tw.modules.titles,"$:/plugins/tiddlywiki/jszip/jszip.js")) {
		// Make a logger
		var logger = new $tw.utils.Logger("xlsx-utils");
		logger.alert("The plugin 'xlsx-utils' requires the 'jszip' plugin to be installed");
	}
};

})();
