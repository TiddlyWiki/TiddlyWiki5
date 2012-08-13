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
	e.style.width = "32em";
	//need to set the heights for each page
	//massive fudge factor for all the paddings, will remove when there are a few more div layers
	//TODO: set up a $.resize(function(){}); to automate this
	//TODO: oh FFS. use css classes and this all becomes trivial.
	e.style.height = document.documentElement.clientHeight-(150)+"px";
	e.style.verticalAlign = "top";
	e.style.whiteSpace = "normal";
	//put the vertical scrollbar near to the content
  e.style["overflow-y"] = "auto";
}

function SidewaysView(story) {
	this.story = story;
	var wrapper = this.story.child.domNode;
	wrapper.className += " storyViewSideways";
	// Scroll horizontally
	wrapper.style.whiteSpace = "nowrap";
	// Make all the tiddlers the same height, and a good reading width
	for(var t=0; t<wrapper.children.length; t++) {
		setStoryElementStyles(wrapper.children[t]);
	}
}

/*
Visualise navigation to a new tiddler
	toStoryElementNode: tree node of the tiddler macro we're navigating to
	fromStoryElementNode: optionally, tree node of the tiddler we're navigating from
	historyInfo: record from the history tiddler corresponding to this navigation
*/
SidewaysView.prototype.navigateForward = function(toStoryElement,fromStoryElement,historyInfo) {
	$tw.scroller.scrollIntoView(toStoryElement.domNode);
};

/*
Visualise insertion of the specified tiddler macro, optionally specifying a source node for the visualisation
	storyElementNode: tree node of the tiddler macro we're navigating to
*/
SidewaysView.prototype.insert = function(storyElementNode) {
	setStoryElementStyles(storyElementNode.domNode);
	$tw.scroller.scrollIntoView(storyElementNode.domNode);
};

SidewaysView.prototype.remove = function(storyElementNode) {
	var targetElement = storyElementNode.domNode;
	// Get the current width of the tiddler
	var currWidth = targetElement.offsetWidth;
	// Put a wrapper around the dom node we're closing
	var wrapperElement = document.createElement("div");
	targetElement.parentNode.insertBefore(wrapperElement,targetElement);
	wrapperElement.appendChild(targetElement);
	// Animate the closure
	var d = $tw.config.preferences.animationDuration + "ms";
	wrapperElement.style.display = "inline-block";
	wrapperElement.style[$tw.browser.transformorigin] = "0% 0%";
	wrapperElement.style[$tw.browser.transform] = "translateY(0px)";
	wrapperElement.style.opacity = "1.0";
	wrapperElement.style.width = currWidth + "px";
	wrapperElement.style[$tw.browser.transition] = "-" + $tw.browser.prefix.toLowerCase() + "-transform " + d + " ease-in-out, " +
															"opacity " + d + " ease-out, " +
															"width " + d + " ease-in-out";
	// Attach an event handler for th eend of the transition
	wrapperElement.addEventListener($tw.browser.transitionEnd,function(event) {
		if(wrapperElement.parentNode) {
			wrapperElement.parentNode.removeChild(wrapperElement);
		}
	},true);
	// Animate
	$tw.utils.forceLayout(wrapperElement);
	wrapperElement.style[$tw.browser.transform] = "translateY(" + window.innerHeight + "px)";
	wrapperElement.style.opacity = "0.0";
	wrapperElement.style.width = "0px";
	// Returning true causes the DOM node not to be deleted
	return true;
};

exports.sideways = SidewaysView;

})();
