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

	if(self === this && parent !== undefined && nextSibling !== undefined) {
		self.renderChildren(parent,nextSibling);
	} else if (self === this) {
		self.refresh();
		parentDomNode = parent;
	} else {
		return false;
	}

	// Return if no target elements specified
  	if(this.swipeTargets === undefined || this.swipeTargets === "") {
  		return false;
  	}
	
	// Get the Elements with the specified class
	var swipeElementClass;
	var swipeMultipleClasses = null;
	if(this.swipeTargets.indexOf(' ') !== -1) {
		swipeMultipleClasses = true;
		swipeElementClass = self.swipeTargets.split(' ');
	} else {
		swipeElementClass = self.swipeTargets;
	}

	if(swipeElementClass === undefined || swipeElementClass === "" || parentDomNode === undefined) {
		return false;
	}
	
	// If more than one element with the target class is found, store them in an array and cycle through that
	var domNodeList = [];
	if (swipeMultipleClasses === true) {
		for (var i=0; i < swipeElementClass.length; i++) {
			var swipeElements = parentDomNode.getElementsByClassName(swipeElementClass[i]);
			for (var k=0; k < swipeElements.length; k++) {
				domNodeList[i + k] = swipeElements[k];
			}
		}
	} else {
		domNodeList = parentDomNode.getElementsByClassName(swipeElementClass);
	}

	// Create the swipe direction used by Hammer
	var swipeDirection = 'swipe' + this.swipeDirection;

	// Create a new Hammer instance for each found dom node
	var swipeElementIndex;
	for(i=0; i < domNodeList.length; i++) {
		swipeElementIndex = i;

		var hammer = new Hammer.Manager(domNodeList[i]);

		hammer.add(new Hammer.Swipe({
			event: 'swipe',
			pointers: self.swipePointers,
			threshold: self.swipeThreshold,
			velocity: self.swipeVelocity,
			direction: Hammer.DIRECTION_ALL
		}));

		// Tell Hammer it should listen for the swipe event
		hammer.get('swipe');

		hammer.on(swipeDirection, function(e) {
			e.preventDefault && e.preventDefault();
			e.stopPropagation && e.stopPropagation();

			if(self.swipeActions) {
				self.invokeActionString(self.swipeActions,self,e);
			}

			if(self.parentWidget !== undefined) {
				self.parentWidget.refreshSelf();
			}
			return true; // Action was invoked
		});
	}
};

/*
Compute the internal state of the widget
*/
SwipeWidget.prototype.execute = function() {
	this.swipeTargets = this.getAttribute("targets");
	this.swipeActions = this.getAttribute("actions","");
	this.swipeVelocity = parseFloat(this.getAttribute("velocity")) || 1.0;
	this.swipeDirection = this.getAttribute("direction","");
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

})(this);
