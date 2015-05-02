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

exports.startup = function() {
	$tw.rootWidget.addEventListener("tm-open-window",function(event) {
		// Get the parameters
		var title = event.param || event.tiddlerTitle,
			paramObject = event.paramObject || {},
			template = paramObject.template || "$:/core/ui/ViewTemplate/body",
			width = paramObject.width || "700",
			height = paramObject.height || "600";
		// Open the window
		var srcWindow = window.open("","external-" + title,"width=" + width + ",height=" + height),
			srcDocument = srcWindow.document;
		srcWindow.onclose = function(event) {
			console.log("closing popup");
		};
		srcWindow.addEventListener("close",function(event) {
			console.log("closing2 popup");
		},false);
		srcDocument.write("<html><head></head><body class='tc-body'></body></html>");
		srcDocument.close();
		// Set up the styles
		var styleWidgetNode = $tw.wiki.makeTranscludeWidget("$:/core/ui/PageStylesheet",{document: $tw.fakeDocument}),
			styleContainer = $tw.fakeDocument.createElement("style");
		styleWidgetNode.render(styleContainer,null);
		var styleElement = srcDocument.createElement("style");
		styleElement.innerHTML = styleContainer.textContent;
		srcDocument.head.insertBefore(styleElement,srcDocument.head.firstChild);
		$tw.wiki.addEventListener("change",function(changes) {
			if(styleWidgetNode.refresh(changes,styleContainer,null)) {
				styleElement.innerHTML = styleContainer.textContent;
			}
		});
		// Render the text of the tiddler
		var parser = $tw.wiki.parseTiddler(template),
			widgetNode = $tw.wiki.makeWidget(parser,{document: srcDocument, variables: {currentTiddler: title}});
		widgetNode.render(srcDocument.body,null);
		$tw.wiki.addEventListener("change",function(changes) {
			widgetNode.refresh(changes);
		});

	});
};

})();
