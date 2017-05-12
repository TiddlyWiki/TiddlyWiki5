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
		$tw.modal.display(event.param,{variables: event.paramObject});
	});
	// Install the notification  mechanism
	$tw.notifier = new $tw.utils.Notifier($tw.wiki);
	$tw.rootWidget.addEventListener("tm-notify",function(event) {
		$tw.notifier.display(event.param,{variables: event.paramObject});
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
	// Listen to tag renaming events
	$tw.rootWidget.addEventListener("tm-rename-tag",function(event) {
		var params = event.paramObject;
		if(!params || !params["old"] || !params["new"]) {
			return;
		}
		var filter = "[tag[" + params["old"] + "]!has[draft.of]]";
		var tiddlers = this.wiki.filterTiddlers(filter);
		// First change the tag in all tiddlers that have this tag
		for(var i = 0; i < tiddlers.length; i++) {
			var curTid = this.wiki.getTiddler(tiddlers[i]);
			// Clone tags property to be able to modify it
			var tags = curTid.fields.tags.slice(0);
			tags[tags.indexOf(params["old"])] = params["new"];
			$tw.wiki.addTiddler(new $tw.Tiddler(curTid, { tags: tags }));
		}
		// Now change the tag-tiddler itself (if it exists)
		var tagTid = this.wiki.getTiddler(params["old"]);
		if(tagTid) {
			$tw.wiki.addTiddler(new $tw.Tiddler(tagTid, { title: params["new"] }));
		}
	});
	// If we're being viewed on a data: URI then give instructions for how to save
	if(document.location.protocol === "data:") {
		$tw.rootWidget.dispatchEvent({
			type: "tm-modal",
			param: "$:/language/Modals/SaveInstructions"
		});
	}
};

})();
