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
const PageScroller = function() {
	this.idRequestFrame = null;
	this.requestAnimationFrame = window.requestAnimationFrame ||
		window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		function(callback) {
			return window.setTimeout(callback,1000 / 60);
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
};

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
		const options = {};
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
	const self = this;
	const duration = $tw.utils.hop(options,"animationDuration") ? parseInt(options.animationDuration) : $tw.utils.getAnimationDuration();
	const srcWindow = element ? element.ownerDocument.defaultView : window;
	// Now get ready to scroll the body
	this.cancelScroll(srcWindow);
	this.startTime = Date.now();
	// Get the height of any position:fixed toolbars
	const toolbar = srcWindow.document.querySelector(".tc-adjust-top-of-scroll");
	let offset = 0;
	if(toolbar) {
		offset = toolbar.offsetHeight;
	}
	// Get the client bounds of the element and adjust by the scroll position
	const getBounds = function() {
		const clientBounds = typeof callback === 'function' ? callback() : element.getBoundingClientRect();
		const scrollPosition = $tw.utils.getScrollPosition(srcWindow);
		return {
			left: clientBounds.left + scrollPosition.x,
			top: clientBounds.top + scrollPosition.y - offset,
			width: clientBounds.width,
			height: clientBounds.height
		};
	};
	// We'll consider the horizontal and vertical scroll directions separately via this function
	// targetPos/targetSize - position and size of the target element
	// currentPos/currentSize - position and size of the current scroll viewport
	// returns: new position of the scroll viewport
	const getEndPos = function(targetPos,targetSize,currentPos,currentSize) {
		let newPos = targetPos;
		// If we are scrolling within 50 pixels of the top/left then snap to zero
		if(newPos < 50) {
			newPos = 0;
		}
		return newPos;
	};
	const drawFrame = function drawFrame() {
		let t;
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
		const scrollPosition = $tw.utils.getScrollPosition(srcWindow);
		const bounds = getBounds();
		const endX = getEndPos(bounds.left,bounds.width,scrollPosition.x,srcWindow.innerWidth);
		const endY = getEndPos(bounds.top,bounds.height,scrollPosition.y,srcWindow.innerHeight);
		srcWindow.scrollTo(scrollPosition.x + (endX - scrollPosition.x) * t,scrollPosition.y + (endY - scrollPosition.y) * t);
		if(t < 1) {
			self.idRequestFrame = self.requestAnimationFrame.call(srcWindow,drawFrame);
		}
	};
	drawFrame();
};

PageScroller.prototype.scrollSelectorIntoView = function(baseElement,selector,callback,options) {
	baseElement = baseElement || document;
	const element = $tw.utils.querySelectorSafe(selector,baseElement);
	if(element) {
		this.scrollIntoView(element,callback,options);
	}
};

exports.PageScroller = PageScroller;
