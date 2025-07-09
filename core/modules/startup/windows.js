/*\
title: $:/core/modules/startup/windows.js
type: application/javascript
module-type: startup

Setup root widget handlers for the messages concerned with opening external browser windows

\*/

"use strict";

// Export name and synchronous status
exports.name = "windows";
exports.platforms = ["browser"];
exports.after = ["startup"];
exports.synchronous = true;

// Global to keep track of open windows (hashmap by title)
$tw.windows = {};
// Default template to use for new windows
const DEFAULT_WINDOW_TEMPLATE = "$:/core/templates/single.tiddler.window";

exports.startup = function() {
	// Handle open window message
	$tw.rootWidget.addEventListener("tm-open-window",(event) => {
		// Get the parameters
		let refreshHandler;
		const title = event.param || event.tiddlerTitle;
		const paramObject = event.paramObject || {};
		const windowTitle = paramObject.windowTitle || title;
		const windowID = paramObject.windowID || title;
		const template = paramObject.template || DEFAULT_WINDOW_TEMPLATE;
		const width = paramObject.width || "700";
		const height = paramObject.height || "600";
		const {top} = paramObject;
		const {left} = paramObject;
		const variables = $tw.utils.extend({},paramObject,{currentTiddler: title,"tv-window-id": windowID});
		// Open the window
		let srcWindow;
		let srcDocument;
		// In case that popup blockers deny opening a new window
		try {
			srcWindow = window.open("",`external-${windowID}`,`scrollbars,width=${width},height=${height}${top ? `,top=${top}` : ""}${left ? `,left=${left}` : ""}`),
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
		srcWindow.addEventListener("beforeunload",(event) => {
			delete $tw.windows[windowID];
			$tw.wiki.removeEventListener("change",refreshHandler);
		},false);
		// Set up the styles
		const styleWidgetNode = $tw.wiki.makeTranscludeWidget("$:/core/ui/PageStylesheet",{
			document: $tw.fakeDocument,
			variables,
			importPageMacros: true
		});
		const styleContainer = $tw.fakeDocument.createElement("style");
		styleWidgetNode.render(styleContainer,null);
		const styleElement = srcDocument.createElement("style");
		styleElement.innerHTML = styleContainer.textContent;
		srcDocument.head.insertBefore(styleElement,srcDocument.head.firstChild);
		// Render the text of the tiddler
		const parser = $tw.wiki.parseTiddler(template);
		const widgetNode = $tw.wiki.makeWidget(parser,{document: srcDocument,parentWidget: $tw.rootWidget,variables});
		widgetNode.render(srcDocument.body,srcDocument.body.firstChild);
		// Function to handle refreshes
		refreshHandler = function(changes) {
			if(styleWidgetNode.refresh(changes,styleContainer,null)) {
				styleElement.innerHTML = styleContainer.textContent;
			}
			widgetNode.refresh(changes);
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
	$tw.rootWidget.addEventListener("tm-close-window",(event) => {
		const windowID = event.param;
		const win = $tw.windows[windowID];
		if(win) {
			win.close();
		}
	});
	const closeAllWindows = function() {
		$tw.utils.each($tw.windows,(win) => {
			win.close();
		});
	};
	$tw.rootWidget.addEventListener("tm-close-all-windows",closeAllWindows);
	// Close open windows when unloading main window
	$tw.addUnloadTask(closeAllWindows);
};
