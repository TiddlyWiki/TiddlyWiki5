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
	var self = this,
		duration = $tw.utils.getAnimationDuration();
	// Now get ready to scroll the body
	this.cancelScroll();
	this.startTime = Date.now();
	// Get the height of any position:fixed toolbars
	var toolbar = document.querySelector(".tc-adjust-top-of-scroll"),
		offset = 0;
	if(toolbar) {
		offset = toolbar.offsetHeight;
	}
	// Get the client bounds of the element and adjust by the scroll position
	var getBounds = function() {
			var clientBounds = element.getBoundingClientRect(),
				scrollPosition = $tw.utils.getScrollPosition();
			return {
				left: clientBounds.left + scrollPosition.x,
				top: clientBounds.top + scrollPosition.y - offset,
				width: clientBounds.width,
				height: clientBounds.height
			};
		},
		// We'll consider the horizontal and vertical scroll directions separately via this function
		// targetPos/targetSize - position and size of the target element
		// currentPos/currentSize - position and size of the current scroll viewport
		// returns: new position of the scroll viewport
		getEndPos = function(targetPos,targetSize,currentPos,currentSize) {
			var newPos = targetPos;
			// If we are scrolling within 50 pixels of the top/left then snap to zero
			if(newPos < 50) {
				newPos = 0;
			}
			return newPos;
		},
		drawFrame = function drawFrame() {
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
			var scrollPosition = $tw.utils.getScrollPosition(),
				bounds = getBounds(),
				endX = getEndPos(bounds.left,bounds.width,scrollPosition.x,window.innerWidth),
				endY = getEndPos(bounds.top,bounds.height,scrollPosition.y,window.innerHeight);
			window.scrollTo(scrollPosition.x + (endX - scrollPosition.x) * t,scrollPosition.y + (endY - scrollPosition.y) * t);
			if(t < 1) {
				self.idRequestFrame = self.requestAnimationFrame.call(window,drawFrame);
			}
		};
	drawFrame();
};

exports.PageScroller = PageScroller;

})();
