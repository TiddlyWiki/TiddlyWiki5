/*\
title: $:/core/modules/widgets/scrollable.js
type: application/javascript
module-type: widget

Scrollable widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var ScrollableWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
	this.scaleFactor = 1;
	this.addEventListeners([
		{type: "tw-scroll", handler: "handleScrollEvent"}
	]);
	if($tw.browser) {
		this.requestAnimationFrame = window.requestAnimationFrame ||
			window.webkitRequestAnimationFrame ||
			window.mozRequestAnimationFrame ||
			function(callback) {
				return window.setTimeout(callback, 1000/60);
			};
		this.cancelAnimationFrame = window.cancelAnimationFrame ||
			window.webkitCancelAnimationFrame ||
			window.webkitCancelRequestAnimationFrame ||
			window.mozCancelAnimationFrame ||
			window.mozCancelRequestAnimationFrame ||
			function(id) {
				window.clearTimeout(id);
			};
	}
};

/*
Inherit from the base widget class
*/
ScrollableWidget.prototype = new Widget();

ScrollableWidget.prototype.cancelScroll = function() {
	if(this.idRequestFrame) {
		this.cancelAnimationFrame.call(window,this.idRequestFrame);
		this.idRequestFrame = null;
	}
};

/*
Handle a scroll event
*/
ScrollableWidget.prototype.handleScrollEvent = function(event) {
	// Pass the scroll event through if our offsetsize is larger than our scrollsize
	if(this.outerDomNode.scrollWidth <= this.outerDomNode.offsetWidth && this.outerDomNode.scrollHeight <= this.outerDomNode.offsetHeight && this.fallthrough === "yes") {
		return true;
	}
	this.scrollIntoView(event.target);
	return false; // Handled event
};

/*
Scroll an element into view
*/
ScrollableWidget.prototype.scrollIntoView = function(element) {
	var duration = $tw.utils.getAnimationDuration();
	this.cancelScroll();
	this.startTime = Date.now();
	var scrollPosition = {
		x: this.outerDomNode.scrollLeft,
		y: this.outerDomNode.scrollTop
	};
	// Get the client bounds of the element and adjust by the scroll position
	var scrollableBounds = this.outerDomNode.getBoundingClientRect(),
		clientTargetBounds = element.getBoundingClientRect(),
		bounds = {
			left: clientTargetBounds.left + scrollPosition.x - scrollableBounds.left,
			top: clientTargetBounds.top + scrollPosition.y - scrollableBounds.top,
			width: clientTargetBounds.width,
			height: clientTargetBounds.height
		};
	// We'll consider the horizontal and vertical scroll directions separately via this function
	var getEndPos = function(targetPos,targetSize,currentPos,currentSize) {
			// If the target is already visible then stay where we are
			if(targetPos >= currentPos && (targetPos + targetSize) <= (currentPos + currentSize)) {
				return currentPos;
			// If the target is above/left of the current view, then scroll to its top/left
			} else if(targetPos <= currentPos) {
				return targetPos;
			// If the target is smaller than the window and the scroll position is too far up, then scroll till the target is at the bottom of the window
			} else if(targetSize < currentSize && currentPos < (targetPos + targetSize - currentSize)) {
				return targetPos + targetSize - currentSize;
			// If the target is big, then just scroll to the top
			} else if(currentPos < targetPos) {
				return targetPos;
			// Otherwise, stay where we are
			} else {
				return currentPos;
			}
		},
		endX = getEndPos(bounds.left,bounds.width,scrollPosition.x,this.outerDomNode.offsetWidth),
		endY = getEndPos(bounds.top,bounds.height,scrollPosition.y,this.outerDomNode.offsetHeight);
	// Only scroll if necessary
	if(endX !== scrollPosition.x || endY !== scrollPosition.y) {
		var self = this,
			drawFrame;
		drawFrame = function () {
			var t;
			if(duration <= 0) {
				t = 1;
			} else {
				t = ((Date.now()) - self.startTime) / duration;	
			}
			if(t >= 1) {
				self.cancelScroll();
				t = 1;
			}
			t = $tw.utils.slowInSlowOut(t);
			self.outerDomNode.scrollLeft = scrollPosition.x + (endX - scrollPosition.x) * t;
			self.outerDomNode.scrollTop = scrollPosition.y + (endY - scrollPosition.y) * t;
			if(t < 1) {
				self.idRequestFrame = self.requestAnimationFrame.call(window,drawFrame);
			}
		};
		drawFrame();
	}
};

/*
Render this widget into the DOM
*/
ScrollableWidget.prototype.render = function(parent,nextSibling) {
	var self = this;
	// Remember parent
	this.parentDomNode = parent;
	// Compute attributes and execute state
	this.computeAttributes();
	this.execute();
	// Create elements
	this.outerDomNode = this.document.createElement("div");
	$tw.utils.setStyle(this.outerDomNode,[
		{overflowY: "auto"},
		{overflowX: "auto"},
		{webkitOverflowScrolling: "touch"}
	]);
	this.innerDomNode = this.document.createElement("div");
	this.outerDomNode.appendChild(this.innerDomNode);
	// Assign classes
	this.outerDomNode.className = this["class"] || "";
	// Insert element
	parent.insertBefore(this.outerDomNode,nextSibling);
	this.renderChildren(this.innerDomNode,null);
	this.domNodes.push(this.outerDomNode);
};

/*
Compute the internal state of the widget
*/
ScrollableWidget.prototype.execute = function() {
	// Get attributes
	this.fallthrough = this.getAttribute("fallthrough","yes");
	this["class"] = this.getAttribute("class");
	// Make child widgets
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
ScrollableWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes["class"]) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

exports.scrollable = ScrollableWidget;

})();
