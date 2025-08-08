/*\
title: $:/core/modules/utils/refresh-utils.js
type: application/javascript
module-type: utils

Shared utilities for managing refresh operations with throttling support

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Constants for refresh timing
var DRAFT_TIDDLER_TIMEOUT_TITLE = "$:/config/Drafts/TypingTimeout";
var THROTTLE_REFRESH_TIMEOUT = 400;

/*
Create a throttled refresh function that manages deferred changes
Parameters:
  wiki: Reference to the wiki
  mainDeferredChanges: Object to store main deferred changes
  styleDeferredChanges: Object to store style deferred changes
  timers: Object containing mainTimerId and styleTimerId references
Returns an object with the throttledRefreshFn
*/
exports.createThrottledRefreshManager = function(wiki) {
	return function(changes, options) {
		options = options || {};
		// Check if only tiddlers that are throttled have changed
		var onlyThrottledTiddlersHaveChanged = true;
		var deferredChanges = options.deferredChanges;
		var timerId = options.timerId;
		
		for(var title in changes) {
			var tiddler = wiki.getTiddler(title);
			if(!wiki.isVolatileTiddler(title) && (!tiddler || !(tiddler.hasField("draft.of") || tiddler.hasField("throttle.refresh") ||
				(options.mainCondition && tiddler.hasField("throttle.refresh.main")) || (options.styleCondition && tiddler.hasField("throttle.refresh.style"))))) {
				onlyThrottledTiddlersHaveChanged = false;
			}
		}
		
		// Clear existing timer
		if(timerId.id) {
			clearTimeout(timerId.id);
			timerId.id = null;
		}
		
		if(onlyThrottledTiddlersHaveChanged) {
			var timeout = parseInt(wiki.getTiddlerText(DRAFT_TIDDLER_TIMEOUT_TITLE,""),10);
			if(isNaN(timeout)) {
				timeout = THROTTLE_REFRESH_TIMEOUT;
			}
			timerId.id = setTimeout(options.throttledRefresh, timeout);
			$tw.utils.extend(deferredChanges, changes);
		} else {
			$tw.utils.extend(deferredChanges, changes);
			options.callback();
		}
	};
};

/*
Create a style refresh handler
Parameters:
  styleWidgetNode: The widget node for styles
  styleContainer: The container element for styles
  styleElement: The style element in the document
  deferredChanges: Object storing deferred changes
Returns a refresh function
*/
exports.createStyleRefreshHandler = function(styleWidgetNode, styleContainer, styleElement, deferredChanges) {
	return function() {
		if(styleWidgetNode.refresh(deferredChanges, styleContainer, null)) {
			var newStyles = styleContainer.textContent;
			if(newStyles !== styleWidgetNode.assignedStyles) {
				styleWidgetNode.assignedStyles = newStyles;
				styleElement.innerHTML = styleWidgetNode.assignedStyles;
			}
		}
		// Clear deferred changes
		for(var key in deferredChanges) {
			delete deferredChanges[key];
		}
	};
};

/*
Setup style widget and element
Parameters:
  wiki: Reference to the wiki
  document: The document object
  title: The title of the style tiddler (default: "$:/core/ui/PageStylesheet")
  variables: Optional variables for the widget
  importPageMacros: Whether to import page macros
Returns an object with styleWidgetNode, styleContainer, and styleElement
*/
exports.setupStyleElements = function(wiki, targetDocument, title, variables, importPageMacros) {
	title = title || "$:/core/ui/PageStylesheet";
	
	var styleWidgetNode = wiki.makeTranscludeWidget(title, {
		document: $tw.fakeDocument,
		variables: variables,
		importPageMacros: importPageMacros
	});
	
	var styleContainer = $tw.fakeDocument.createElement("style");
	styleWidgetNode.render(styleContainer, null);
	styleWidgetNode.assignedStyles = styleContainer.textContent;
	
	var styleElement = targetDocument.createElement("style");
	styleElement.innerHTML = styleWidgetNode.assignedStyles;
	
	return {
		styleWidgetNode: styleWidgetNode,
		styleContainer: styleContainer,
		styleElement: styleElement
	};
};

})();