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
	rootElement: the DOM element to which the popup zapper should be attached
*/
var Popup = function(options) {
	options = options || {};
	this.rootElement = options.rootElement || document.body;
};

Popup.prototype.show = function(options) {
	this.cancel();
	this.title = options.title;
	this.wiki = options.wiki;
	this.anchorDomNode = options.domNode;
	this.rootElement.addEventListener("click",this,false);
};

Popup.prototype.handleEvent = function(event) {
	if(event.type === "click" && !$tw.utils.domContains(this.anchorDomNode,event.target)) {
		this.cancel();
	}
};

Popup.prototype.cancel = function() {
	this.rootElement.removeEventListener("click",this,false);
	if(this.title) {
		this.wiki.deleteTiddler(this.title);
		this.title = null;
	}
};

/*
Trigger a popup open or closed. Parameters are in a hashmap:
	title: title of the tiddler where the popup details are stored
	domNode: dom node to which the popup will be positioned
	wiki: wiki
	force: if specified, forces the popup state to true or false
*/
Popup.prototype.triggerPopup = function(options) {
	// Get the current popup state tiddler
	var value = options.wiki.getTextReference(options.title,"");
	// Check if the popup is open by checking whether it matches "(<x>,<y>)"
	var popupLocationRegExp = /^\((-?[0-9\.E]+),(-?[0-9\.E]+),(-?[0-9\.E]+),(-?[0-9\.E]+)\)$/,
		state = !popupLocationRegExp.test(value);
	if("force" in options) {
		state = options.force;
	}
	if(state) {
		// Set the position if we're opening it
		this.cancel();
		options.wiki.setTextReference(options.title,
			"(" + options.domNode.offsetLeft + "," + options.domNode.offsetTop + "," + 
				options.domNode.offsetWidth + "," + options.domNode.offsetHeight + ")");
		this.show(options);
	} else {
		this.cancel();
	}
};

exports.Popup = Popup;

})();
