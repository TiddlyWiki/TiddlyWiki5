/*\
title: $:/core/modules/macros/story/views/zoomin.js
type: application/javascript
module-type: storyview

A storyview that shows a single tiddler and navigates by zooming into links.

To do this, the story wrapper is set to `position:relative` and then each of the story elements to `position:absolute`. This results in all of the tiddlers being stacked on top of one another flush with the top left of the story wrapper.

Navigating between tiddlers is accomplished by switching the story nodes between `display:block` and `display:none`, but the implementation is considerably more complex due to the animation.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false, Node: false */
"use strict";

function Zoomin(story) {
	// Save the story
	this.story = story;
	var wrapper = this.story.child.domNode;
	wrapper.className += " storyViewZoomin";
	
	this.storyNode = this.story.child.domNode;
	// Set the current tiddler
	this.currentTiddler = this.story.child.children[0];
	// Make all the tiddlers position absolute, and hide all but the first one
	this.storyNode.style.position = "relative";
	for(var t=0; t<this.storyNode.children.length; t++) {
		if(t) {
			this.storyNode.children[t].style.display = "none";
		}
		this.storyNode.children[t].style.position = "absolute";
	}
}

/*
Find the first descendent node that is a <<view title>> macro
*/
function findTitleNode(node) {
	var r;
	if(node.macroName && node.macroName === "view" && node.params && node.params.field && node.params.field === "title") {
		return node;
	}
	if(node.children) {
		for(var t=0; t<node.children.length; t++) {
			r = findTitleNode(node.children[t]);
			if(r) {
				return r;
			}
		}
	} else if(node.child) {
		r = findTitleNode(node.child);
		if(r) {
			return r;
		}
	}
	return null;
}

/*
Visualise navigation to a new tiddler
	toStoryElementNode: tree node of the tiddler macro we're navigating to
	fromStoryElementNode: optionally, tree node of the tiddler we're navigating from
	historyInfo: record from the history tiddler corresponding to this navigation
*/
Zoomin.prototype.navigateForward = function(toStoryElement,fromStoryElement,historyInfo) {
	// Make the new tiddler be position absolute and visible so that we can measure it
	toStoryElement.domNode.style.position = "absolute";
	toStoryElement.domNode.style.display = "block";
	toStoryElement.domNode.style[$tw.browser.transformorigin] = "0 0";
	toStoryElement.domNode.style[$tw.browser.transform] = "translateX(0px) translateY(0px) scale(1)";
	toStoryElement.domNode.style[$tw.browser.transition] = "none";
	toStoryElement.domNode.style.opacity = "0.0";
	// Get the position of the source node, or use the centre of the window as the source position
	var sourceBounds = historyInfo.fromPosition || {
			left: window.innerWidth/2 - 2,
			top: window.innerHeight/2 - 2,
			width: window.innerWidth/8,
			height: window.innerHeight/8
		};
	// Try to find the title node in the target tiddler
	var titleNode = findTitleNode(toStoryElement) || toStoryElement,
		titleBounds = titleNode.getNodeBounds();
	// Compute the transform for the target tiddler to make the title lie over the source rectange
	var targetBounds = toStoryElement.getNodeBounds(),
		scale = sourceBounds.width / titleBounds.width,
		x = sourceBounds.left - targetBounds.left - (titleBounds.left - targetBounds.left) * scale,
		y = sourceBounds.top - targetBounds.top - (titleBounds.top - targetBounds.top) * scale;
	// Transform the target tiddler to its starting position
	toStoryElement.domNode.style[$tw.browser.transform] = "translateX(" + x + "px) translateY(" + y + "px) scale(" + scale + ")";
	// Get the animation duration
	var d = $tw.config.preferences.animationDuration + "ms";
	// Apply the ending transitions with a timeout to ensure that the previously applied transformations are applied first
	var self = this,
		prevCurrentTiddler = this.currentTiddler;
	this.currentTiddler = toStoryElement;
	// Force layout
	$tw.utils.forceLayout(this.storyNode);
	// Transform the target tiddler to its natural size
	toStoryElement.domNode.style[$tw.browser.transition] = "-" + $tw.browser.prefix.toLowerCase() + "-transform " + d + " ease-in-out, opacity " + d + " ease-out";
	toStoryElement.domNode.style.opacity = "1.0";
	toStoryElement.domNode.style[$tw.browser.transform] = "translateX(0px) translateY(0px) scale(1)";
	toStoryElement.domNode.style.zIndex = "500";
	// Transform the previous tiddler out of the way and then hide it
	if(prevCurrentTiddler && prevCurrentTiddler !== toStoryElement) {
		scale = titleBounds.width / sourceBounds.width;
		x =  titleBounds.left - targetBounds.left - (sourceBounds.left - targetBounds.left) * scale;
		y =  titleBounds.top - targetBounds.top - (sourceBounds.top - targetBounds.top) * scale;
		prevCurrentTiddler.domNode.style[$tw.browser.transition] = "-" + $tw.browser.prefix.toLowerCase() + "-transform " + d + " ease-in-out, opacity " + d + " ease-out";
		prevCurrentTiddler.domNode.style.opacity = "0.0";
		prevCurrentTiddler.domNode.style[$tw.browser.transformorigin] = "0 0";
		prevCurrentTiddler.domNode.style[$tw.browser.transform] = "translateX(" + x + "px) translateY(" + y + "px) scale(" + scale + ")";
		prevCurrentTiddler.domNode.style.zIndex = "0";
		var eventHandler = function(event) {
				// Hide the DOM node when the transition is over
				if(self.currentTiddler !== prevCurrentTiddler) {
					prevCurrentTiddler.domNode.style.display = "none";
				}
				prevCurrentTiddler.domNode.removeEventListener($tw.browser.transitionEnd,eventHandler,true);
			};
		prevCurrentTiddler.domNode.addEventListener($tw.browser.transitionEnd,eventHandler,true);
	}
	// Scroll the target into view
	$tw.scroller.scrollIntoView(toStoryElement.domNode);
};

