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
		var refreshHandler,
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
			$tw.wiki.removeEventListener("change",refreshHandler);
		},false);

		function getStyleWidgetNodes(widget,array) {
			array = array || [];
			if(widget.parseTreeNode.type === "element" && widget.parseTreeNode.tag === "style") {
				array.push(widget.domNodes[0]);
			}
			for(var i=0; i<widget.children.length; i++) {
				getStyleWidgetNodes(widget.children[i],array);
			}
			return array;
		};

		function checkSubSet(parentArray,subsetArray) {
			return subsetArray.every(function(entry) {
				return parentArray.includes(entry);
			});
		};

		// Set up the styles
		var styleWidgetNode = $tw.wiki.makeTranscludeWidget("$:/core/ui/RootStylesheet",{
				document: document,
				variables: variables,
				importPageMacros: true}),
			styleContainer = document.createElement("style");
		styleWidgetNode.render(styleContainer,null);
		
		var styleWidgetNodes = getStyleWidgetNodes(styleWidgetNode),
			styleTags = srcDocument.head.getElementsByTagName("style"),
			lastStyleTag = styleTags[styleTags.length - 1],
			insertBeforeElement;
		if(lastStyleTag) {
			insertBeforeElement = lastStyleTag.nextSibling;
		} else {
			insertBeforeElement = srcDocument.head.firstChild;
		}
		var styleElement;
		if(styleWidgetNodes.length) {
			for(var i=0; i<styleWidgetNodes.length; i++) {
				styleElement = styleWidgetNodes[i];
				srcDocument.head.insertBefore(styleElement,insertBeforeElement);
			}
		} else {
			styleElement = document.createElement("style");
			styleElement.innerHTML = $tw.styleContainer.textContent;
			srcDocument.head.insertBefore(styleElement,insertBeforeElement);
		}

		// Render the text of the tiddler
		var parser = $tw.wiki.parseTiddler(template),
			widgetNode = $tw.wiki.makeWidget(parser,{document: srcDocument, parentWidget: $tw.rootWidget, variables: variables});
		widgetNode.render(srcDocument.body,srcDocument.body.firstChild);
		// Function to handle refreshes
		refreshHandler = function(changes) {
			if(styleWidgetNode.refresh(changes,styleContainer,null)) {
				styleWidgetNodes = getStyleWidgetNodes(styleWidgetNode);
				styleTags = Array.prototype.slice.call(srcDocument.head.getElementsByTagName("style"));
				if(!checkSubSet(styleTags,styleWidgetNodes)) {
					for(var i=0; i<styleWidgetNodes.length; i++) {
						styleElement = styleWidgetNodes[i];
						if(styleTags.indexOf(styleElement) === -1) {
							srcDocument.head.insertBefore(styleElement,styleWidgetNodes[i - 1].nextSibling);
						}
					}
				}
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
