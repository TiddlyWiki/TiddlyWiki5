/*\
title: $:/plugins/tiddlywiki/qrcode/barcodereader.js
type: application/javascript
module-type: widget

barcodereader widget for reading barcodes

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var nextID = 0;

var BarCodeReaderWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
BarCodeReaderWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
BarCodeReaderWidget.prototype.render = function(parent,nextSibling) {
	var self = this;
	this.parentDomNode = parent;
	this.computeAttributes();
	// Make the child widgets
	this.makeChildWidgets();
	// Generate an ID for this element
	var id = "capture-widget-internal-" + nextID;
	nextID += 1;
	// Create the DOM node and render children
	var domNode = this.document.createElement("div");
	domNode.className = "tc-readcode-widget";
	domNode.setAttribute("width","300px");
	domNode.setAttribute("height","300px");
	domNode.id = id;
	parent.insertBefore(domNode,nextSibling);
	this.renderChildren(domNode,null);
	this.domNodes.push(domNode);
	// Setup the qrcode library
	if($tw.browser) {
		var __Html5QrcodeLibrary__ = require("$:/plugins/tiddlywiki/qrcode/html5-qrcode/html5-qrcode.js").__Html5QrcodeLibrary__;
		function onScanSuccess(decodedText, decodedResult) {
			self.invokeActionString(self.getAttribute("actionsSuccess",""),self,{},{
				format: decodedResult.result.format.formatName,
				text: decodedText
			});
			console.log("Scan result",decodedResult,decodedText);
		}
		function onScanFailure(errorMessage) {
			self.invokeActionString(self.getAttribute("actionsFailure",""),self,{},{
				error: errorMessage
			});
			console.log("Scan error",errorMessage);
		}
		var html5QrcodeScanner = new __Html5QrcodeLibrary__.Html5QrcodeScanner(
			id,
			{
				fps: 10,
				qrbox: 250
			}
		);
		html5QrcodeScanner.render(onScanSuccess,onScanFailure);
	}
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
BarCodeReaderWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes(),
		hasChangedAttributes = $tw.utils.count(changedAttributes) > 0;
	if(hasChangedAttributes) {
		return this.refreshSelf();
	}
	return this.refreshChildren(changedTiddlers) || hasChangedAttributes;
};

exports.barcodereader = BarCodeReaderWidget;

})();
