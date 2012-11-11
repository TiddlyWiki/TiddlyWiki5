/*\
title: $:/core/modules/utils/dom/popup.js
type: application/javascript
module-type: utils

Module that creates a $tw.utils.Popup object prototype that manages popups in the browser

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Creates a Popup object with these options:
	wiki: the wiki to use for resolving tiddler titles
	rootElement: the DOM element to which the popup zapper should be attached
*/
var Popup = function(options) {
	options = options || {};
	this.wiki = options.wiki;
	this.rootElement = options.rootElement || document.body;
	this.popupTextRef = null;
};

Popup.prototype.popup = function(stateTextRef) {
	this.cancel();
	this.popupTextRef = stateTextRef;
	this.rootElement.addEventListener("click",this,true);
};

Popup.prototype.handleEvent = function(event) {
	if(event.type === "click") {
		this.rootElement.removeEventListener("click",this,true);
		this.cancel();
	}
};

Popup.prototype.cancel = function() {
	if(this.popupTextRef) {
		this.wiki.deleteTextReference(this.popupTextRef);
		this.popupTextRef = null;
	}
};

/*
Trigger a popup open or closed. Parameters are in a hashmap:
	textRef: text reference where the popup details are stored
	domNode: dom node to which the popup will be positioned
	qualifyTiddlerTitles: "yes" if state tiddler titles are to be qualified
	contextTiddlerTitle: title of tiddler providing context for text references
	contextParents: parent stack
	wiki: wiki
*/
Popup.prototype.triggerPopup = function(options) {
	// Get the textref of the popup state tiddler
	var textRef = options.textRef;
	if(options.qualifyTiddlerTitles === "yes") {
		textRef = textRef + "(" + options.contextParents.join(",") + "," + options.contextTiddlerTitle + ")";
	}
	// Get the current popup state tiddler
	var value = options.wiki.getTextReference(textRef,"",options.contextTiddlerTitle);
	// Check if the popup is open by checking whether it matches "(<x>,<y>)"
	var popupLocationRegExp = /^\((-?[0-9\.E]+),(-?[0-9\.E]+),(-?[0-9\.E]+),(-?[0-9\.E]+)\)$/;
	if(popupLocationRegExp.test(value)) {
		this.cancel();
	} else {
		// Set the position if we're opening it
		options.wiki.setTextReference(textRef,
			"(" + options.domNode.offsetLeft + "," + options.domNode.offsetTop + "," + 
				options.domNode.offsetWidth + "," + options.domNode.offsetHeight + ")",
			options.contextTiddlerTitle,true);
		this.popup(textRef);
	}
};

exports.Popup = Popup;

})();
