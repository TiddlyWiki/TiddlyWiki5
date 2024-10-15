/*\
title: $:/core/modules/startup/windows.js
type: application/javascript
module-type: startup

Setup root widget handlers for the messages concerned with opening external browser windows

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Export name and synchronous status
exports.name = "windows";
exports.platforms = ["browser"];
exports.after = ["startup"];
exports.synchronous = true;

// Global to keep track of open windows (hashmap by title)
$tw.windows = {};
// Default template to use for new windows
var DEFAULT_WINDOW_TEMPLATE = "$:/core/templates/single.tiddler.window";

exports.startup = function() {
	// Handle open window message
	$tw.rootWidget.addEventListener("tm-open-window",function(event) {
		// Get the parameters
		var mainRefreshHandler,
			styleRefreshHandler,
			title = event.param || event.tiddlerTitle,
			paramObject = event.paramObject || {},
			windowTitle = paramObject.windowTitle || title,
			windowID = paramObject.windowID || title,
			template = paramObject.template || DEFAULT_WINDOW_TEMPLATE,
			width = paramObject.width || "700",
			height = paramObject.height || "600",
			top = paramObject.top,
			left = paramObject.left,
			variables = $tw.utils.extend({},paramObject,{currentTiddler: title, "tv-window-id": windowID});
		// Open the window
		var srcWindow,
			srcDocument;
		// In case that popup blockers deny opening a new window
		try {
			srcWindow = window.open("","external-" + windowID,"scrollbars,width=" + width + ",height=" + height + (top ? ",top=" + top : "" ) + (left ? ",left=" + left : "" )),
			srcDocument = srcWindow.document;
		}
		catch(e) {
			return;
		}
		$tw.windows[windowID] = srcWindow;
		// Check for reopening the same window
		if(srcWindow.haveInitialisedWindow) {
			srcWindow.focus();
			return;
		}
		// Initialise the document
		srcDocument.write("<!DOCTYPE html><head></head><body class='tc-body tc-single-tiddler-window'></body></html>");
		srcDocument.close();
		srcDocument.title = windowTitle;
		srcWindow.addEventListener("beforeunload",function(event) {
			delete $tw.windows[windowID];
			$tw.wiki.removeEventListener("change",styleRefreshHandler);
			$tw.wiki.removeEventListener("change",mainRefreshHandler);
		},false);
		// Set up the styles
		var styleWidgetNode = $tw.wiki.makeTranscludeWidget("$:/core/ui/PageStylesheet",{
				document: $tw.fakeDocument,
				variables: variables,
				importPageMacros: true}),
			styleContainer = $tw.fakeDocument.createElement("style");
		styleWidgetNode.render(styleContainer,null);
		var styleElement = srcDocument.createElement("style");
		styleElement.innerHTML = styleContainer.textContent;
		styleWidgetNode.assignedStyles = styleContainer.textContent;
		srcDocument.head.insertBefore(styleElement,srcDocument.head.firstChild);
		// Render the text of the tiddler
		var parser = $tw.wiki.parseTiddler(template),
			widgetNode = $tw.wiki.makeWidget(parser,{document: srcDocument, parentWidget: $tw.rootWidget, variables: variables});
		widgetNode.render(srcDocument.body,srcDocument.body.firstChild);
		// Prepare refresh mechanism
		var mainDeferredChanges = Object.create(null),
			styleDeferredChanges = Object.create(null),
			mainTimerId,
			styleTimerId,
			throttledRefreshFn = function(changes,options) {
				options = options || {};
				// Check if only tiddlers that are throttled have changed
				var onlyThrottledTiddlersHaveChanged = true;
				for(var title in changes) {
					var tiddler = $tw.wiki.getTiddler(title);
					if(!$tw.wiki.isVolatileTiddler(title) && (!tiddler || !(tiddler.hasField("draft.of") || tiddler.hasField("throttle.refresh") ||
						(options.mainCondition && tiddler.hasField("throttle.refresh.main")) || (options.styleCondition && tiddler.hasField("throttle.refresh.style"))))) {
						onlyThrottledTiddlersHaveChanged = false;
					}
				}
				// Defer the change if only drafts have changed
				if(options.timerId) {
					clearTimeout(options.timerId);
				}
				options.timerId = null;
				if(onlyThrottledTiddlersHaveChanged) {
					var timeout = parseInt($tw.wiki.getTiddlerText(DRAFT_TIDDLER_TIMEOUT_TITLE,""),10);
					if(isNaN(timeout)) {
						timeout = THROTTLE_REFRESH_TIMEOUT;
					}
					options.timerId = setTimeout(options.throttledRefresh,timeout);
					$tw.utils.extend(options.deferredChanges,changes);
				} else {
					$tw.utils.extend(options.deferredChanges,changes);
					options.callback();
				}
			};
		var styleRefresh = function() {
			if(styleWidgetNode.refresh(styleDeferredChanges,styleContainer,null)) {
				var newStyles = styleContainer.textContent;
				if(newStyles !== styleWidgetNode.assignedStyles) {
					styleWidgetNode.assignedStyles = newStyles;
					styleElement.innerHTML = styleWidgetNode.assignedStyles;
				}
			}
			styleDeferredChanges = Object.create(null);
		};
		var mainRefresh = function() {
			widgetNode.refresh(mainDeferredChanges);
			mainDeferredChanges = Object.create(null);
		};
		var mainThrottledRefresh = $tw.perf.report("throttledMainRefresh",mainRefresh),
			styleThrottledRefresh = $tw.perf.report("throttledStyleRefresh",styleRefresh);
		styleRefreshHandler = function(changes) {
			throttledRefreshFn(changes,{
				deferredChanged: styleDeferredChanges,
				timerId: styleTimerId,
				throttledRefresh: styleThrottledRefresh,
				callback: styleRefresh,
				mainCondition: false,
				styleCondition: true
			});
		};
		mainRefreshHandler = function(changes) {
			throttledRefreshFn(changes,{
				deferredChanges: mainDeferredChanges,
				timerId: mainTimerId,
				throttledRefresh: mainThrottledRefresh,
				callback: mainRefresh,
				mainCondition: true,
				styleCondition: false
			});
		};
		$tw.wiki.addEventListener("change",styleRefreshHandler);
		$tw.wiki.addEventListener("change",mainRefreshHandler);
		// Listen for keyboard shortcuts
		$tw.utils.addEventListeners(srcDocument,[{
			name: "keydown",
			handlerObject: $tw.keyboardManager,
			handlerMethod: "handleKeydownEvent"
		}]);
		srcWindow.document.documentElement.addEventListener("click",$tw.popup,true);
		srcWindow.haveInitialisedWindow = true;
	});
	$tw.rootWidget.addEventListener("tm-close-window",function(event) {
		var windowID = event.param,
			win = $tw.windows[windowID];
			if(win) {
				win.close();
			}
	});
	var closeAllWindows = function() {
		$tw.utils.each($tw.windows,function(win) {
			win.close();
		});
	}
	$tw.rootWidget.addEventListener("tm-close-all-windows",closeAllWindows);
	// Close open windows when unloading main window
	$tw.addUnloadTask(closeAllWindows);
};

})();
