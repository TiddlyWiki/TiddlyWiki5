/*\
title: $:/core/modules/utils/dom/scroller.js
type: application/javascript
module-type: utils

Module that creates a $tw.utils.Scroller object prototype that manages scrolling in the browser

\*/

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
		var options = {};
		if($tw.utils.hop(event.paramObject,"animationDuration")) {
			options.animationDuration = event.paramObject.animationDuration;
		}
		if(event.paramObject && event.paramObject.selector) {
			this.scrollSelectorIntoView(null,event.paramObject.selector,null,options);
		} else {
			this.scrollIntoView(event.target,null,options);
		}
		return false; // Event was handled
	}
	return true;
};

/*
Find the scrollable parent of an element
*/
PageScroller.prototype.findScrollableParent = function(element) {
	if(!element) {
		return window;
	}
	var parent = element.parentElement;
	while(parent) {
		var overflowY = window.getComputedStyle(parent).overflowY;
		var isScrollable = overflowY === "auto" || overflowY === "scroll";
		if(isScrollable && parent.scrollHeight > parent.clientHeight) {
			return parent;
		}
		parent = parent.parentElement;
	}
	return window;
};

/*
Handle a scroll event hitting the page document
*/
PageScroller.prototype.scrollIntoView = function(element,callback,options) {
	var self = this,
		duration = $tw.utils.hop(options,"animationDuration") ? parseInt(options.animationDuration) : $tw.utils.getAnimationDuration(),
		srcWindow = element ? element.ownerDocument.defaultView : window;
	// Find the scrollable parent
	var scrollContainer = this.findScrollableParent(element);
	var isWindowScroll = scrollContainer === window || scrollContainer === srcWindow;
	// Now get ready to scroll the body
	this.cancelScroll(srcWindow);
	this.startTime = Date.now();
	// Get the height of any position:fixed toolbars
	var toolbar = srcWindow.document.querySelector(".tc-adjust-top-of-scroll"),
		offset = 0;
	if(toolbar) {
		offset = toolbar.offsetHeight;
	}
	// Get the scroll-margin-top value from the element
	var scrollMarginTop = 0;
	if(element) {
		var computedStyle = srcWindow.getComputedStyle(element);
		var marginTop = computedStyle.getPropertyValue("scroll-margin-top");
		if(marginTop) {
			scrollMarginTop = parseFloat(marginTop) || 0;
		}
	}
	// Get the client bounds of the element and adjust by the scroll position
	var getBounds = function() {
			var clientBounds = typeof callback === 'function' ? callback() : element.getBoundingClientRect(),
				scrollPosition;
			
			if(isWindowScroll) {
				scrollPosition = $tw.utils.getScrollPosition(srcWindow);
				return {
					left: clientBounds.left + scrollPosition.x,
					top: clientBounds.top + scrollPosition.y - offset - scrollMarginTop,
					width: clientBounds.width,
					height: clientBounds.height
				};
			} else {
				// For container scroll, calculate position relative to container
				var containerBounds = scrollContainer.getBoundingClientRect();
				scrollPosition = {
					x: scrollContainer.scrollLeft,
					y: scrollContainer.scrollTop
				};
				return {
					left: clientBounds.left - containerBounds.left + scrollPosition.x,
					top: clientBounds.top - containerBounds.top + scrollPosition.y - offset - scrollMarginTop,
					width: clientBounds.width,
					height: clientBounds.height
				};
			}
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
			var scrollPosition, bounds, endX, endY, viewportWidth, viewportHeight;
			
			if(isWindowScroll) {
				scrollPosition = $tw.utils.getScrollPosition(srcWindow);
				bounds = getBounds();
				viewportWidth = srcWindow.innerWidth;
				viewportHeight = srcWindow.innerHeight;
				endX = getEndPos(bounds.left,bounds.width,scrollPosition.x,viewportWidth);
				endY = getEndPos(bounds.top,bounds.height,scrollPosition.y,viewportHeight);
				srcWindow.scrollTo(scrollPosition.x + (endX - scrollPosition.x) * t,scrollPosition.y + (endY - scrollPosition.y) * t);
			} else {
				scrollPosition = {
					x: scrollContainer.scrollLeft,
					y: scrollContainer.scrollTop
				};
				bounds = getBounds();
				viewportWidth = scrollContainer.clientWidth;
				viewportHeight = scrollContainer.clientHeight;
				endX = getEndPos(bounds.left,bounds.width,scrollPosition.x,viewportWidth);
				endY = getEndPos(bounds.top,bounds.height,scrollPosition.y,viewportHeight);
				scrollContainer.scrollLeft = scrollPosition.x + (endX - scrollPosition.x) * t;
				scrollContainer.scrollTop = scrollPosition.y + (endY - scrollPosition.y) * t;
			}
			
			if(t < 1) {
				self.idRequestFrame = self.requestAnimationFrame.call(srcWindow,drawFrame);
			}
		};
	drawFrame();
};

PageScroller.prototype.scrollSelectorIntoView = function(baseElement,selector,callback,options) {
	baseElement = baseElement || document;
	var element = $tw.utils.querySelectorSafe(selector,baseElement);
	if(element) {
		this.scrollIntoView(element,callback,options);
	}
};

exports.PageScroller = PageScroller;
