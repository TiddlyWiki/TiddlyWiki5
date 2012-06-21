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
	$tw.utils.scrollIntoView(targetTiddlerNode.domNode);
};

ClassicScroller.prototype.close = function(targetTiddlerNode,sourceEvent) {
	var targetElement = targetTiddlerNode.domNode;
	// Get the current height of the tiddler
	var currHeight = targetElement.offsetHeight;
	// Put a wrapper around the dom node we're closing
	var wrapperElement = document.createElement("div");
	targetElement.parentNode.insertBefore(wrapperElement,targetElement);
	wrapperElement.appendChild(targetElement);
	// Animate the closure
	var d = ($tw.config.preferences.animationDuration/1000).toFixed(8) + "s"
	wrapperElement.style[$tw.browser.transformorigin] = "0% 0%";
	wrapperElement.style[$tw.browser.transform] = "translateX(0px)";
	wrapperElement.style.opacity = "1.0";
	wrapperElement.style.height = currHeight + "px";
	wrapperElement.style[$tw.browser.transition] = "-" + $tw.browser.prefix.toLowerCase() + "-transform " + d + " ease-in-out, " +
															"opacity " + d + " ease-out, " +
															"height " + d + " ease-in-out";
	$tw.utils.nextTick(function() {
		wrapperElement.style[$tw.browser.transform] = "translateX(" + window.innerWidth + "px)";
		wrapperElement.style.opacity = "0.0";
		wrapperElement.style.height = "0px";
	});
	// Attach an event handler for th eend of the transition
	wrapperElement.addEventListener("webkitTransitionEnd",function(event) {
		if(wrapperElement.parentNode) {
			wrapperElement.parentNode.removeChild(wrapperElement);
		}
	},true);
	// Returning true causes the DOM node not to be deleted
	return true;
};

exports.classic = ClassicScroller;

})();
