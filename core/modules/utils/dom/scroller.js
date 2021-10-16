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

PageScroller.prototype.isScrolling = function() {
	return this.idRequestFrame !== null;
}

PageScroller.prototype.cancelScroll = function(srcWindow) {
	if(this.idRequestFrame) {
		this.cancelAnimationFrame.call(srcWindow,this.idRequestFrame);
		this.idRequestFrame = null;
	}
};

/*
Handle an event
*/
PageScroller.prototype.handleEvent = function(event) {
	if(event.type === "tm-scroll") {
		if(event.paramObject && event.paramObject.selector) {
			this.scrollSelectorIntoView(null,event.paramObject.selector);
		} else {
			this.scrollIntoView(event.target);
		}
		return false; // Event was handled
	}
	return true;
};

/*
Handle a scroll event hitting the page document
*/
PageScroller.prototype.scrollIntoView = function(element,callback) {
	var self = this,
		duration = $tw.utils.getAnimationDuration(),
	    srcWindow = element ? element.ownerDocument.defaultView : window;
	// Now get ready to scroll the body
	this.cancelScroll(srcWindow);
	this.startTime = Date.now();
	// Get the height of any position:fixed toolbars
	var toolbar = srcWindow.document.querySelector(".tc-adjust-top-of-scroll"),
		offset = 0;
	if(toolbar) {
		offset = toolbar.offsetHeight;
	}
	// Get the client bounds of the element and adjust by the scroll position
	var getBounds = function() {
			var clientBounds = typeof callback === 'function' ? callback() : element.getBoundingClientRect(),
				scrollPosition = $tw.utils.getScrollPosition(srcWindow);
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
				self.cancelScroll(srcWindow);
				t = 1;
			}
			t = $tw.utils.slowInSlowOut(t);
			var scrollPosition = $tw.utils.getScrollPosition(srcWindow),
				bounds = getBounds(),
				endX = getEndPos(bounds.left,bounds.width,scrollPosition.x,srcWindow.innerWidth),
				endY = getEndPos(bounds.top,bounds.height,scrollPosition.y,srcWindow.innerHeight);
			srcWindow.scrollTo(scrollPosition.x + (endX - scrollPosition.x) * t,scrollPosition.y + (endY - scrollPosition.y) * t);
			if(t < 1) {
				self.idRequestFrame = self.requestAnimationFrame.call(srcWindow,drawFrame);
			}
		};
	drawFrame();
};

PageScroller.prototype.scrollSelectorIntoView = function(baseElement,selector,callback) {
	baseElement = baseElement || document.body;
	var element = baseElement.querySelector(selector);
	if(element) {
		this.scrollIntoView(element,callback);
	}
};

exports.PageScroller = PageScroller;

})();
