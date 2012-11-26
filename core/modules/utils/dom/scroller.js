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
Event handler for when the `tw-scroll` event hits the document body
*/
var PageScroller = function() {
	this.timerId = null;
};

PageScroller.prototype.cancelScroll = function() {
	if(this.timerId) {
		window.clearInterval(this.timerId);
		this.timerId = null;
	}
};

/*
Handle an event
*/
PageScroller.prototype.handleEvent = function(event) {
	if(event.type === "tw-scroll") {
		return this.handleScrollEvent(event);
	}
	return true;
};

/*
Handle a scroll event hitting the page document
*/
PageScroller.prototype.handleScrollEvent = function(event) {
	// Get the offset bounds of the element
	var domNode = event.target,
		bounds = {
			left: domNode.offsetLeft,
			top: domNode.offsetTop,
			width: domNode.offsetWidth,
			height: domNode.offsetHeight
		};
	// Walk up the tree adjusting the offset bounds by each offsetParent
	while(domNode.offsetParent) {
		domNode = domNode.offsetParent;
		bounds.left += domNode.offsetLeft;
		bounds.top += domNode.offsetTop;
	}
	// Now scroll the body
	var scrollPosition = $tw.utils.getScrollPosition();
	this.cancelScroll();
	this.startTime = new Date();
	this.startX = scrollPosition.x;
	this.startY = scrollPosition.y;
	this.endX = bounds.left;
	this.endY = bounds.top;
	if((this.endX < this.startX) || (this.endX > (this.startX + window.innerWidth)) || (this.endY < this.startY) || (this.endY > (this.startY + window.innerHeight))) {
		var self = this;
		this.timerId = window.setInterval(function() {
			var t = ((new Date()) - self.startTime) / $tw.config.preferences.animationDuration;
			if(t >= 1) {
				self.cancelScroll();
				t = 1;
			}
			t = $tw.utils.slowInSlowOut(t);
			window.scrollTo(self.startX + (self.endX - self.startX) * t,self.startY + (self.endY - self.startY) * t);
		}, 10);
	}
};

exports.PageScroller = PageScroller;

})();
