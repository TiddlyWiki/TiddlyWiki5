/*\
title: $:/core/modules/startup/rootwidget.js
type: application/javascript
module-type: startup

Setup the root widget and the core root widget handlers

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Export name and synchronous status
exports.name = "rootwidget";
exports.platforms = ["browser"];
exports.after = ["startup"];
exports.before = ["story"];
exports.synchronous = true;

exports.startup = function() {
	// Install the modal message mechanism
	$tw.modal = new $tw.utils.Modal($tw.wiki);
	$tw.rootWidget.addEventListener("tm-modal",function(event) {
		$tw.modal.display(event.param);
	});
	// Install the notification  mechanism
	$tw.notifier = new $tw.utils.Notifier($tw.wiki);
	$tw.rootWidget.addEventListener("tm-notify",function(event) {
		$tw.notifier.display(event.param);
	});
	// Install the scroller
	$tw.pageScroller = new $tw.utils.PageScroller();
	$tw.rootWidget.addEventListener("tm-scroll",function(event) {
		$tw.pageScroller.handleEvent(event);
	});
	var fullscreen = $tw.utils.getFullScreenApis();
	if(fullscreen) {
		$tw.rootWidget.addEventListener("tm-full-screen",function(event) {
			if(document[fullscreen._fullscreenElement]) {
				document[fullscreen._exitFullscreen]();
			} else {
				document.documentElement[fullscreen._requestFullscreen](Element.ALLOW_KEYBOARD_INPUT);
			}
		});
	}
	// If we're being viewed on a data: URI then give instructions for how to save
	if(document.location.protocol === "data:") {
		$tw.rootWidget.dispatchEvent({
			type: "tm-modal",
			param: "$:/language/Modals/SaveInstructions"
		});
	}
};

})();
