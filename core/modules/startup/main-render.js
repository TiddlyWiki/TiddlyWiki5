/*\
title: $:/core/modules/startup/main-render.js
type: application/javascript
module-type: startup

Load core modules

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Export name and synchronous status
exports.name = "main-render";
exports.platforms = ["browser"];
exports.after = ["startup"];
exports.synchronous = true;

exports.startup = function() {
	// Set up the styles
	var styleTemplateTitle = "$:/core/ui/PageStylesheet",
		styleParser = $tw.wiki.parseTiddler(styleTemplateTitle);
	$tw.styleWidgetNode = $tw.wiki.makeWidget(styleParser,{document: $tw.fakeDocument});
	$tw.styleContainer = $tw.fakeDocument.createElement("style");
	$tw.styleWidgetNode.render($tw.styleContainer,null);
	$tw.styleElement = document.createElement("style");
	$tw.styleElement.innerHTML = $tw.styleContainer.textContent;
	document.head.insertBefore($tw.styleElement,document.head.firstChild);
	$tw.wiki.addEventListener("change",$tw.perf.report("styleRefresh",function(changes) {
		if($tw.styleWidgetNode.refresh(changes,$tw.styleContainer,null)) {
			$tw.styleElement.innerHTML = $tw.styleContainer.textContent;
		}
	}));
	// Display the $:/core/ui/PageMacros tiddler to kick off the display
	var templateTitle = "$:/core/ui/PageMacros",
		parser = $tw.wiki.parseTiddler(templateTitle);
	$tw.perf.report("mainRender",function() {
		$tw.pageWidgetNode = $tw.wiki.makeWidget(parser,{document: document, parentWidget: $tw.rootWidget});
		$tw.pageContainer = document.createElement("div");
		$tw.utils.addClass($tw.pageContainer,"tw-page-container-wrapper");
		document.body.insertBefore($tw.pageContainer,document.body.firstChild);
		$tw.pageWidgetNode.render($tw.pageContainer,null);
	})();
	// Prepare refresh mechanism
	var deferredChanges = Object.create(null),
		timerId;
	function refresh() {
		// Process the refresh
		$tw.pageWidgetNode.refresh(deferredChanges,$tw.pageContainer,null);
		deferredChanges = Object.create(null);
	}
	// Add the change event handler
	$tw.wiki.addEventListener("change",$tw.perf.report("mainRefresh",function(changes) {
		// Check if only drafts have changed
		var onlyDraftsHaveChanged = true;
		for(var title in changes) {
			var tiddler = $tw.wiki.getTiddler(title);
			if(!tiddler || !tiddler.hasField("draft.of")) {
				onlyDraftsHaveChanged = false;
			}
		}
		// Defer the change if only drafts have changed
		if(timerId) {
			clearTimeout(timerId);
		}
		timerId = null;
		if(onlyDraftsHaveChanged) {
			timerId = setTimeout(refresh,DRAFT_TIDDLER_TIMEOUT);
			$tw.utils.extend(deferredChanges,changes);
		} else {
			$tw.utils.extend(deferredChanges,changes);
			refresh();
		}
	}));
	// Fix up the link between the root widget and the page container
	$tw.rootWidget.domNodes = [$tw.pageContainer];
	$tw.rootWidget.children = [$tw.pageWidgetNode];
};

})();
