/*\
title: $:/core/modules/startup/render.js
type: application/javascript
module-type: startup

Title, stylesheet and page rendering

\*/

"use strict";

// Export name and synchronous status
exports.name = "render";
exports.platforms = ["browser"];
exports.after = ["story"];
exports.synchronous = true;

// Default story and history lists
var PAGE_TITLE_TITLE = "$:/core/wiki/title";
var PAGE_STYLESHEET_TITLE = "$:/core/ui/PageStylesheet";
var ROOT_STYLESHEET_TITLE = "$:/core/ui/RootStylesheet";
var PAGE_TEMPLATE_TITLE = "$:/core/ui/RootTemplate";

// Time (in ms) that we defer refreshing changes to draft tiddlers
var DRAFT_TIDDLER_TIMEOUT_TITLE = "$:/config/Drafts/TypingTimeout";
var THROTTLE_REFRESH_TIMEOUT = 400;

exports.startup = function() {
	// Set up the title
	$tw.titleWidgetNode = $tw.wiki.makeTranscludeWidget(PAGE_TITLE_TITLE, {
		document: $tw.fakeDocument,
		parseAsInline: true,
		importPageMacros: true,
	});
	$tw.titleContainer = $tw.fakeDocument.createElement("div");
	$tw.titleWidgetNode.render($tw.titleContainer,null);
	var publishTitle = function() {
		$tw.titlePublisher.send({verb: "PAGETITLE",body: document.title});
		document.title = $tw.titleContainer.textContent;
	};
	$tw.titlePublisher = new $tw.utils.BrowserMessagingPublisher({type: "PAGETITLE", onsubscribe: publishTitle});
	publishTitle();
	$tw.wiki.addEventListener("change",function(changes) {
		if($tw.titleWidgetNode.refresh(changes,$tw.titleContainer,null)) {
			publishTitle();
		}
	});

	var styleParser = $tw.wiki.parseTiddler(ROOT_STYLESHEET_TITLE,{parseAsInline: true}),
		styleWidgetNode = $tw.wiki.makeWidget(styleParser,{document: document});
	styleWidgetNode.render(document.head,null);

	$tw.wiki.addEventListener("change",$tw.perf.report("styleRefresh",function(changes) {
		styleWidgetNode.refresh(changes,document.head,null);
	}));
	// Display the $:/core/ui/PageTemplate tiddler to kick off the display
	$tw.perf.report("mainRender",function() {
		$tw.pageWidgetNode = $tw.wiki.makeTranscludeWidget(PAGE_TEMPLATE_TITLE,{document: document, parentWidget: $tw.rootWidget, recursionMarker: "no"});
		$tw.pageContainer = document.createElement("div");
		$tw.utils.addClass($tw.pageContainer,"tc-page-container-wrapper");
		document.body.insertBefore($tw.pageContainer,document.body.firstChild);
		$tw.pageWidgetNode.render($tw.pageContainer,null);
		$tw.hooks.invokeHook("th-page-refreshed");
	})();
	// Remove any splash screen elements
	var removeList = document.querySelectorAll(".tc-remove-when-wiki-loaded");
	$tw.utils.each(removeList,function(removeItem) {
		if(removeItem.parentNode) {
			removeItem.parentNode.removeChild(removeItem);
		}
	});
	// Prepare refresh mechanism
	var deferredChanges = Object.create(null),
		timerId;
	function refresh() {
		// Process the refresh
		$tw.hooks.invokeHook("th-page-refreshing");
		$tw.pageWidgetNode.refresh(deferredChanges);
		deferredChanges = Object.create(null);
		$tw.hooks.invokeHook("th-page-refreshed");
	}
	var throttledRefresh = $tw.perf.report("throttledRefresh",refresh);

	// Add the change event handler
	$tw.wiki.addEventListener("change",$tw.perf.report("mainRefresh",function(changes) {
		// Check if only tiddlers that are throttled have changed
		var onlyThrottledTiddlersHaveChanged = true;
		for(var title in changes) {
			var tiddler = $tw.wiki.getTiddler(title);
			if(!$tw.wiki.isVolatileTiddler(title) && (!tiddler || !(tiddler.hasField("draft.of") || tiddler.hasField("throttle.refresh")))) {
				onlyThrottledTiddlersHaveChanged = false;
			}
		}
		// Defer the change if only drafts have changed
		if(timerId) {
			clearTimeout(timerId);
		}
		timerId = null;
		if(onlyThrottledTiddlersHaveChanged) {
			var timeout = parseInt($tw.wiki.getTiddlerText(DRAFT_TIDDLER_TIMEOUT_TITLE,""),10);
			if(isNaN(timeout)) {
				timeout = THROTTLE_REFRESH_TIMEOUT;
			}
			timerId = setTimeout(throttledRefresh,timeout);
			$tw.utils.extend(deferredChanges,changes);
		} else {
			$tw.utils.extend(deferredChanges,changes);
			refresh();
		}
	}));
	// Fix up the link between the root widget and the page container
	$tw.rootWidget.domNodes = [$tw.pageContainer];
	$tw.rootWidget.children = [$tw.pageWidgetNode];
	// Run any post-render startup actions
	$tw.rootWidget.invokeActionsByTag("$:/tags/StartupAction/PostRender");
};
