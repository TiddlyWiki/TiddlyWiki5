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
Creates a Scroller object
*/
var Scroller = function() {
};

Scroller.prototype.cancel = function() {
	if(this.timerId) {
		window.clearInterval(this.timerId);
		this.timerId = null;
	}
};

/*
Smoothly scroll an tree node into view if needed
*/
Scroller.prototype.scrollIntoView = function(domNode) {
	// Get the offset bounds of the element
	var bounds = {
			left: domNode.offsetLeft,
			top: domNode.offsetTop,
			width: domNode.offsetWidth,
			height: domNode.offsetHeight
		};
	// Walk up the tree adjusting the offset bounds by each offsetParent
	while(domNode.offsetParent) {
		domNode = domNode.offsetParent;
		// If the node is scrollable, tell it to scroll
		if(domNode.scrollTo) {
			domNode.scrollTo(bounds);
			return;
		}
		bounds.left += domNode.offsetLeft;
		bounds.top += domNode.offsetTop;
	}
	// If we got to the top of the tree then we need to scroll the body
	var scrollPosition = $tw.utils.getScrollPosition();
	this.cancel();
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
				self.cancel();
				t = 1;
			}
			t = $tw.utils.slowInSlowOut(t);
			window.scrollTo(self.startX + (self.endX - self.startX) * t,self.startY + (self.endY - self.startY) * t);
		}, 10);
	}
};

exports.Scroller = Scroller;

})();
