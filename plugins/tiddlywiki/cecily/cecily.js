/*\
title: $:/plugins/tiddlywiki/cecily/cecily.js
type: application/javascript
module-type: storyview

Positions tiddlers on a 2D map

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var CecilyStoryView = function(listWidget) {
	var self = this;
	this.listWidget = listWidget;
	// Load the map
	this.loadMap();
	// Position the existing tiddlers
	$tw.utils.each(this.listWidget.children,function(itemWidget,index) {
		var domNode = itemWidget.findFirstDomNode();
		domNode.style.position = "absolute";
		var title = itemWidget.parseTreeNode.itemTitle;
		self.positionTiddler(title,domNode);
	});
};

CecilyStoryView.prototype.navigateTo = function(historyInfo) {
	var listElementIndex = this.listWidget.findListItem(0,historyInfo.title);
	if(listElementIndex === undefined) {
		return;
	}
	var listItemWidget = this.listWidget.children[listElementIndex],
		targetElement = listItemWidget.findFirstDomNode();
	// Scroll the node into view
	this.listWidget.dispatchEvent({type: "tw-scroll", target: targetElement});
};

CecilyStoryView.prototype.insert = function(widget) {
	var domNode = widget.findFirstDomNode(),
		duration = $tw.utils.getAnimationDuration();
	// Make the newly inserted node position absolute
	$tw.utils.setStyle(domNode,[
		{position: "absolute"},
		{transition: ""},
		{opacity: "0.0"}
	]);
	// Position it
	var title = widget.parseTreeNode.itemTitle;
	this.positionTiddler(title,domNode);
	$tw.utils.forceLayout(domNode);
	// Animate it in
	$tw.utils.setStyle(domNode,[
		{transition: "opacity " + duration + "ms ease-out"},
		{opacity: "1.0"}
	]);
};

CecilyStoryView.prototype.remove = function(widget) {
	var targetElement = widget.findFirstDomNode(),
		duration = $tw.utils.getAnimationDuration();
	// Remove the widget at the end of the transition
	setTimeout(function() {
		widget.removeChildDomNodes();
	},duration);
	// Animate the closure
	$tw.utils.setStyle(targetElement,[
		{transition: "none"},
		{opacity: "1.0"}
	]);
	$tw.utils.forceLayout(targetElement);
	$tw.utils.setStyle(targetElement,[
		{transition: $tw.utils.roundTripPropertyName("transform") + " " + duration + "ms ease-in-out, " +
					"opacity " + duration + "ms ease-in-out"},
		{transform: "scale(0.01)"},
		{opacity: "0.0"}
	]);
};

/*
Load the current map
*/
CecilyStoryView.prototype.loadMap = function() {
	this.map = this.listWidget.wiki.getTiddlerData(this.getMapTiddlerTitle(),{
		positions: {},
		newTiddlerPosition: {x: 0, y: 0},
		width: 660
	});
};

CecilyStoryView.prototype.getMapTiddlerTitle = function() {
	return this.listWidget.getAttribute("map","$:/TiddlerMap");
};

/*
Position a tiddler according to the map
*/
CecilyStoryView.prototype.positionTiddler = function(title,domNode) {
	var pos = this.lookupTiddlerInMap(title,domNode),
		scale = pos.w/domNode.offsetWidth;
	$tw.utils.setStyle(domNode,[
		{width: this.map.width + "px"},
		{transformOrigin: "0% 0%"},
		{transform: "translateX(" + pos.x + "px) translateY(" + pos.y + "px) scale(" + scale + ")"}
	]);
};

// Get the position of a particular tiddler
CecilyStoryView.prototype.lookupTiddlerInMap = function(title,domNode) {
	// If this is a draft tiddler then look for the position of the original tiddler
	var tiddler = this.listWidget.wiki.getTiddler(title);
	if(tiddler) {
		var draftOf = tiddler.fields["draft.of"];
		if(draftOf && this.map.positions[draftOf]) {
			return this.map.positions[draftOf]
		}
	}
	// Try looking the target tiddler up in the map
	if(this.map.positions[title]) {
		return this.map.positions[title];
	}
	// If the tiddler wasn't in the map we'll have to compute it
	var newPosition;
	switch(this.map.positionNew) {
		default: // "right"
			newPosition = {
				x: this.map.newTiddlerPosition.x,
				y: this.map.newTiddlerPosition.y,
				w: 200,
				h: 200
			};
			this.map.newTiddlerPosition.x += newPosition.w * 1.1;
			break;
	}
	// A default position
	newPosition = newPosition || {x: 0,y: 0,w: 100,h: 100};
	// Save the position back to the map
	this.map.positions[title] = newPosition;
	return newPosition;
};

exports.cecily = CecilyStoryView;

})();
