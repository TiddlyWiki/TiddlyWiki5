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
	LegacySelectionTracker = require("$:/plugins/tiddlywiki/dynannotate/legacy-selection-tracker.js").LegacySelectionTracker;

exports.startup = function() {
	$tw.dynannotate = {};
	if($tw.wiki.getTiddlerText(CONFIG_SELECTION_TRACKER_TITLE,"yes") === "yes") {
		$tw.dynannotate.selectionTracker = new SelectionTracker($tw.wiki);
	}
	if($tw.wiki.getTiddlerText(CONFIG_LEGACY_SELECTION_TRACKER_TITLE,"yes") === "yes") {
		$tw.dynannotate.legacySelectionTracker = new LegacySelectionTracker($tw.wiki,{
			allowBlankSelectionPopup: true
		});
	}
};

})();
	