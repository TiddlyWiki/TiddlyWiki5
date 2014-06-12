/*\
title: $:/core/modules/startup/render.js
type: application/javascript
module-type: startup

Title, stylesheet and page rendering

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Export name and synchronous status
exports.name = "render";
exports.platforms = ["browser"];
exports.after = ["story"];
exports.synchronous = true;

// Default story and history lists
var PAGE_TITLE_TITLE = "$:/core/wiki/title"
var PAGE_STYLESHEET_TITLE = "$:/core/ui/PageStylesheet";
var PAGE_TEMPLATE_TITLE = "$:/core/ui/PageTemplate";

// Time (in ms) that we defer refreshing changes to draft tiddlers
var DRAFT_TIDDLER_TIMEOUT = 400;

exports.startup = function() {
	// Set up the title
	$tw.titleWidgetNode = $tw.wiki.makeTranscludeWidget(PAGE_TITLE_TITLE,{document: $tw.fakeDocument, parseAsInline: true});
	$tw.titleContainer = $tw.fakeDocument.createElement("div");
	$tw.titleWidgetNode.render($tw.titleContainer,null);
	document.title = $tw.titleContainer.textContent;
	$tw.wiki.addEventListener("change",function(changes) {
		if($tw.titleWidgetNode.refresh(changes,$tw.titleContainer,null)) {
			document.title = $tw.titleContainer.textContent;
		}
	});
	// Set up the styles
	$tw.styleWidgetNode = $tw.wiki.makeTranscludeWidget(PAGE_STYLESHEET_TITLE,{document: $tw.fakeDocument});
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
	// Display the $:/core/ui/PageTemplate tiddler to kick off the display
	$tw.perf.report("mainRender",function() {
		$tw.pageWidgetNode = $tw.wiki.makeTranscludeWidget(PAGE_TEMPLATE_TITLE,{document: document, parentWidget: $tw.rootWidget});
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
