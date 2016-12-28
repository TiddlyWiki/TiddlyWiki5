/*\
title: $:/plugins/tiddlywiki/text-slicer/modules/startup/slicer-startup.js
type: application/javascript
module-type: startup

Setup the root widget event handlers

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var textSlicer = require("$:/plugins/tiddlywiki/text-slicer/modules/slicer.js");

// Export name and synchronous status
exports.name = "slicer";
exports.platforms = ["browser"];
exports.after = ["startup"];
exports.synchronous = true;

// Install the root widget event handlers
exports.startup = function() {
	// Check xmldom is installed
	if(!$tw.utils.hop($tw.modules.titles,"$:/plugins/tiddlywiki/xmldom/dom-parser")) {
		// Make a logger
		var logger = new $tw.utils.Logger("text-slicer");
		logger.alert("The plugin 'text-slicer' requires the 'xmldom' plugin to be installed");
	}
	// Add tm-slice-tiddler event handler
	$tw.rootWidget.addEventListener("tm-slice-tiddler",function(event) {
		var slicer = new textSlicer.Slicer({
			sourceTiddlerTitle: event.param,
			baseTiddlerTitle: event.paramObject && event.paramObject.destTitle,
			wiki: $tw.wiki
		});
		$tw.wiki.addTiddlers(slicer.getTiddlers());
	});
};

})();
