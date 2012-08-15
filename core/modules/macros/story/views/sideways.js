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

//TODO: should make an applyStyleSheet that can leverage templated css? or add hrefs to css - so users can customise


var timeOut = null;
var resizeHeight = function() { 
   clearTimeout(timeOut);
   //set the tw-story-element's height (need to work out the 150, and remove the constant)
   var height = document.documentElement.clientHeight-150;
   $tw.utils.applyStyleSheet('storyViewSideways_height', '.storyViewSideways .tw-story-element {height : '+height+'px; }');
};

function SidewaysView(story) {
	this.story = story;
	
	//add storyView class to 'body' element to enable UI tweaks
	$tw.utils.addClass(document.body, "storyViewSideways");
	
	//TODO: as these are not dynamic, we should really be able to move them out of the code
	// Scroll horizontally
	// hide vertical scrollbar for body, use one inside the stories
	// Make all the tiddlers the same height, and a good reading width
  $tw.utils.applyStyleSheet('storyViewSideways', '.storyViewSideways .tw-story-element {\
    display: inline-block;\
    width: 32em;\
    vertical-align: top;\
    white-space: normal;\
    overflow-y: auto;\
  }\
  .storyViewSideways .tw-story-frame{\
    white-space: nowrap;\
  body.storyViewSideways {\
    overflow-y: hidden;\
  }');
	
  resizeHeight();
  window.onresize = function(){
     if(timeOut != null) clearTimeout(timeOut);
     timeOut = setTimeout(resizeHeight, 100);
  };
}

SidewaysView.prototype.removeView = function() {
	$tw.utils.removeClass(document.body, "storyViewSideways");
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
