/*\
title: $:/plugins/tiddlywiki/fullscreen/init.js
type: application/javascript
module-type: browser-startup

Message handler for full screen mode

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false, Element: false */
"use strict";

var d = document,
	db = d.body,
	_requestFullscreen = db.webkitRequestFullscreen !== undefined ? "webkitRequestFullscreen" :
						db.mozRequestFullScreen !== undefined ? "mozRequestFullScreen" :
						db.msRequestFullscreen !== undefined ? "msRequestFullscreen" :
						db.requestFullscreen !== undefined ? "requestFullscreen" : "",
	_exitFullscreen = d.webkitExitFullscreen !== undefined ? "webkitExitFullscreen" :
							d.mozCancelFullScreen !== undefined ? "mozCancelFullScreen" :
							d.msExitFullscreen !== undefined ? "msExitFullscreen" :
							d.exitFullscreen !== undefined ? "exitFullscreen" : "",
	_fullscreenElement = d.webkitFullscreenElement !== undefined ? "webkitFullscreenElement" :
							d.mozFullScreenElement !== undefined ? "mozFullScreenElement" :
							d.msFullscreenElement !== undefined ? "msFullscreenElement" :
							d.fullscreenElement !== undefined ? "fullscreenElement" : "";

var toggleFullscreen = function() {
	if(document[_fullscreenElement]) {
		document[_exitFullscreen]();
	} else {
		document.documentElement[_requestFullscreen](Element.ALLOW_KEYBOARD_INPUT);
	}
};

exports.startup = function() {
	// Install the full screen handler
	if(_requestFullscreen) {
		$tw.rootWidget.addEventListener("tw-full-screen",function(event) {
			toggleFullscreen();
		});
	}
};

})();
