/*\
title: $:/core/modules/macros/story/zoomin.js
type: application/javascript
module-type: storyview

A storyview that shows a single tiddler and navigates by zooming into links

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

function Zoomin(story) {
	this.story = story;
	var wrapper = this.story.children[0].domNode;
	wrapper.style.position = "relative";
	for(var t=0; t<wrapper.children.length; t++) {
		wrapper.children[t].style.position = "absolute";
	}
}

Zoomin.prototype.tiddlerAdded = function(newTiddlerNode) {
	newTiddlerNode.domNode.style.position = "absolute";
}

exports.zoomin = Zoomin;

})();
