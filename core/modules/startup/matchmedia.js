/*\
title: $:/core/modules/startup/matchmedia.js
type: application/javascript
module-type: startup

matchMedia() event listeners

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Export name and synchronous status
exports.name = "matchmedia";
exports.platforms = ["browser"];
exports.after = ["story"];
exports.synchronous = true;

var DARK_MODE_FIELD = "$:/state/dark-mode";

exports.startup = function() {

	$tw.wiki.setText(DARK_MODE_FIELD,"text",undefined,window.matchMedia('(prefers-color-scheme: dark)').matches.toString(),{suppressTimestamp: true});

	window.matchMedia('(prefers-color-scheme: dark)')
	.addEventListener('change',function(event) {
		$tw.wiki.setText(DARK_MODE_FIELD,"text",undefined,event.matches.toString(),{suppressTimestamp: true});
	});

};

})();
