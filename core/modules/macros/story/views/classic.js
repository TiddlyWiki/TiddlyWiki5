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

exports.classic = ClassicScroller;

})();
