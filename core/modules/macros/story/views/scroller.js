/*\
title: $:/core/modules/macros/story/views/scroller.js
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

function animate(animList,duration) {
	var startTime = new Date(),
		timerId = window.setInterval(function() {
			var t = ((new Date()) - startTime) / duration;
			if(t >= 1) {
				window.clearInterval(timerId);
				t = 1;
			}
			t = slowInSlowOut(t);
			for(var a=0; a<animList.length; a++) {
				var anim = animList[a];
				document.body[anim.property] = anim.from + (anim.to - anim.from) * t;
			}
		}, 10);
}

/*
Check if the top left corner of a given element is currently visible, given the scroll position
*/
function isVisible(element) {
	var x = element.offsetLeft, y = element.offsetTop;
	return (x >= document.body.scrollLeft) && 
			(x < (document.body.scrollLeft + window.innerHeight)) &&
			(y >= document.body.scrollTop) &&
			(y < (document.body.scrollTop + window.innerHeight));
}

/*
Smoothly scroll an element back into view if needed
*/
function scrollIntoView(element) {
	if(!isVisible(element)) {
		animate([
			{property: "scrollLeft", from: document.body.scrollLeft, to: element.offsetLeft},
			{property: "scrollTop", from: document.body.scrollTop, to: element.offsetTop}
		],$tw.config.preferences.animationDuration);
	}
}

function Scroller(story) {
	this.story = story;
}

/*
Visualise navigation to the specified tiddler macro, optionally specifying a source node for the visualisation
	targetTiddlerNode: tree node of the tiddler macro we're navigating to
	isNew: true if the node we're navigating to has just been added to the DOM
	sourceNode: optional tree node that initiated the navigation
*/
Scroller.prototype.navigate = function(targetTiddlerNode,isNew,sourceEvent) {
	scrollIntoView(targetTiddlerNode.domNode);
};

exports.scroller = Scroller;

})();
