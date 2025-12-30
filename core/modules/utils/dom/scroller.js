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
Find the scrollable ancestor of an element
Returns the first ancestor with overflow-y: auto|scroll, or null if none found
*/
PageScroller.prototype.getScrollContainer = function(element,srcWindow) {
	var node = element.parentElement;
	while(node) {
		var style = srcWindow.getComputedStyle(node);
		var overflowY = style.getPropertyValue("overflow-y");
		if(overflowY === "auto" || overflowY === "scroll") {
			return node;
		}
		node = node.parentElement;
	}
	return null;
};

/*
Get scroll-margin value from element's computed style
*/
PageScroller.prototype.getScrollMargin = function(element,srcWindow,propertyValue) {
	var style = srcWindow.getComputedStyle(element);
	var scrollMargin = style.getPropertyValue(propertyValue);
	return parseFloat(scrollMargin) || 0;
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
Handle a scroll event hitting the page document
*/
PageScroller.prototype.scrollIntoView = function(element,callback,options) {
	var self = this,
		duration = $tw.utils.hop(options,"animationDuration") ? parseInt(options.animationDuration) : $tw.utils.getAnimationDuration(),
		srcWindow = element ? element.ownerDocument.defaultView : window,
		scrollContainer = this.getScrollContainer(element,srcWindow),
		scrollMarginTop = this.getScrollMargin(element,srcWindow,"scroll-margin-top"),
		scrollMarginLeft = this.getScrollMargin(element,srcWindow,"scroll-margin-left");
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
			var clientBounds = typeof callback === "function" ? callback() : element.getBoundingClientRect();
			if(scrollContainer) {
				// Position relative to scroll container
				var containerBounds = scrollContainer.getBoundingClientRect();
				return {
					left: clientBounds.left - containerBounds.left + scrollContainer.scrollLeft - scrollMarginLeft,
					top: clientBounds.top - containerBounds.top + scrollContainer.scrollTop - offset - scrollMarginTop,
					width: clientBounds.width,
					height: clientBounds.height
				};
			} else {
				// Position relative to window
				var scrollPosition = $tw.utils.getScrollPosition(srcWindow);
				return {
					left: clientBounds.left + scrollPosition.x,
					top: clientBounds.top + scrollPosition.y - offset - scrollMarginTop,
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
			var bounds = getBounds(),
				scrollX,scrollY,viewportWidth,viewportHeight,endX,endY;
			if(scrollContainer) {
				scrollX = scrollContainer.scrollLeft;
				scrollY = scrollContainer.scrollTop;
				viewportWidth = scrollContainer.clientWidth;
				viewportHeight = scrollContainer.clientHeight;
			} else {
				var scrollPosition = $tw.utils.getScrollPosition(srcWindow);
				scrollX = scrollPosition.x;
				scrollY = scrollPosition.y;
				viewportWidth = srcWindow.innerWidth;
				viewportHeight = srcWindow.innerHeight;
			}
			endX = getEndPos(bounds.left,bounds.width,scrollX,viewportWidth);
			endY = getEndPos(bounds.top,bounds.height,scrollY,viewportHeight);
			var newX = scrollX + (endX - scrollX) * t,
				newY = scrollY + (endY - scrollY) * t;
			if(scrollContainer) {
				scrollContainer.scrollLeft = newX;
				scrollContainer.scrollTop = newY;
			} else {
				srcWindow.scrollTo(newX,newY);
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
