/*\
title: $:/plugins/tiddlywiki/stacked-view/stacked.js
type: application/javascript
module-type: storyview

Keeps tiddlers in a stack

\*/

"use strict";

const easing = "cubic-bezier(0.645, 0.045, 0.355, 1)"; // From http://easings.net/#easeInOutCubic

const StackedListView = function(listWidget) {
	const self = this;
	this.listWidget = listWidget;
	this.fanHeightConfigTitle = listWidget.getVariable("tv-stacked-storyview-fan-height-config-title");
	this.placeTiddlers();
};

StackedListView.prototype.placeTiddlers = function() {
	// Initialise the stack of tiddler titles
	this.listStack = [];
	const numItems = this.listWidget.children.length;
	var t; let itemWidget;
	const duration = $tw.utils.getAnimationDuration();
	for(t = numItems - 1;t >= 0;t--) {
		itemWidget = this.listWidget.children[t];
		this.listStack.push(itemWidget.parseTreeNode.itemTitle);
	}
	// Ensure the tiddler at the top of the history stack is at the top of the array
	const history = this.listWidget.wiki.getTiddlerData(this.listWidget.historyTitle,[]);
	for(t = 0;t < history.length;t++) {
		const {title} = history[t];
		if(this.listStack.includes(title)) {
			$tw.utils.pushTop(this.listStack,title);
		}
	}
	// Get the configured fan height
	const fanHeight = parseInt(this.listWidget.wiki.getTiddlerText(this.fanHeightConfigTitle),10);
	// Position each tiddler
	for(var t = numItems - 1;t >= 0;t--) {
		// Get the DOM node for this tiddler
		itemWidget = this.listWidget.children[t];
		const domNode = itemWidget.findFirstDomNode();
		if(domNode instanceof Element) {
			// Allows the width of the tiddler to be adjusted
			$tw.utils.addClass(domNode,"tc-storyview-zoomin-tiddler");
			// Find the position of the tiddler in the stack
			const pos = this.listStack.indexOf(itemWidget.parseTreeNode.itemTitle);
			if(pos !== -1) {
				// Style the tiddler to position it
				const posFactor = pos / (numItems - 1);
				$tw.utils.setStyle(domNode,[
					{position: "absolute"},
					{transformOrigin: "50% 0"},
					{transition: `${$tw.utils.roundTripPropertyName("transform")} ${duration * (0.5 + posFactor)}ms ${easing}`},
					{transform: `translateX(0px) translateY(${fanHeight * posFactor * posFactor}px) scale(${0.1 + posFactor * 0.9})`},
					{zIndex: `${pos}`}
				]);
			}
		}
	}
};

StackedListView.prototype.refreshStart = function(changedTiddlers,changedAttributes) {};

StackedListView.prototype.refreshEnd = function(changedTiddlers,changedAttributes) {
	this.placeTiddlers();
};

StackedListView.prototype.navigateTo = function(historyInfo) {};

StackedListView.prototype.insert = function(widget) {};

StackedListView.prototype.remove = function(widget) {
	widget.removeChildDomNodes();
};

exports.stacked = StackedListView;
