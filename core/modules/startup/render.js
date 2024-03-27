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
var PAGE_STYLESHEET_TITLE = "$:/core/ui/RootStylesheet";
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

	function setStylesheets() {
		// Set up the styles for each stylesheet Tiddler
		for(var i=0; i<$tw.stylesheetTiddlers.length; i++) {
			var styleWidgetNode = $tw.wiki.makeTranscludeWidget(PAGE_STYLESHEET_TITLE,{document: $tw.fakeDocument, variables: {
				stylesheet: $tw.wiki.getTiddlerText($tw.stylesheetTiddlers[i])
			}});
			$tw.styleWidgetNodes.push(styleWidgetNode);
			var styleContainer = $tw.fakeDocument.createElement("style");
			$tw.styleContainers.push(styleContainer);
			styleWidgetNode.render(styleContainer,null);
			styleWidgetNode.assignedStyles = styleContainer.textContent;
			var styleElement = document.createElement("style");
			$tw.styleElements.push(styleElement);
			styleElement.innerHTML = styleWidgetNode.assignedStyles;
			document.head.insertBefore(styleElement,document.head.firstChild);
		}
	}

	function getStylesheets() {
		// Get our stylesheets in reversed order
		return $tw.wiki.filterTiddlers("[all[shadows+tiddlers]tag[$:/tags/Stylesheet]!has[draft.of]]").reverse();
	}

	function detectStylesheetRefresh(changes) {
		for(var i=0; i<$tw.stylesheetTiddlers.length; i++) {
			if($tw.styleWidgetNodes[i].refresh(changes,$tw.styleContainers[i],null)) {
				var newStyles = $tw.styleContainers[i].textContent;
				if(newStyles !== $tw.styleWidgetNodes[i].assignedStyles) {
					$tw.styleWidgetNodes[i].assignedStyles = newStyles;
					$tw.styleElements[i].innerHTML = $tw.styleWidgetNodes[i].assignedStyles;
				}
			}
		}
	}

	// Get our stylesheets
	$tw.stylesheetTiddlers = getStylesheets();
	$tw.styleWidgetNodes = [];
	$tw.styleContainers = [];
	$tw.styleElements = [];
	setStylesheets();

	function arraysEqual(a,b) {
		if(a === b) {
			return true;
		}
		if(a === null || b === null) {
			return false;
		}
		if(a.length !== b.length) {
			return false;
		}
		for(var i=0; i<a.length; i++) {
			if(a[i] !== b[i]) {
				return false;
			}
		}
		return true;
	}

	$tw.wiki.addEventListener("change",function(changes) {
		var stylesheetTiddlers = getStylesheets();
		if(!arraysEqual(stylesheetTiddlers,$tw.stylesheetTiddlers) || $tw.utils.hopArray(changes,stylesheetTiddlers)) {
			for(var i=0; i<$tw.stylesheetTiddlers.length; i++) {
				document.head.removeChild($tw.styleElements[i]);
			}
			$tw.stylesheetTiddlers = stylesheetTiddlers;
			$tw.styleWidgetNodes = [];
			$tw.styleContainers = [];
			$tw.styleElements = [];
			setStylesheets();
		}
		$tw.perf.report("styleRefresh",function() {
			detectStylesheetRefresh(changes);
		})();
	});
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
