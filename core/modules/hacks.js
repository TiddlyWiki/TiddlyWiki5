/*\
title: $:/core/modules/hacks.js
type: application/javascript
module-type: global

These functions are designed to be invoked in the browser developer tools or the node.js REPL.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Switch slowmotion animation mode on or off
*/
exports.slowmo = function(status) {
	if(status === undefined || status) {
		$tw.config.preferences.animationDuration = 4000;
	} else {
		$tw.config.preferences.animationDuration = 400;
	}
	$tw.config.preferences.animationDurationMs = $tw.config.preferences.animationDuration + "ms";
	return "Slowmo is " + ($tw.config.preferences.animationDuration === 400 ? "dis" : "") + "engaged."
};

})();
