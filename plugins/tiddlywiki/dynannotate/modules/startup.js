const { ElementSpotlight } = require("./element-spotlight");

/*\
title: $:/plugins/tiddlywiki/dynannotate/startup.js
type: application/javascript
module-type: startup

Startup the dyannotate background daemon to track the selection

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Export name and synchronous status
exports.name = "dyannotate-startup";
exports.platforms = ["browser"];
exports.after = ["render"];
exports.synchronous = true;

var CONFIG_SELECTION_TRACKER_TITLE = "$:/config/Dynannotate/SelectionTracker/Enable",
	CONFIG_LEGACY_SELECTION_TRACKER_TITLE = "$:/config/Dynannotate/LegacySelectionTracker/Enable";

var SelectionTracker = require("$:/plugins/tiddlywiki/dynannotate/selection-tracker.js").SelectionTracker,
	LegacySelectionTracker = require("$:/plugins/tiddlywiki/dynannotate/legacy-selection-tracker.js").LegacySelectionTracker,
	ElementSpotlight = require("$:/plugins/tiddlywiki/dynannotate/element-spotlight.js").ElementSpotlight;

exports.startup = function() {
	$tw.dynannotate = {};
	// Setup selection tracker
	if($tw.wiki.getTiddlerText(CONFIG_SELECTION_TRACKER_TITLE,"yes") === "yes") {
		$tw.dynannotate.selectionTracker = new SelectionTracker($tw.wiki);
	}
	// Setup legacy selection tracker
	if($tw.wiki.getTiddlerText(CONFIG_LEGACY_SELECTION_TRACKER_TITLE,"yes") === "yes") {
		$tw.dynannotate.legacySelectionTracker = new LegacySelectionTracker($tw.wiki,{
			allowBlankSelectionPopup: true
		});
	}
	// Set up the element spotlight
	$tw.dynannotate.elementSpotlight = new ElementSpotlight();
	$tw.rootWidget.addEventListener("tm-spotlight-element",function(event) {
		var selectors = [];
		if(event.paramObject.selector) {
			selectors.push(event.paramObject.selector);
		}
		$tw.utils.each(Object.keys(event.paramObject).sort(),function(name) {
			var SELECTOR_PROPERTY_PREFIX = "selector-";
			if($tw.utils.startsWith(name,SELECTOR_PROPERTY_PREFIX)) {
				selectors.push(event.paramObject[name]);
			}
		});
		if(event.paramObject["selector-fallback"]) {
			selectors.push(event.paramObject["selector-fallback"]);
		}
		$tw.dynannotate.elementSpotlight.shineSpotlight(selectors);
	});
};

})();
	