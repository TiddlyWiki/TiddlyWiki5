/*\
title: $:/plugins/tiddlywiki/fullscreen/init.js
type: application/javascript
module-type: browser-startup

Message handler for full screen mode

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var toggleFullScreen = function() {
	if(document[$tw.browser.isFullScreen]) {
		document[$tw.browser.cancelFullScreen]();
	} else {
		document.documentElement[$tw.browser.requestFullScreen](Element.ALLOW_KEYBOARD_INPUT);
	}
};

exports.startup = function() {
	// Install the full screen handler
	document.addEventListener("tw-full-screen",function(event) {
		toggleFullScreen();
	},false);
};

})();
