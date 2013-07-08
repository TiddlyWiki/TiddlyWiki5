/*\
title: $:/core/modules/widgets/list/listviews/zoomin.js
type: application/javascript
module-type: listview

Zooms between individual tiddlers

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var ZoominListView = function(listWidget) {
	this.listWidget = listWidget;
	this.storyNode = this.listWidget.renderer.domNode;
	// Set the current tiddler
	this.currentTiddler = this.listWidget.children[0];
	// Make all the tiddlers position absolute, and hide all but the first one
	this.storyNode.style.position = "relative";
	for(var t=0; t<this.storyNode.children.length; t++) {
		if(t) {
			this.storyNode.children[t].style.display = "none";
		}
		this.storyNode.children[t].style.position = "absolute";
	}
};



/*
Find the first descendent node that is a <$view field="title"> widget
*/
function findTitleNode(node) {
	var t,r;
	// Return true if this node is a view widget with the field attribute set to "title"
	if(node instanceof $tw.WikiRenderTree.prototype.rendererClasses.element) {
		if(node.widget instanceof $tw.WikiRenderTree.prototype.rendererClasses.element.prototype.widgetClasses.view && node.attributes.field === "title") {
			return node;	
		}
		if(node.widget.children) {
			for(t=0; t<node.widget.children.length; t++) {
				var r = findTitleNode(node.widget.children[t]);
				if(r) {
					return r;
				}
			}
		}
	} else {
		if(node.children) {
			for(t=0; t<node.children.length; t++) {
				var r = findTitleNode(node.children[t]);
				if(r) {
					return r;
				}
			}
		}
	}
	return null;
}

ZoominListView.prototype.insert = function(index) {
	var listElementNode = this.listWidget.children[index],
		targetElement = listElementNode.domNode;
	// Make the newly inserted node position absolute and hidden
	$tw.utils.setStyle(targetElement,[
		{display: "none"},
		{position: "absolute"}
	]);
};

ZoominListView.prototype.navigateTo = function(historyInfo) {
	var listElementIndex = this.listWidget.findListElementByTitle(0,historyInfo.title);
	if(listElementIndex === undefined) {
		return;
	}
	var listElementNode = this.listWidget.children[listElementIndex],
		targetElement = listElementNode.domNode;
	// Make the new tiddler be position absolute and visible so that we can measure it
	$tw.utils.setStyle(targetElement,[
		{position: "absolute"},
		{display: "block"},
		{transformOrigin: "0 0"},
		{transform: "translateX(0px) translateY(0px) scale(1)"},
		{transition: "none"},
		{opacity: "0.0"}
	]);
	// Get the position of the source node, or use the centre of the window as the source position
	var sourceBounds = historyInfo.fromPageRect || {
			left: window.innerWidth/2 - 2,
			top: window.innerHeight/2 - 2,
			width: window.innerWidth/8,
			height: window.innerHeight/8
		};
	// Try to find the title node in the target tiddler
	var titleNode = findTitleNode(listElementNode) || listElementNode,
		zoomBounds = titleNode.domNode.getBoundingClientRect();
	// Compute the transform for the target tiddler to make the title lie over the source rectange
	var targetBounds = targetElement.getBoundingClientRect(),
		scale = sourceBounds.width / zoomBounds.width,
		x = sourceBounds.left - targetBounds.left - (zoomBounds.left - targetBounds.left) * scale,
		y = sourceBounds.top - targetBounds.top - (zoomBounds.top - targetBounds.top) * scale;
	// Transform the target tiddler to its starting position
	$tw.utils.setStyle(targetElement,[
		{transform: "translateX(" + x + "px) translateY(" + y + "px) scale(" + scale + ")"}
	]);
	// Force layout
	$tw.utils.forceLayout(targetElement);
	// Apply the ending transitions with a timeout to ensure that the previously applied transformations are applied first
	var self = this,
		prevCurrentTiddler = this.currentTiddler;
	this.currentTiddler = listElementNode;
	// Transform the target tiddler to its natural size
	$tw.utils.setStyle(targetElement,[
		{transition: $tw.utils.roundTripPropertyName("transform") + " " + $tw.config.preferences.animationDurationMs + " ease-in-out, opacity " + $tw.config.preferences.animationDurationMs + " ease-out"},
		{opacity: "1.0"},
		{transform: "translateX(0px) translateY(0px) scale(1)"},
		{zIndex: "500"},
	]);
	// Transform the previous tiddler out of the way and then hide it
	if(prevCurrentTiddler && prevCurrentTiddler !== listElementNode) {
		var scale = zoomBounds.width / sourceBounds.width;
		x =  zoomBounds.left - targetBounds.left - (sourceBounds.left - targetBounds.left) * scale;
		y =  zoomBounds.top - targetBounds.top - (sourceBounds.top - targetBounds.top) * scale;
		$tw.utils.setStyle(prevCurrentTiddler.domNode,[
			{transition: $tw.utils.roundTripPropertyName("transform") + " " + $tw.config.preferences.animationDurationMs + " ease-in-out, opacity " + $tw.config.preferences.animationDurationMs + " ease-out"},
			{opacity: "0.0"},
			{transformOrigin: "0 0"},
			{transform: "translateX(" + x + "px) translateY(" + y + "px) scale(" + scale + ")"},
			{zIndex: "0"}
		]);
		// Hide the tiddler when the transition has finished
		setTimeout(function() {
			if(self.currentTiddler !== prevCurrentTiddler) {
				prevCurrentTiddler.domNode.style.display = "none";
			}
		},$tw.config.preferences.animationDuration);
	}
	// Scroll the target into view
//	$tw.pageScroller.scrollIntoView(targetElement);
};

exports.zoomin = ZoominListView;

})();
