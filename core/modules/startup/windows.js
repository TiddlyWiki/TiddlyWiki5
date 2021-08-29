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

exports.startup = function() {
	// Handle open window message
	$tw.rootWidget.addEventListener("tm-open-window",function(event) {
		// Get the parameters
		var refreshHandler,
			title = event.param || event.tiddlerTitle,
			paramObject = event.paramObject || {},
			windowTitle = paramObject.windowTitle || title,
			template = paramObject.template || "$:/core/templates/single.tiddler.window",
			width = paramObject.width || "700",
			height = paramObject.height || "600",
			variables = $tw.utils.extend({},paramObject,{currentTiddler: title});
		// Open the window
		var srcWindow,
			srcDocument;
		// In case that popup blockers deny opening a new window
		try {
			srcWindow = window.open("","external-" + title,"scrollbars,width=" + width + ",height=" + height),
			srcDocument = srcWindow.document;
		}
		catch(e) {
			return;
		}
		$tw.windows[title] = srcWindow;
		// Check for reopening the same window
		if(srcWindow.haveInitialisedWindow) {
			return;
		}
		// Initialise the document
		srcDocument.write("<html><head></head><body class='tc-body tc-single-tiddler-window'></body></html>");
		srcDocument.close();
		srcDocument.title = windowTitle;
		srcWindow.addEventListener("beforeunload",function(event) {
			delete $tw.windows[title];
			$tw.wiki.removeEventListener("change",refreshHandler);
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
		srcDocument.head.insertBefore(styleElement,srcDocument.head.firstChild);
		// Render the text of the tiddler
		var parser = $tw.wiki.parseTiddler(template),
			widgetNode = $tw.wiki.makeWidget(parser,{document: srcDocument, parentWidget: $tw.rootWidget, variables: variables});
		widgetNode.render(srcDocument.body,srcDocument.body.firstChild);
		// Function to handle refreshes
		refreshHandler = function(changes) {
			// Save the scroll position
			var scrollX = srcWindow.scrollX,
				scrollY = srcWindow.scrollY;
			// Detect the currently focused domNode
			var currentlyFocusedDomNode = srcDocument.activeElement.tagName !== "IFRAME" ? srcDocument.activeElement : srcDocument.activeElement.contentWindow.document.activeElement;
			// Find the widget owning the currently focused domNode
			var focusWidget = $tw.focusManager.findWidgetOwningDomNode(widgetNode,currentlyFocusedDomNode);
			var renderTreeFootprint;
			if(focusWidget) {
				renderTreeFootprint = $tw.focusManager.generateRenderTreeFootprint(focusWidget,currentlyFocusedDomNode);
			}
			var widgetTreeFootprint,
				widgetQualifier,
				widgetInfo = {};
			if(focusWidget) {
				widgetTreeFootprint = $tw.focusManager.generateWidgetTreeFootprint(focusWidget);
				widgetQualifier = focusWidget.getStateQualifier() + "_" + focusWidget.getCurrentWidgetId();
				if(focusWidget.engine && focusWidget.engine.getSelectionRange) {
					var selections = focusWidget.engine.getSelectionRange();
					widgetInfo.atEndPos = selections.atEndPos,
					widgetInfo.comprisesFullText = selections.comprisesFullText,
					widgetInfo.selectionStart = selections.selectionStart,
					widgetInfo.selectionEnd = selections.selectionEnd;
				}
			}
			if(styleWidgetNode.refresh(changes,styleContainer,null)) {
				styleElement.innerHTML = styleContainer.textContent;
			}
			widgetNode.refresh(changes);
			var refreshedWidget;
			if(widgetTreeFootprint) {
				refreshedWidget = $tw.focusManager.findWidgetByFootprint(widgetTreeFootprint,widgetNode,widgetQualifier);
			}
			if(refreshedWidget) {
				$tw.focusManager.focusWidget(refreshedWidget,renderTreeFootprint,widgetInfo);
			}
			// Restore the scroll position
			srcWindow.scroll(scrollX,scrollY);
		};
		$tw.wiki.addEventListener("change",refreshHandler);
		// Listen for keyboard shortcuts
		$tw.utils.addEventListeners(srcDocument,[{
			name: "keydown",
			handlerObject: $tw.keyboardManager,
			handlerMethod: "handleKeydownEvent"
		}]);
		srcWindow.document.documentElement.addEventListener("click",$tw.popup,true);
		srcWindow.haveInitialisedWindow = true;
	});
	// Close open windows when unloading main window
	$tw.addUnloadTask(function() {
		$tw.utils.each($tw.windows,function(win) {
			win.close();
		});
	});

};

})();
