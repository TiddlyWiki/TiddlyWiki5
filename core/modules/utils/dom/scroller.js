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

var slowInSlowOut = function(t) {
	return (1 - ((Math.cos(t * Math.PI) + 1) / 2));
};

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
Smoothly scroll an element back into view if needed
*/
Scroller.prototype.scrollIntoView = function(element) {
	var scrollPosition = $tw.utils.getScrollPosition(),
		elementBounds = element.getBoundingClientRect();
	this.cancel();
	this.startTime = new Date();
	this.startX = scrollPosition.x;
	this.startY = scrollPosition.y;
	this.endX = elementBounds.left + scrollPosition.x;
	this.endY = elementBounds.top + scrollPosition.y;
	if((this.endX < this.startX) || (this.endX > (this.startX + window.innerWidth)) || (this.endY < this.startY) || (this.endY > (this.startY + window.innerHeight))) {
		var self = this;
		this.timerId = window.setInterval(function() {
			var t = ((new Date()) - self.startTime) / $tw.config.preferences.animationDuration;
			if(t >= 1) {
				self.cancel();
				t = 1;
			}
			t = slowInSlowOut(t);
			window.scrollTo(self.startX + (self.endX - self.startX) * t,self.startY + (self.endY - self.startY) * t);
		}, 10);
	}
};

exports.Scroller = Scroller;

})();
