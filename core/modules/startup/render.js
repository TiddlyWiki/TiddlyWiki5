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
var PAGE_TEMPLATE_TITLE = "$:/core/ui/RootTemplate";

exports.startup = function() {
	// Set up the title
	$tw.titleWidgetNode = $tw.wiki.makeTranscludeWidget(PAGE_TITLE_TITLE, {
		document: $tw.fakeDocument,
		parseAsInline: true,
		importPageMacros: true,
	});
	$tw.titleContainer = $tw.fakeDocument.createElement("div");
	$tw.titleWidgetNode.render($tw.titleContainer,null);
	document.title = $tw.titleContainer.textContent;
	$tw.wiki.addEventListener("change",function(changes) {
		if($tw.titleWidgetNode.refresh(changes,$tw.titleContainer,null)) {
			document.title = $tw.titleContainer.textContent;
		}
	});
	// Set up the styles
	var styleSetup = $tw.utils.setupStyleElements($tw.wiki, document, PAGE_STYLESHEET_TITLE, null, false);
	$tw.styleWidgetNode = styleSetup.styleWidgetNode;
	$tw.styleContainer = styleSetup.styleContainer;
	$tw.styleElement = styleSetup.styleElement;
	document.head.insertBefore($tw.styleElement,document.head.firstChild);
	// Prepare refresh mechanism
	var mainDeferredChanges = Object.create(null),
		styleDeferredChanges = Object.create(null),
		mainTimerId = {id: null},
		styleTimerId = {id: null},
		throttledRefreshFn = $tw.utils.createThrottledRefreshManager($tw.wiki);
	function refresh() {
		// Process the refresh
		$tw.hooks.invokeHook("th-page-refreshing");
		$tw.pageWidgetNode.refresh(mainDeferredChanges);
		mainDeferredChanges = Object.create(null);
		$tw.hooks.invokeHook("th-page-refreshed");
	}
	var styleRefresh = $tw.utils.createStyleRefreshHandler($tw.styleWidgetNode, $tw.styleContainer, $tw.styleElement, styleDeferredChanges);
	var mainThrottledRefresh = $tw.perf.report("throttledMainRefresh",refresh),
		styleThrottledRefresh = $tw.perf.report("throttledStyleRefresh",styleRefresh);
	$tw.wiki.addEventListener("change",$tw.perf.report("styleRefresh",function(changes) {
		throttledRefreshFn(changes,{
			throttledRefresh: styleThrottledRefresh,
			callback: styleRefresh,
			mainCondition: false,
			styleCondition: true,
			deferredChanges: styleDeferredChanges,
			timerId: styleTimerId
		});
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
	// Add the change event handler
	$tw.wiki.addEventListener("change",$tw.perf.report("mainRefresh",function(changes) {
		throttledRefreshFn(changes,{
			throttledRefresh: mainThrottledRefresh,
			callback: refresh,
			mainCondition: true,
			styleCondition: false,
			deferredChanges: mainDeferredChanges,
			timerId: mainTimerId
		});
	}));
	// Fix up the link between the root widget and the page container
	$tw.rootWidget.domNodes = [$tw.pageContainer];
	$tw.rootWidget.children = [$tw.pageWidgetNode];
	// Run any post-render startup actions
	$tw.rootWidget.invokeActionsByTag("$:/tags/StartupAction/PostRender");
};
