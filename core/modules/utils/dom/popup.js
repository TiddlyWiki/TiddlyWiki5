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
	this.rootElement = options.rootElement || document.documentElement;
	this.popups = []; // Array of {title:,wiki:,domNode:} objects
};

/*
Trigger a popup open or closed. Parameters are in a hashmap:
	title: title of the tiddler where the popup details are stored
	domNode: dom node to which the popup will be positioned (one of domNode or domNodeRect is required)
	domNodeRect: rectangle to which the popup will be positioned
	wiki: wiki
	force: if specified, forces the popup state to true or false (instead of toggling it)
	floating: if true, skips registering the popup, meaning that it will need manually clearing
*/
Popup.prototype.triggerPopup = function(options) {
	// Check if this popup is already active
	var index = this.findPopup(options.title);
	// Compute the new state
	var state = index === -1;
	if(options.force !== undefined) {
		state = options.force;
	}
	// Show or cancel the popup according to the new state
	if(state) {
		this.show(options);
	} else {
		this.cancel(index);
	}
};

Popup.prototype.findPopup = function(title) {
	var index = -1;
	for(var t=0; t<this.popups.length; t++) {
		if(this.popups[t].title === title) {
			index = t;
		}
	}
	return index;
};

Popup.prototype.handleEvent = function(event) {
	if(event.type === "click") {
		// Find out what was clicked on
		var info = this.popupInfo(event.target),
			cancelLevel = info.popupLevel - 1;
		// Don't remove the level that was clicked on if we clicked on a handle
		if(info.isHandle) {
			cancelLevel++;
		}
		// Cancel
		this.cancel(cancelLevel);
	}
};

/*
Find the popup level containing a DOM node. Returns:
popupLevel: count of the number of nested popups containing the specified element
isHandle: true if the specified element is within a popup handle
*/
Popup.prototype.popupInfo = function(domNode) {
	var isHandle = false,
		popupCount = 0,
		node = domNode;
	// First check ancestors to see if we're within a popup handle
	while(node) {
		if($tw.utils.hasClass(node,"tc-popup-handle")) {
			isHandle = true;
			popupCount++;
		}
		if($tw.utils.hasClass(node,"tc-popup-keep")) {
			isHandle = true;
		}
		node = node.parentNode;
	}
	// Then count the number of ancestor popups
	node = domNode;
	while(node) {
		if($tw.utils.hasClass(node,"tc-popup")) {
			popupCount++;
		}
		node = node.parentNode;
	}
	var info = {
		popupLevel: popupCount,
		isHandle: isHandle
	};
	return info;
};

/*
Display a popup by adding it to the stack
*/
Popup.prototype.show = function(options) {
	// Find out what was clicked on
	var info = this.popupInfo(options.domNode);
	// Cancel any higher level popups
	this.cancel(info.popupLevel);

	// Store the popup details if not already there
	if(!options.floating && this.findPopup(options.title) === -1) {
		this.popups.push({
			title: options.title,
			wiki: options.wiki,
			domNode: options.domNode,
			noStateReference: options.noStateReference
		});
	}
	// Set the state tiddler
	var rect;
	if(options.domNodeRect) {
		rect = options.domNodeRect;
	} else {
		rect = {
			left: options.domNode.offsetLeft,
			top: options.domNode.offsetTop,
			width: options.domNode.offsetWidth,
			height: options.domNode.offsetHeight
		};
	}
	var popupRect = "(" + rect.left + "," + rect.top + "," + 
				rect.width + "," + rect.height + ")";
	if(options.noStateReference) {
		options.wiki.setText(options.title,"text",undefined,popupRect);
	} else {
		options.wiki.setTextReference(options.title,popupRect);
	}
	// Add the click handler if we have any popups
	if(this.popups.length > 0) {
		this.rootElement.addEventListener("click",this,true);
	}
};

/*
Cancel all popups at or above a specified level or DOM node
level: popup level to cancel (0 cancels all popups)
*/
Popup.prototype.cancel = function(level) {
	var numPopups = this.popups.length;
	level = Math.max(0,Math.min(level,numPopups));
	for(var t=level; t<numPopups; t++) {
		var popup = this.popups.pop();
		if(popup.title) {
			if(popup.noStateReference) {
				popup.wiki.deleteTiddler(popup.title);
			} else {
				popup.wiki.deleteTiddler($tw.utils.parseTextReference(popup.title).title);
        		}
		}
	}
	if(this.popups.length === 0) {
		this.rootElement.removeEventListener("click",this,false);
	}
};

/*
Returns true if the specified title and text identifies an active popup
*/
Popup.prototype.readPopupState = function(text) {
	var popupLocationRegExp = /^\((-?[0-9\.E]+),(-?[0-9\.E]+),(-?[0-9\.E]+),(-?[0-9\.E]+)\)$/;
	return popupLocationRegExp.test(text);
};

exports.Popup = Popup;

})();
