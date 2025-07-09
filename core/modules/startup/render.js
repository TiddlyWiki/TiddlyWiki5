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
const PAGE_TITLE_TITLE = "$:/core/wiki/title";
const PAGE_STYLESHEET_TITLE = "$:/core/ui/PageStylesheet";
const PAGE_TEMPLATE_TITLE = "$:/core/ui/RootTemplate";

// Time (in ms) that we defer refreshing changes to draft tiddlers
const DRAFT_TIDDLER_TIMEOUT_TITLE = "$:/config/Drafts/TypingTimeout";
const THROTTLE_REFRESH_TIMEOUT = 400;

exports.startup = function() {
	// Set up the title
	$tw.titleWidgetNode = $tw.wiki.makeTranscludeWidget(PAGE_TITLE_TITLE,{
		document: $tw.fakeDocument,
		parseAsInline: true,
		importPageMacros: true,
	});
	$tw.titleContainer = $tw.fakeDocument.createElement("div");
	$tw.titleWidgetNode.render($tw.titleContainer,null);
	document.title = $tw.titleContainer.textContent;
	$tw.wiki.addEventListener("change",(changes) => {
		if($tw.titleWidgetNode.refresh(changes,$tw.titleContainer,null)) {
			document.title = $tw.titleContainer.textContent;
		}
	});
	// Set up the styles
	$tw.styleWidgetNode = $tw.wiki.makeTranscludeWidget(PAGE_STYLESHEET_TITLE,{document: $tw.fakeDocument});
	$tw.styleContainer = $tw.fakeDocument.createElement("style");
	$tw.styleWidgetNode.render($tw.styleContainer,null);
	$tw.styleWidgetNode.assignedStyles = $tw.styleContainer.textContent;
	$tw.styleElement = document.createElement("style");
	$tw.styleElement.innerHTML = $tw.styleWidgetNode.assignedStyles;
	document.head.insertBefore($tw.styleElement,document.head.firstChild);
	$tw.wiki.addEventListener("change",$tw.perf.report("styleRefresh",(changes) => {
		if($tw.styleWidgetNode.refresh(changes,$tw.styleContainer,null)) {
			const newStyles = $tw.styleContainer.textContent;
			if(newStyles !== $tw.styleWidgetNode.assignedStyles) {
				$tw.styleWidgetNode.assignedStyles = newStyles;
				$tw.styleElement.innerHTML = $tw.styleWidgetNode.assignedStyles;
			}
		}
	}));
	// Display the $:/core/ui/PageTemplate tiddler to kick off the display
	$tw.perf.report("mainRender",() => {
		$tw.pageWidgetNode = $tw.wiki.makeTranscludeWidget(PAGE_TEMPLATE_TITLE,{document,parentWidget: $tw.rootWidget,recursionMarker: "no"});
		$tw.pageContainer = document.createElement("div");
		$tw.utils.addClass($tw.pageContainer,"tc-page-container-wrapper");
		document.body.insertBefore($tw.pageContainer,document.body.firstChild);
		$tw.pageWidgetNode.render($tw.pageContainer,null);
		$tw.hooks.invokeHook("th-page-refreshed");
	})();
	// Remove any splash screen elements
	const removeList = document.querySelectorAll(".tc-remove-when-wiki-loaded");
	$tw.utils.each(removeList,(removeItem) => {
		if(removeItem.parentNode) {
			removeItem.parentNode.removeChild(removeItem);
		}
	});
	// Prepare refresh mechanism
	let deferredChanges = Object.create(null);
	let timerId;
	function refresh() {
		// Process the refresh
		$tw.hooks.invokeHook("th-page-refreshing");
		$tw.pageWidgetNode.refresh(deferredChanges);
		deferredChanges = Object.create(null);
		$tw.hooks.invokeHook("th-page-refreshed");
	}
	const throttledRefresh = $tw.perf.report("throttledRefresh",refresh);

	// Add the change event handler
	$tw.wiki.addEventListener("change",$tw.perf.report("mainRefresh",(changes) => {
		// Check if only tiddlers that are throttled have changed
		let onlyThrottledTiddlersHaveChanged = true;
		for(const title in changes) {
			const tiddler = $tw.wiki.getTiddler(title);
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
			let timeout = parseInt($tw.wiki.getTiddlerText(DRAFT_TIDDLER_TIMEOUT_TITLE,""),10);
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
