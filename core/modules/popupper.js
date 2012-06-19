/*\
title: $:/core/modules/popupper.js
type: application/javascript
module-type: utils

Plugin that creates a $tw.utils.Popupper object prototype that manages popups in the browser

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Creates a Popupper object with these options:
	wiki: the wiki to use for resolving tiddler titles
	rootElement: the DOM element to which the popup zapper should be attached
*/
var Popupper = function(options) {
	options = options || {};
	this.wiki = options.wiki;
	this.rootElement = options.rootElement || document.body;
	this.popupTextRef = null;
};

Popupper.prototype.popup = function(stateTextRef) {
	var popupState;
	this.cancel();
	this.popupTextRef = stateTextRef;
	this.rootElement.addEventListener("click",this,true);
};

Popupper.prototype.handleEvent = function(event) {
	if(event.type === "click") {
		this.rootElement.removeEventListener("click",this,true);
		this.cancel();
	}
}

Popupper.prototype.cancel = function() {
	if(this.popupTextRef) {
		this.wiki.deleteTextReference(this.popupTextRef);
		this.popupTextRef = null;
	}
};

exports.Popupper = Popupper;

})();
