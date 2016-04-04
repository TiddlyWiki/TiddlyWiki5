/*\
title: $:/plugins/tiddlywiki/text-slicer/modules/startup/slicer.js
type: application/javascript
module-type: startup

Setup the root widget event handlers

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Export name and synchronous status
exports.name = "slicer";
exports.platforms = ["browser"];
exports.after = ["startup"];
exports.synchronous = true;

// Install the root widget event handlers
exports.startup = function() {
	$tw.rootWidget.addEventListener("tm-slice-tiddler",function(event) {
		var slicer = new $tw.Slicer($tw.wiki,event.param,{
			destTitle: event.paramObject.destTitle
		});
		slicer.sliceTiddler(event.param)
		slicer.outputTiddlers();
		slicer.destroy();
	});
};

})();
