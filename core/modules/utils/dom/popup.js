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
	var popupState;
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

exports.Popup = Popup;

})();
