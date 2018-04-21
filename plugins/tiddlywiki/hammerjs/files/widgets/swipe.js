/*\
title: $:/plugins/tiddlywiki/hammerjs/widgets/swipe.js
type: application/javascript
module-type: widget

actions triggered on swipe gestures

\*/
(function (global) {

"use strict";
/*jslint node: true, browser: true */
/*global $tw: false */

var Widget = require("$:/core/modules/widgets/widget.js").widget;

if (typeof window !== 'undefined') {
	var Hammer = require("$:/plugins/tiddlywiki/hammerjs/hammer.js");
}

var SwipeWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
SwipeWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
SwipeWidget.prototype.render = function(parent,nextSibling) {
	var self = this;
	var parentDomNode = parent;
  
	// Compute attributes and execute state
	this.computeAttributes();
	this.execute();

	var swipeDomNode = this.document.createElement(this.swipeTag);
	swipeDomNode.setAttribute("class",this.swipeClass);
	parent.insertBefore(swipeDomNode,nextSibling);
	this.domNodes.push(swipeDomNode);
	this.renderChildren(swipeDomNode,null);

	var hammer = new Hammer.Manager(swipeDomNode);

	hammer.add(new Hammer.Swipe({
		event: 'swipe',
		pointers: self.swipePointers,
		threshold: self.swipeThreshold,
		velocity: self.swipeVelocity,
		direction: Hammer.DIRECTION_ALL
	}));

	// Tell Hammer it should listen for the swipe event
	hammer.get('swipe');

	hammer.on("swiperight", function(e) {
		e.preventDefault && e.preventDefault();
		e.stopPropagation && e.stopPropagation();

		if(self.swipeRightActions !== "") {
			self.invokeActionString(self.swipeRightActions,self,e);
		}

		if(self.parentWidget !== undefined && self.domNodes[0] !== undefined && self.domNodes[0].parentNode !== undefined) {
			self.parentWidget.refreshSelf();
		}

		return true; // Action was invoked
	})
	.on("swipeleft", function(e) {
		e.preventDefault && e.preventDefault();
		e.stopPropagation && e.stopPropagation();

		if(self.swipeLeftActions !== "") {
			self.invokeActionString(self.swipeLeftActions,self,e);
		}

		if(self.parentWidget !== undefined && self.domNodes[0] !== undefined && self.domNodes[0].parentNode !== undefined) {
			self.parentWidget.refreshSelf();
		}

		return true; // Action was invoked
	})
	.on("swipeup", function(e) {
		e.preventDefault && e.preventDefault();
		e.stopPropagation && e.stopPropagation();

		if(self.swipeUpActions !== "") {
			self.invokeActionString(self.swipeUpActions,self,e);
		}

		if(self.parentWidget !== undefined && self.domNodes[0] !== undefined && self.domNodes[0].parentNode !== undefined) {
			self.parentWidget.refreshSelf();
		}

		return true; // Action was invoked
	})
	.on("swipedown", function(e) {
		e.preventDefault && e.preventDefault();
		e.stopPropagation && e.stopPropagation();

		if(self.swipeDownActions !== "") {
			self.invokeActionString(self.swipeDownActions,self,e);
		}

		if(self.parentWidget !== undefined && self.domNodes[0] !== undefined && self.domNodes[0].parentNode !== undefined) {
			self.parentWidget.refreshSelf();
		}

		return true; // Action was invoked
	});
};

/*
Compute the internal state of the widget
*/
SwipeWidget.prototype.execute = function() {
	this.swipeClass = this.getAttribute("class", "tc-swipe-element");
	this.swipeTag = this.getAttribute("tag", "div");
	this.swipeLeftActions = this.getAttribute("leftactions","");
	this.swipeUpActions = this.getAttribute("upactions","");
	this.swipeRightActions = this.getAttribute("rightactions","");
	this.swipeDownActions = this.getAttribute("downactions","");
	this.swipeVelocity = parseFloat(this.getAttribute("velocity", "0.1"));
	this.swipePointers = parseInt(this.getAttribute("pointers","1"));
	this.swipeThreshold = parseInt(this.getAttribute("threshold","0"));
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
SwipeWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(Object.keys(changedAttributes).length) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

exports.swipe = SwipeWidget;
})();
