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
	$tw.utils.addClass(this.anchorDomNode,"tw-popup");
	this.rootElement.addEventListener("click",this,false);
};

Popup.prototype.handleEvent = function(event) {
	// Dismiss the popup if we get a click on an element that doesn't have .tw-popup class
	if(event.type === "click") {
		var node = event.target;
		while(node && !$tw.utils.hasClass(node,"tw-popup")) {
			node = node.parentNode;
		}
		if(!node) {
			this.cancel();
		}
	}
};

Popup.prototype.cancel = function() {
	if(this.anchorDomNode) {
		$tw.utils.removeClass(this.anchorDomNode,"tw-popup");
		this.anchorDomNode = null;		
	}
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
	var state = !this.readPopupState(options.title,value);
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

/*
Returns true if the specified title and text identifies an active popup
*/
Popup.prototype.readPopupState = function(title,text) {
	var popupLocationRegExp = /^\((-?[0-9\.E]+),(-?[0-9\.E]+),(-?[0-9\.E]+),(-?[0-9\.E]+)\)$/,
		result = false;
	if(this.title === title) {
		result = popupLocationRegExp.test(text);
	}
	return result;
};

exports.Popup = Popup;

})();
