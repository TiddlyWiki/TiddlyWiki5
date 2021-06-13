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
		$tw.modal.display(event.param,{variables: event.paramObject, event: event});
	});
	$tw.rootWidget.addEventListener("tm-show-switcher",function(event) {
		$tw.modal.display("$:/core/ui/SwitcherModal",{variables: event.paramObject, event: event});
	});
	// Install the notification  mechanism
	$tw.notifier = new $tw.utils.Notifier($tw.wiki);
	$tw.rootWidget.addEventListener("tm-notify",function(event) {
		$tw.notifier.display(event.param,{variables: event.paramObject});
	});
	// Install the copy-to-clipboard  mechanism
	$tw.rootWidget.addEventListener("tm-copy-to-clipboard",function(event) {
		$tw.utils.copyToClipboard(event.param);
	});
	// Install the tm-focus-selector message
	$tw.rootWidget.addEventListener("tm-focus-selector",function(event) {
		var selector = event.param || "",
			element,
		    	doc = event.event ? event.event.target.ownerDocument : document;
		try {
			element = doc.querySelector(selector);
		} catch(e) {
			console.log("Error in selector: ",selector)
		}
		if(element && element.focus) {
			element.focus(event.paramObject);
		}
	});
	// Install the scroller
	$tw.pageScroller = new $tw.utils.PageScroller();
	$tw.rootWidget.addEventListener("tm-scroll",function(event) {
		$tw.pageScroller.handleEvent(event);
	});
	var fullscreen = $tw.utils.getFullScreenApis();
	if(fullscreen) {
		$tw.rootWidget.addEventListener("tm-full-screen",function(event) {
			var fullScreenDocument = event.event ? event.event.target.ownerDocument : document;
			if(event.param === "enter") {
				fullScreenDocument.documentElement[fullscreen._requestFullscreen](Element.ALLOW_KEYBOARD_INPUT);
			} else if(event.param === "exit") {
				fullScreenDocument[fullscreen._exitFullscreen]();
			} else {
				if(fullScreenDocument[fullscreen._fullscreenElement]) {
					fullScreenDocument[fullscreen._exitFullscreen]();
				} else {
					fullScreenDocument.documentElement[fullscreen._requestFullscreen](Element.ALLOW_KEYBOARD_INPUT);
				}
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
