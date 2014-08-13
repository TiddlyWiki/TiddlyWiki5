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
	$tw.rootWidget.addEventListener("tw-modal",function(event) {
		$tw.modal.display(event.param);
	});
	// Install the notification  mechanism
	$tw.notifier = new $tw.utils.Notifier($tw.wiki);
	$tw.rootWidget.addEventListener("tw-notify",function(event) {
		$tw.notifier.display(event.param);
	});
	// Install the scroller
	$tw.pageScroller = new $tw.utils.PageScroller();
	$tw.rootWidget.addEventListener("tw-scroll",function(event) {
		$tw.pageScroller.handleEvent(event);
	});
	// Install the save action handlers
	$tw.rootWidget.addEventListener("tw-save-wiki",function(event) {
		$tw.syncer.saveWiki({
			template: event.param,
			downloadType: "text/plain"
		});
	});
	$tw.rootWidget.addEventListener("tw-auto-save-wiki",function(event) {
		$tw.syncer.saveWiki({
			method: "autosave",
			template: event.param,
			downloadType: "text/plain"
		});
	});
	$tw.rootWidget.addEventListener("tw-download-file",function(event) {
		$tw.syncer.saveWiki({
			method: "download",
			template: event.param,
			downloadType: "text/plain"
		});
	});
	var fullscreen = $tw.utils.getFullScreenApis();
	if(fullscreen) {
		$tw.rootWidget.addEventListener("tw-full-screen",function(event) {
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
			type: "tw-modal",
			param: "$:/language/Modals/SaveInstructions"
		});
	}
};

})();
