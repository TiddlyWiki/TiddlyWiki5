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
	e.style.width = "350px";
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
};

exports.sideways = SidewaysView;

})();
