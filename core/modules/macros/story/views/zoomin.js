/*\
title: $:/core/modules/macros/story/views/zoomin.js
type: application/javascript
module-type: storyview

A storyview that shows a single tiddler and navigates by zooming into links

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false, Node: false */
"use strict";

function Zoomin(story) {
	// Save the story
	this.story = story;
	this.storyNode = this.story.child.domNode;
	// Make all the tiddlers position absolute, and hide all but the first one
	this.storyNode.style.position = "relative";
	for(var t=0; t<this.storyNode.children.length; t++) {
		if(t) {
			this.storyNode.children[t].style.display = "none";
		}
		this.storyNode.children[t].style.position = "absolute";
	}
	// Record the current tiddler node
	this.currTiddler = this.story.child.children[0];
	// Set up the stack of previously viewed tiddlers
	this.prevTiddlers = [this.currTiddler.children[0].params.target];
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
Visualise removal of the the specified tiddler macro, optionally specifying a source node for the visualisation
	storyElementNode: tree node of the tiddler macro we're navigating to
*/
Zoomin.prototype.navigateForward = function(storyElementNode,historyInfo) {
	// Do nothing if the target tiddler is already the current tiddler
	if(storyElementNode === this.currTiddler) {
		return;
	}
	// Make the new tiddler be position absolute and visible
	storyElementNode.domNode.style.position = "absolute";
	storyElementNode.domNode.style.display = "block";
	storyElementNode.domNode.style[$tw.browser.transformorigin] = "0 0";
	storyElementNode.domNode.style[$tw.browser.transform] = "translateX(0px) translateY(0px) scale(1)";
	storyElementNode.domNode.style[$tw.browser.transition] = "none";
	// Get the position of the source node, or use the centre of the window as the source position
	var sourceBounds = historyInfo.fromPosition || {
			left: window.innerWidth/2 - 2,
			top: window.innerHeight/2 - 2,
			width: 4,
			height: 4
		};
	// Try to find the title node in the target tiddler
	var titleNode = findTitleNode(storyElementNode) || storyElementNode;
	// Compute the transform for the target tiddler to make the title lie over the source rectange
	var targetBounds = storyElementNode.getNodeBounds(),
		titleBounds = titleNode.getNodeBounds(),
		scale = sourceBounds.width / titleBounds.width,
		x = sourceBounds.left - targetBounds.left - (titleBounds.left - targetBounds.left) * scale,
		y = sourceBounds.top - targetBounds.top - (titleBounds.top - targetBounds.top) * scale;
	// Transform the target tiddler
	storyElementNode.domNode.style[$tw.browser.transform] = "translateX(" + x + "px) translateY(" + y + "px) scale(" + scale + ")";
	// Get the animation duration
	var d = ($tw.config.preferences.animationDuration/1000).toFixed(8) + "s";
	// Apply the ending transitions with a timeout to ensure that the previously applied transformations are applied first
	var self = this,
		currTiddler = this.currTiddler;
	$tw.utils.nextTick(function() {
		// Transform the target tiddler
		var currTiddlerBounds = currTiddler.getNodeBounds(),
			x = (currTiddlerBounds.left - targetBounds.left),
			y = (currTiddlerBounds.top - targetBounds.top);
		storyElementNode.domNode.style[$tw.browser.transition] = "-" + $tw.browser.prefix.toLowerCase() + "-transform " + d + " ease-in-out, opacity " + d + " ease-out";
		storyElementNode.domNode.style.opacity = "1.0";
		storyElementNode.domNode.style[$tw.browser.transform] = "translateX(" + x + "px) translateY(" + y + "px) scale(1)";
		storyElementNode.domNode.style.zIndex = "500";
		// Transform the current tiddler
		var scale = titleBounds.width / sourceBounds.width;
		x =  titleBounds.left - targetBounds.left - (sourceBounds.left - currTiddlerBounds.left) * scale;
		y =  titleBounds.top - targetBounds.top - (sourceBounds.top - currTiddlerBounds.top) * scale;
		currTiddler.domNode.style[$tw.browser.transition] = "-" + $tw.browser.prefix.toLowerCase() + "-transform " + d + " ease-in-out, opacity " + d + " ease-out";
		currTiddler.domNode.style.opacity = "0.0";
		currTiddler.domNode.style[$tw.browser.transformorigin] = "0 0";
		currTiddler.domNode.style[$tw.browser.transform] = "translateX(" + x + "px) translateY(" + y + "px) scale(" + scale + ")";
		currTiddler.domNode.style.zIndex = "0";
	});
	// Record the new current tiddler
	this.currTiddler = storyElementNode;
	// Save the tiddler in the stack
	this.prevTiddlers.push(storyElementNode.children[0].params.target);
};

/*
Visualise removing a tiddler
*/
Zoomin.prototype.remove = function(storyElementNode) {
	// Remove the last entry from the navigation stack, which will be to navigate to the current tiddler
	this.prevTiddlers.pop();
	// Find the top entry in the navigation stack that still exists
	var storyElementIndex,storyElement;
	while(this.prevTiddlers.length > 0) {
		var title = this.prevTiddlers.pop();
		storyElementIndex = this.story.findStoryElementByTitle(0,title);
		if(storyElementIndex !== undefined) {
			break;
		}
	}
	if(storyElementIndex !== undefined) {
		storyElement = this.story.storyNode.children[storyElementIndex];
	}
	// Get the animation duration
	var d = ($tw.config.preferences.animationDuration/1000).toFixed(8) + "s";
	// Set up the tiddler that is being closed
	storyElementNode.domNode.style.position = "absolute";
	storyElementNode.domNode.style.display = "block";
	storyElementNode.domNode.style[$tw.browser.transformorigin] = "50% 50%";
	storyElementNode.domNode.style[$tw.browser.transform] = "translateX(0px) translateY(0px) scale(1)";
	storyElementNode.domNode.style[$tw.browser.transition] = "none";
	storyElementNode.domNode.style.zIndex = "0";
	// Set up the tiddler we're moving back in
	if(storyElement !== undefined) {
		storyElement.domNode.style.position = "absolute";
		storyElement.domNode.style.display = "block";
		storyElement.domNode.style[$tw.browser.transformorigin] = "50% 50%";
		storyElement.domNode.style[$tw.browser.transform] = "translateX(0px) translateY(0px) scale(10)";
		storyElement.domNode.style[$tw.browser.transition] = "-" + $tw.browser.prefix.toLowerCase() + "-transform " + d + " ease-in-out, opacity " + d + " ease-out";
		storyElement.domNode.style.opacity = "0.0";
		storyElement.domNode.style.zIndex = "500";
		// Push the tiddler we're moving back to back on the stack
		this.prevTiddlers.push(storyElement.children[0].params.target);
		this.currTiddler = storyElement;
	} else {
		this.currTiddler = null;
	}
	// Animate them both
	$tw.utils.nextTick(function() {
		// First, the tiddler we're closing
		storyElementNode.domNode.style[$tw.browser.transition] = "-" + $tw.browser.prefix.toLowerCase() + "-transform " + d + " ease-in-out, opacity " + d + " ease-out";
		storyElementNode.domNode.style.opacity = "0.0";
		storyElementNode.domNode.style[$tw.browser.transformorigin] = "50% 50%";
		storyElementNode.domNode.style[$tw.browser.transform] = "translateX(0px) translateY(0px) scale(0.1)";
		storyElementNode.domNode.style.zIndex = "0";
		storyElementNode.domNode.addEventListener($tw.browser.transitionEnd,function(event) {
			// Delete the DOM node when the transition is over
			if(storyElementNode.domNode.parentNode) {
				storyElementNode.domNode.parentNode.removeChild(storyElementNode.domNode);
			}
		},true);
		// Now the tiddler we're going back to
		if(storyElement !== undefined) {
			storyElement.domNode.style[$tw.browser.transform] = "translateX(0px) translateY(0px) scale(1)";
			storyElement.domNode.style.opacity = "1.0";
		}
	});
	return true; // Indicate that we'll delete the DOM node
};

exports.zoomin = Zoomin;

})();