/*
Visualise navigating back to the previous tiddler
	storyElement: story element being closed
*/
Zoomin.prototype.remove = function(storyElement,storyElementIndex) {
	// Get the animation duration
	var d = $tw.config.preferences.animationDuration + "ms";
	// Set up the tiddler that is being closed
		storyElement.domNode.style.position = "absolute";
		storyElement.domNode.style.display = "block";
		storyElement.domNode.style[$tw.browser.transformorigin] = "50% 50%";
		storyElement.domNode.style[$tw.browser.transform] = "translateX(0px) translateY(0px) scale(1)";
		storyElement.domNode.style[$tw.browser.transition] = "none";
		storyElement.domNode.style.zIndex = "0";
	// We'll move back to the previous or next element in the story
	var toStoryElement = this.story.storyNode.children[storyElementIndex - 1];
	if(!toStoryElement) {
		toStoryElement = this.story.storyNode.children[storyElementIndex + 1];
	}
	// Set up the tiddler we're moving back in
	if(toStoryElement) {
		toStoryElement.domNode.style.position = "absolute";
		toStoryElement.domNode.style.display = "block";
		toStoryElement.domNode.style[$tw.browser.transformorigin] = "50% 50%";
		toStoryElement.domNode.style[$tw.browser.transform] = "translateX(0px) translateY(0px) scale(10)";
		toStoryElement.domNode.style[$tw.browser.transition] = "-" + $tw.browser.prefix.toLowerCase() + "-transform " + d + " ease-in-out, opacity " + d + " ease-out";
		toStoryElement.domNode.style.opacity = "0.0";
		toStoryElement.domNode.style.zIndex = "500";
		this.currentTiddler = toStoryElement;
	}
	// Animate them both
	$tw.utils.forceLayout(this.storyNode);
	// First, the tiddler we're closing
	storyElement.domNode.style[$tw.browser.transition] = "-" + $tw.browser.prefix.toLowerCase() + "-transform " + d + " ease-in-out, opacity " + d + " ease-out";
	storyElement.domNode.style.opacity = "0.0";
	storyElement.domNode.style[$tw.browser.transformorigin] = "50% 50%";
	storyElement.domNode.style[$tw.browser.transform] = "translateX(0px) translateY(0px) scale(0.1)";
	storyElement.domNode.style.zIndex = "0";
	var eventHandler = function(event) {
			// Delete the DOM node when the transition is over
			if(storyElement.domNode.parentNode) {
				storyElement.domNode.parentNode.removeChild(storyElement.domNode);
			}
		storyElement.domNode.removeEventListener($tw.browser.transitionEnd,eventHandler,true);
		};
	storyElement.domNode.addEventListener($tw.browser.transitionEnd,eventHandler,true);
	// Now the tiddler we're going back to
	if(toStoryElement) {
		toStoryElement.domNode.style[$tw.browser.transform] = "translateX(0px) translateY(0px) scale(1)";
		toStoryElement.domNode.style.opacity = "1.0";
	}
	return true; // Indicate that we'll delete the DOM node
};

exports.zoomin = Zoomin;

})();
