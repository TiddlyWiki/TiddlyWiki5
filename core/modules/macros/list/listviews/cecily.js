/*\
title: $:/core/modules/macros/list/listviews/cecily.js
type: application/javascript
module-type: listview

Views the list through a 2D map

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

function CecilyListView(listMacro) {
	// The list macro we're attached to
	this.listMacro = listMacro;
	// Prepare the list frame
	var listFrameDomNode = this.listMacro.listFrame.domNode
	listFrameDomNode.style.position = "relative";
	listFrameDomNode.style.width = "100%"; // TODO: This isn't the best way to set the width and height
	listFrameDomNode.style.height = "400px";
	// Prepare the nozzle for dispensing new tiddlers onto the map
	this.newTiddlerPosition = {x: 0, y: 0};
	// Position the initial list entries on the map
	this.loadMap();
	for(var t=0; t<listFrameDomNode.children.length; t++) {
		var title = this.listMacro.listFrame.children[t].listElementInfo.title,
			domNode = listFrameDomNode.children[t];
		domNode.style.position = "absolute";
		this.positionTiddler(title,domNode);
	}
};

CecilyListView.prototype.getMapTiddlerTitle = function() {
	return this.listMacro.params.map || "$:/TiddlerMap";
};

CecilyListView.prototype.loadMap = function() {
	this.map = this.listMacro.wiki.getTiddlerData(this.getMapTiddlerTitle(),{positions: {}});
};

CecilyListView.prototype.saveMap = function() {
	this.listMacro.wiki.setTiddlerData(this.getMapTiddlerTitle(),this.map);
};

// Get the position of a particular tiddler
CecilyListView.prototype.lookupTiddlerInMap = function(title,domNode) {
	// First try looking it up in the map
	if(this.map.positions[title]) {
		return this.map.positions[title];
	}
	// If the tiddler wasn't in the map we'll have to compute it
	var newPosition;
	switch(this.map.positionNew) {
		default: // "right"
			newPosition = {
				x: this.newTiddlerPosition.x,
				y: this.newTiddlerPosition.y,
				w: 100,
				h: 100
			};
			this.newTiddlerPosition.x += newPosition.w * 1.2;
			break;
	}
	// A default position
	newPosition = newPosition || {x: 0,y: 0,w: 100,h: 100};
	// Save the position back to the map
	this.map.positions[title] = newPosition;
	this.saveMap();
	return newPosition;
};

CecilyListView.prototype.positionTiddler = function(title,domNode) {
	var pos = this.lookupTiddlerInMap(title,domNode),
		scale = pos.w/domNode.offsetWidth;
	$tw.utils.setStyle(domNode,[
		{transformOrigin: "0% 0%"},
		{transform: "translateX(" + pos.x + "px) translateY(" + pos.y + "px) scale(" + scale + ")"}
	]);
};

CecilyListView.prototype.insert = function(index) {
	var listElementNode = this.listMacro.listFrame.children[index],
		targetElement = listElementNode.domNode;
	targetElement.style.position = "absolute";
	$tw.utils.setStyle(targetElement,[
		{transition: ""},
		{opacity: "0.0"}
	]);
	this.positionTiddler(listElementNode.listElementInfo.title,targetElement);
	$tw.utils.forceLayout(targetElement);
	$tw.utils.setStyle(targetElement,[
		{transition: "opacity " + $tw.config.preferences.animationDurationMs + " ease-out"},
		{opacity: "1.0"}
	]);
};

CecilyListView.prototype.remove = function(index) {
	var listElementNode = this.listMacro.listFrame.children[index],
		targetElement = listElementNode.domNode;
	// Attach an event handler for the end of the transition
	targetElement.addEventListener($tw.utils.convertEventName("transitionEnd"),function(event) {
		if(targetElement.parentNode) {
			targetElement.parentNode.removeChild(targetElement);
		}
	},false);
	// Animate the closure
	$tw.utils.setStyle(targetElement,[
		{transition: "opacity " + $tw.config.preferences.animationDurationMs + " ease-out"},
		{opacity: "1.0"}
	]);
	$tw.utils.forceLayout(targetElement);
	$tw.utils.setStyle(targetElement,[
		{opacity: "0.0"}
	]);
	// Returning true causes the DOM node not to be deleted
	return true;
};

exports["cecily"] = CecilyListView;

})();
