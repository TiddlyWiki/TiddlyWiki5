/*\
title: $:/core/modules/macros/story/views/classic.js
type: application/javascript
module-type: storyview

A storyview that shows a sequence of tiddlers and navigates by smoothly scrolling

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

function slowInSlowOut(t) {
	return (1 - ((Math.cos(t * Math.PI) + 1) / 2));
}

function animateScroll(startX,startY,endX,endY,duration) {
	var startTime = new Date(),
		timerId = window.setInterval(function() {
			var t = ((new Date()) - startTime) / duration;
			if(t >= 1) {
				window.clearInterval(timerId);
				t = 1;
			}
			t = slowInSlowOut(t);
			var x = startX + (endX - startX) * t,
				y = startY + (endY - startY) * t;
			window.scrollTo(x,y);
		}, 10);
}

/*
Smoothly scroll an element back into view if needed
*/
function scrollIntoView(element) {
	var x = element.offsetLeft,
		y = element.offsetTop,
		winWidth = window.innerWidth,
		winHeight = window.innerHeight,
		scrollLeft = window.scrollX || document.documentElement.scrollLeft,
		scrollTop = window.scrollY || document.documentElement.scrollTop;
	if((x < scrollLeft) || (x > (scrollLeft + winWidth)) || (y < scrollTop) || (y > (scrollTop + winHeight))) {
		animateScroll(scrollLeft,scrollTop,x,y,$tw.config.preferences.animationDuration);
	}
}

function ClassicScroller(story) {
	this.story = story;
}

/*
Visualise navigation to the specified tiddler macro, optionally specifying a source node for the visualisation
	targetTiddlerNode: tree node of the tiddler macro we're navigating to
	isNew: true if the node we're navigating to has just been added to the DOM
	sourceNode: optional tree node that initiated the navigation
*/
ClassicScroller.prototype.navigate = function(targetTiddlerNode,isNew,sourceEvent) {
	scrollIntoView(targetTiddlerNode.domNode);
};

exports.classic = ClassicScroller;

})();
