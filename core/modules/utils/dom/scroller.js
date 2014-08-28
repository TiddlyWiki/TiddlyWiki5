/*\
title: $:/core/modules/utils/dom/scroller.js
type: application/javascript
module-type: utils

Module that creates a $tw.utils.Scroller object prototype that manages scrolling in the browser

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Event handler for when the `tm-scroll` event hits the document body
*/
var PageScroller = function() {
	this.idRequestFrame = null;
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
};

PageScroller.prototype.cancelScroll = function() {
	if(this.idRequestFrame) {
		this.cancelAnimationFrame.call(window,this.idRequestFrame);
		this.idRequestFrame = null;
	}
};

/*
Handle an event
*/
PageScroller.prototype.handleEvent = function(event) {
	if(event.type === "tm-scroll") {
		return this.scrollIntoView(event.target);
	}
	return true;
};

/*
Handle a scroll event hitting the page document
*/
PageScroller.prototype.scrollIntoView = function(element) {
	var duration = $tw.utils.getAnimationDuration();
	// Now get ready to scroll the body
	this.cancelScroll();
	this.startTime = Date.now();
	var scrollPosition = $tw.utils.getScrollPosition();
	// Get the client bounds of the element and adjust by the scroll position
	var clientBounds = element.getBoundingClientRect(),
		bounds = {
			left: clientBounds.left + scrollPosition.x,
			top: clientBounds.top + scrollPosition.y,
			width: clientBounds.width,
			height: clientBounds.height
		};
	// We'll consider the horizontal and vertical scroll directions separately via this function
	var getEndPos = function(targetPos,targetSize,currentPos,currentSize) {
			// If the target is above/left of the current view, then scroll to it's top/left
			if(targetPos <= currentPos) {
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
		endX = getEndPos(bounds.left,bounds.width,scrollPosition.x,window.innerWidth),
		endY = getEndPos(bounds.top,bounds.height,scrollPosition.y,window.innerHeight);
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
			window.scrollTo(scrollPosition.x + (endX - scrollPosition.x) * t,scrollPosition.y + (endY - scrollPosition.y) * t);
			if(t < 1) {
				self.idRequestFrame = self.requestAnimationFrame.call(window,drawFrame);
			}
		};
		drawFrame();
	}
};

exports.PageScroller = PageScroller;

})();
