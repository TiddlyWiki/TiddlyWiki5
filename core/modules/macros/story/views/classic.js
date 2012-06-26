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

ClassicScroller.prototype.remove = function(storyElementNode) {
	var targetElement = storyElementNode.domNode;
	// Get the current height of the tiddler
	var currHeight = targetElement.offsetHeight;
	// Put a wrapper around the dom node we're closing
	var wrapperElement = document.createElement("div");
	targetElement.parentNode.insertBefore(wrapperElement,targetElement);
	wrapperElement.appendChild(targetElement);
	// Attach an event handler for the end of the transition
	wrapperElement.addEventListener($tw.browser.transitionEnd,function(event) {
		if(wrapperElement.parentNode) {
			wrapperElement.parentNode.removeChild(wrapperElement);
		}
	},false);
	// Animate the closure
	var d = ($tw.config.preferences.animationDuration/1000).toFixed(8) + "s";
	wrapperElement.style[$tw.browser.transition] = "-" + $tw.browser.prefix.toLowerCase() + "-transform " + d + " ease-in-out, " +
															"opacity " + d + " ease-out, " +
															"height " + d + " ease-in-out";
	wrapperElement.style[$tw.browser.transformorigin] = "0% 0%";
	wrapperElement.style[$tw.browser.transform] = "translateX(0px)";
	wrapperElement.style.opacity = "1.0";
	wrapperElement.style.height = currHeight + "px";
	$tw.utils.nextTick(function() {
		wrapperElement.style[$tw.browser.transform] = "translateX(" + window.innerWidth + "px)";
		wrapperElement.style.opacity = "0.0";
		wrapperElement.style.height = "0px";
	});
	// Returning true causes the DOM node not to be deleted
	return true;
};

ClassicScroller.prototype.navigateBack = function(storyElementNode,historyInfo) {
	$tw.utils.scrollIntoView(storyElementNode.domNode);
};

ClassicScroller.prototype.navigateForward = function(storyElementNode,historyInfo) {
	$tw.utils.scrollIntoView(storyElementNode.domNode);
};

exports.classic = ClassicScroller;

})();
