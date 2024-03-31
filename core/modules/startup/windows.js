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

		function getStyleWidgets(widget,array) {
			array = array || [];
			if(widget.parseTreeNode.type === "element" && widget.parseTreeNode.tag === "style") {
				array.push(widget.domNodes[0]);
			}
			for(var i=0; i<widget.children.length; i++) {
				getStyleWidgets(widget.children[i],array);
			}
			return array;
		}

		// Set up the styles
		var styleWidgetNode = $tw.wiki.makeTranscludeWidget("$:/core/ui/RootStylesheet",{
				document: $tw.fakeDocument,
				variables: variables,
				importPageMacros: true}),
			styleContainer = $tw.fakeDocument.createElement("style");
		styleWidgetNode.render(styleContainer,null);
		
		$tw.windows[windowID].styleWidgets = getStyleWidgets(styleWidgetNode);
		$tw.windows[windowID].styleElements = [];
		var styleTags = srcDocument.head.getElementsByTagName("style"),
			lastStyleTag = styleTags[styleTags.length - 1],
			insertBeforeElement;
		if(lastStyleTag) {
			insertBeforeElement = lastStyleTag.nextSibling;
		} else {
			insertBeforeElement = srcDocument.head.firstChild;
		}
		var styleElement;
		if($tw.styleWidgets.length) {
			for(var i=0; i<$tw.styleWidgets.length; i++) {
				styleElement = srcDocument.createElement("style");
				for(var key in $tw.styleWidgets[i].attributes) {
					styleElement.setAttribute(key,$tw.styleWidgets[i].attributes[key]);
				}
				styleElement.innerHTML = $tw.styleWidgets[i].textContent;
				$tw.windows[windowID].styleElements.push(styleElement);
				srcDocument.head.insertBefore(styleElement,insertBeforeElement);
			}
		} else {
			styleElement = srcDocument.createElement("style");
			styleElement.innerHTML = $tw.styleContainer.textContent;
			$tw.windows[windowID].styleElements.push(styleElement);
			srcDocument.head.insertBefore(styleElement,insertBeforeElement);
		}

		// Render the text of the tiddler
		var parser = $tw.wiki.parseTiddler(template),
			widgetNode = $tw.wiki.makeWidget(parser,{document: srcDocument, parentWidget: $tw.rootWidget, variables: variables});
		widgetNode.render(srcDocument.body,srcDocument.body.firstChild);
		// Function to handle refreshes
		refreshHandler = function(changes) {
			if(styleWidgetNode.refresh(changes,styleContainer,null)) {
				var styleWidgets = getStyleWidgets(styleWidgetNode),
					newStyles,i;
				if(styleWidgets.length && styleWidgets !== $tw.windows[windowID].styleWidgets) {
					for(i=0; i<styleWidgets.length; i++) {
						newStyles = styleWidgets[i].textContent;
						if(!$tw.windows[windowID].styleElements[i]) {
							styleElement = srcDocument.createElement("style");
							for(var key in styleWidgets[i].attributes) {
								styleElement.setAttribute(key,styleWidgets[i].attributes[key]);
							}
							srcDocument.head.insertBefore(styleElement,$tw.windows[windowID].styleElements[i] || $tw.windows[windowID].styleElements[i - 1].nextSibling);
							$tw.windows[windowID].styleElements.splice(i,0,styleElement);
						}
						if(newStyles !== $tw.windows[windowID].styleElements[i].textContent) {
							$tw.windows[windowID].styleElements[i].innerHTML = newStyles;
						}
					}
					if(styleWidgets.length < $tw.windows[windowID].styleElements.length) {
						var removedElements = [];
						for(i=0; i<$tw.windows[windowID].styleWidgets.length; i++) {
							if($tw.windows[windowID].styleElements[i] && styleWidgets.indexOf($tw.windows[windowID].styleWidgets[i]) === -1) {
								srcDocument.head.removeChild($tw.windows[windowID].styleElements[i]);
								removedElements.push(i);
							}
						}
						for(i=0; i<removedElements.length; i++) {
							var index = removedElements[i];
							$tw.windows[windowID].styleElements.splice(index,1);
						}
					}
				} else if(styleWidgets.length === 0) {
					for(i=($tw.windows[windowID].styleWidgets.length - 1); i>=1; i--) {
						if($tw.styleElements[i]) {
							srcDocument.head.removeChild($tw.windows[windowID].styleElements[i]);
							$tw.windows[windowID].styleElements.splice(i,1);
						}
					}
					newStyles = styleContainer.textContent;
					if(newStyles !== $tw.windows[windowID].styleElements[0].textContent) {
						$tw.windows[windowID].styleElements[0].innerHTML = newStyles;
					}
				}
				$tw.windows[windowID].styleWidgets = styleWidgets;
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
