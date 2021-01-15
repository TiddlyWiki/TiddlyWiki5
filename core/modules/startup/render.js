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
var PAGE_TITLE_TITLE = "$:/core/wiki/title";
var PAGE_STYLESHEET_TITLE = "$:/core/ui/PageStylesheet";
var PAGE_TEMPLATE_TITLE = "$:/core/ui/RootTemplate";

// Time (in ms) that we defer refreshing changes to draft tiddlers
var DRAFT_TIDDLER_TIMEOUT_TITLE = "$:/config/Drafts/TypingTimeout";
var THROTTLE_REFRESH_TIMEOUT = 400;

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
	var focusedDomNodeIndex;
	// Find the child widget containing the event target
	var findWidgetOwningDomNode = function(widget,domNode) {
		for(var domNodeIndex=0; domNodeIndex<widget.domNodes.length; domNodeIndex++) {
			if(widget.domNodes[domNodeIndex] === domNode) {
				focusedDomNodeIndex = domNodeIndex;
				return widget;
			}
		}
		for(var childIndex=0; childIndex<widget.children.length; childIndex++) {
			var result = findWidgetOwningDomNode(widget.children[childIndex],domNode);
			if(result) {
				return result;
			}
		}
		return null;
	};
	// Generate the render-tree-footprint for a widget
	var generateRenderTreeFootprint = function(widget) {
		var node = widget,
			footprint = [];
		while(node) {
			if(node.parentWidget && node.parentWidget.children) {
				footprint.push(node.parentWidget.children.indexOf(node));
			}
			node = node.parentWidget;
		}
		return footprint.reverse();
	};
	// Find a widget by its render-tree-footprint
	var findWidgetByFootprint = function(footprint) {
		var index,
			count = 0,
			widget = $tw.rootWidget;
		while(count < footprint.length) {
			index = footprint[count];
			if(widget && widget.children && widget.children[index]) {
				widget = widget.children[index];
			}
			count++;
		}
		return widget;
	};
	// Prepare refresh mechanism
	var deferredChanges = Object.create(null),
		timerId;
	function refresh() {
		// Process the refresh
		$tw.hooks.invokeHook("th-page-refreshing");
		var focusWidget = findWidgetOwningDomNode($tw.rootWidget,document.activeElement);
		var renderTreeFootprint;
		if(focusWidget) {
			renderTreeFootprint = generateRenderTreeFootprint(focusWidget);
		}
		$tw.pageWidgetNode.refresh(deferredChanges);
		deferredChanges = Object.create(null);
		$tw.hooks.invokeHook("th-page-refreshed");
		if(renderTreeFootprint) {
			focusWidget = findWidgetByFootprint(renderTreeFootprint);
		}
		if(focusWidget && focusWidget.domNodes[focusedDomNodeIndex] && focusWidget.domNodes[focusedDomNodeIndex].focus) {
			focusWidget.domNodes[focusedDomNodeIndex].focus();
		}
	}
	// Add the change event handler
	$tw.wiki.addEventListener("change",$tw.perf.report("mainRefresh",function(changes) {
		// Check if only tiddlers that are throttled have changed
		var onlyThrottledTiddlersHaveChanged = true;
		for(var title in changes) {
			var tiddler = $tw.wiki.getTiddler(title);
			if(!tiddler || !(tiddler.hasField("draft.of") || tiddler.hasField("throttle.refresh"))) {
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
			timerId = setTimeout(refresh,timeout);
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

})();
