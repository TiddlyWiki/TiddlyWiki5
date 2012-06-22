/*\
title: $:/core/modules/macros/story/views/sideways.js
type: application/javascript
module-type: storyview

A storyview that shows a sequence of tiddlers as horizontally stacked blocks

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

function setStoryElementStyles(e) {
	e.style.display = "inline-block";
	e.style.width = "380px";
	e.style.verticalAlign = "top";
	e.style.whiteSpace = "normal";
}

function SidewaysView(story) {
	this.story = story;
	var wrapper = this.story.child.children[1].domNode;
	// Scroll horizontally
	wrapper.style.whiteSpace = "nowrap";
	// Make all the tiddlers position absolute, and hide all but the first one
	for(var t=0; t<wrapper.children.length; t++) {
		setStoryElementStyles(wrapper.children[t]);
	}
}

/*
Visualise navigation to the specified tiddler macro, optionally specifying a source node for the visualisation
	targetTiddlerNode: tree node of the tiddler macro we're navigating to
	isNew: true if the node we're navigating to has just been added to the DOM
	sourceNode: optional tree node that initiated the navigation
*/
SidewaysView.prototype.navigate = function(targetTiddlerNode,isNew,sourceEvent) {
	setStoryElementStyles(targetTiddlerNode.domNode);
	$tw.utils.scrollIntoView(targetTiddlerNode.domNode);
};

SidewaysView.prototype.close = function(targetTiddlerNode,sourceEvent) {
	var targetElement = targetTiddlerNode.domNode;
	// Get the current width of the tiddler
	var currWidth = targetElement.offsetWidth;
	// Put a wrapper around the dom node we're closing
	var wrapperElement = document.createElement("div");
	targetElement.parentNode.insertBefore(wrapperElement,targetElement);
	wrapperElement.appendChild(targetElement);
	// Animate the closure
	var d = ($tw.config.preferences.animationDuration/1000).toFixed(8) + "s";
	wrapperElement.style.display = "inline-block";
	wrapperElement.style[$tw.browser.transformorigin] = "0% 0%";
	wrapperElement.style[$tw.browser.transform] = "translateY(0px)";
	wrapperElement.style.opacity = "1.0";
	wrapperElement.style.width = currWidth + "px";
	wrapperElement.style[$tw.browser.transition] = "-" + $tw.browser.prefix.toLowerCase() + "-transform " + d + " ease-in-out, " +
															"opacity " + d + " ease-out, " +
															"width " + d + " ease-in-out";
	$tw.utils.nextTick(function() {
		wrapperElement.style[$tw.browser.transform] = "translateY(" + window.innerHeight + "px)";
		wrapperElement.style.opacity = "0.0";
		wrapperElement.style.width = "0px";
	});
	// Attach an event handler for th eend of the transition
	wrapperElement.addEventListener($tw.browser.transitionEnd,function(event) {
		if(wrapperElement.parentNode) {
			wrapperElement.parentNode.removeChild(wrapperElement);
		}
	},true);
	// Returning true causes the DOM node not to be deleted
	return true;
};

exports.sideways = SidewaysView;

})();
