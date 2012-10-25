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
	this.map.positions["HelloThere"] = {x: 250, y: 50, w: 300, h: 300};
	this.saveMap();
	for(var t=0; t<listFrameDomNode.children.length; t++) {
		var title = this.listMacro.listFrame.children[t].listElementInfo.title,
			domNode = listFrameDomNode.children[t];
		this.positionTiddler(title,domNode);
	}
};

CecilyListView.prototype.getMapTiddlerTitle = function() {
	return this.listMacro.params.map || "$:/TiddlerMap";
};

CecilyListView.prototype.loadMap = function() {
	this.map = this.listMacro.wiki.getTiddlerData(this.getMapTiddlerTitle(),{positions: []});
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
		default: // "below"
			newPosition = {
				x: this.newTiddlerPosition.x,
				y: this.newTiddlerPosition.y,
				w: 300,
				h: 300
			};
			this.newTiddlerPosition.y += domNode.offsetHeight/2;
			break;
	}
	// Return the position
	return newPosition || {
		x: 0,
		y: 0,
		w: 300,
		h: 300
	};
};

CecilyListView.prototype.positionTiddler = function(title,domNode) {
	var pos = this.lookupTiddlerInMap(title,domNode);
	domNode.style.position = "absolute";
	domNode.style[$tw.browser.transform] = "translateX(" + pos.x + "px) translateY(" + pos.y + "px)";
};

CecilyListView.prototype.insert = function(index) {
	var listElementNode = this.listMacro.listFrame.children[index],
		targetElement = listElementNode.domNode;
	// Animate the insertion
	targetElement.style[$tw.browser.transition] = "";
	targetElement.style[$tw.browser.transformorigin] = "0% 0%";
	targetElement.style.opacity = "0.0";
	$tw.utils.forceLayout(targetElement);
	targetElement.style[$tw.browser.transition] = "opacity " + $tw.config.preferences.animationDurationMs + " ease-out";
	targetElement.style.opacity = "1.0";
	// Position the dom node
	this.positionTiddler(listElementNode.listElementInfo.title,targetElement);
};

exports["cecily"] = CecilyListView;

})();
