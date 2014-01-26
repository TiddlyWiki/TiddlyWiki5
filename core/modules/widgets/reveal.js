/*\
title: $:/core/modules/widgets/reveal.js
type: application/javascript
module-type: widget

Reveal widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var RevealWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
RevealWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
RevealWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	var domNode = this.document.createElement(this.parseTreeNode.isBlock ? "div" : "span");
	var classes = this["class"].split(" ") || [];
	classes.push("tw-reveal");
	domNode.className = classes.join(" ");
	parent.insertBefore(domNode,nextSibling);
	this.renderChildren(domNode,null);
	if(!domNode.isTiddlyWikiFakeDom && this.type === "popup" && this.isOpen) {
		this.positionPopup(domNode);
		$tw.utils.addClass(domNode,"tw-popup"); // Make sure that clicks don't dismiss popups within the revealed content
	}
	if(!this.isOpen) {
		domNode.setAttribute("hidden","true")
	}
	this.domNodes.push(domNode);
};

RevealWidget.prototype.positionPopup = function(domNode) {
	domNode.style.position = "absolute";
	domNode.style.zIndex = "1000";
	switch(this.position) {
		case "left":
			domNode.style.left = (this.popup.left - domNode.offsetWidth) + "px";
			domNode.style.top = this.popup.top + "px";
			break;
		case "above":
			domNode.style.left = this.popup.left + "px";
			domNode.style.top = (this.popup.top - domNode.offsetHeight) + "px";
			break;
		case "aboveright":
			domNode.style.left = (this.popup.left + this.popup.width) + "px";
			domNode.style.top = (this.popup.top + this.popup.height - domNode.offsetHeight) + "px";
			break;
		case "right":
			domNode.style.left = (this.popup.left + this.popup.width) + "px";
			domNode.style.top = this.popup.top + "px";
			break;
		case "belowleft":
			domNode.style.left = (this.popup.left + this.popup.width - domNode.offsetWidth) + "px";
			domNode.style.top = (this.popup.top + this.popup.height) + "px";
			break;
		default: // Below
			domNode.style.left = this.popup.left + "px";
			domNode.style.top = (this.popup.top + this.popup.height) + "px";
			break;
	}
};

/*
Compute the internal state of the widget
*/
RevealWidget.prototype.execute = function() {
	// Get our parameters
	this.state = this.getAttribute("state");
	this.type = this.getAttribute("type");
	this.text = this.getAttribute("text");
	this.position = this.getAttribute("position");
	this["class"] = this.getAttribute("class","");
	this["default"] = this.getAttribute("default","");
	this.animate = this.getAttribute("animate","no");
	this.openAnimation = this.animate === "no" ? undefined : "open";
	this.closeAnimation = this.animate === "no" ? undefined : "close";
	// Compute the title of the state tiddler and read it
	this.stateTitle = this.state;
	this.readState();
	// Construct the child widgets
	var childNodes = this.isOpen ? this.parseTreeNode.children : [];
	this.hasChildNodes = this.isOpen;
	this.makeChildWidgets(childNodes);
};

/*
Read the state tiddler
*/
RevealWidget.prototype.readState = function() {
	// Read the information from the state tiddler
	if(this.stateTitle) {
		var state = this.wiki.getTextReference(this.stateTitle,this["default"],this.getVariable("currentTiddler"));
		switch(this.type) {
			case "popup":
				this.readPopupState(state);
				break;
			case "match":
				this.readMatchState(state);
				break;
			case "nomatch":
				this.readMatchState(state);
				this.isOpen = !this.isOpen;
				break;
		}
	}
};

RevealWidget.prototype.readMatchState = function(state) {
	this.isOpen = state === this.text;
};

RevealWidget.prototype.readPopupState = function(state) {
	var popupLocationRegExp = /^\((-?[0-9\.E]+),(-?[0-9\.E]+),(-?[0-9\.E]+),(-?[0-9\.E]+)\)$/,
		match = popupLocationRegExp.exec(state);
	// Check if the state matches the location regexp
	if(match) {
		// If so, we're open
		this.isOpen = true;
		// Get the location
		this.popup = {
			left: parseFloat(match[1]),
			top: parseFloat(match[2]),
			width: parseFloat(match[3]),
			height: parseFloat(match[4])
		};
	} else {
		// If not, we're closed
		this.isOpen = false;
	}
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
RevealWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.state || changedAttributes.type || changedAttributes.text || changedAttributes.position || changedAttributes["default"] || changedAttributes.animate) {
		this.refreshSelf();
		return true;
	} else {
		var refreshed = false;
		if(changedTiddlers[this.stateTitle]) {
			// this.updateState();
			this.refreshSelf();
			refreshed = true;
		}
		return this.refreshChildren(changedTiddlers) || refreshed;
	}
};

/*
Called by refresh() to dynamically show or hide the content
*/
RevealWidget.prototype.updateState = function() {
	// Read the current state
	this.readState();
	// Construct the child nodes if needed
	var domNode = this.domNodes[0];
	if(this.isOpen && !this.hasChildNodes) {
		this.hasChildNodes = true;
		this.makeChildWidgets(this.parseTreeNode.children);
		this.renderChildren(domNode,null);
	}
	// Animate our DOM node
	if(!domNode.isTiddlyWikiFakeDom && this.type === "popup" && this.isOpen) {
		this.positionPopup(domNode);
		$tw.utils.addClass(domNode,"tw-popup"); // Make sure that clicks don't dismiss popups within the revealed content

	}
	if(this.isOpen) {
		domNode.removeAttribute("hidden");
        $tw.anim.perform(this.openAnimation,domNode);
	} else {
		$tw.anim.perform(this.closeAnimation,domNode,{callback: function() {
			domNode.setAttribute("hidden","true");
        }});
	}
};

exports.reveal = RevealWidget;

})();
