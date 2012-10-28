/*\
title: $:/core/modules/macros/list/listviews/sideways.js
type: application/javascript
module-type: listview

Views the list as a sideways linear sequence

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

function SidewaysListView(listMacro) {
	this.listMacro = listMacro;
}

SidewaysListView.prototype.navigateTo = function(historyInfo) {
	var listElementIndex = this.listMacro.findListElementByTitle(0,historyInfo.title),
		listElementNode = this.listMacro.listFrame.children[listElementIndex],
		targetElement = listElementNode.domNode,
		currWidth = targetElement.offsetWidth;
	// Compute the start and end positions of the target element
	var srcRect = historyInfo.fromPageRect;
	if(!srcRect) {
		var scrollPos = $tw.utils.getScrollPosition();
		srcRect.width = window.innerWidth;
		srcRect.height = window.innerHeight;
		srcRect = {
			left: scrollPos.x,
			top: scrollPos.y,
			right: scrollPos.x + srcRect.width,
			bottom: scrollPos.y + srcRect.height
		};
	};
	var dstRect = $tw.utils.getBoundingPageRect(targetElement);
	// Compute the transformations
	var scale = srcRect.width / dstRect.width;
	// Position the target element over the source rectangle
	$tw.utils.setStyle(targetElement,[
		{transition: "none"},
		{transform: "translateX(" + (srcRect.left-dstRect.left) + "px) translateY(" + (srcRect.top-dstRect.top) + "px) scale(" + scale + ")"},
		{marginRight: (-currWidth) + "px"}
	]);
	$tw.utils.forceLayout(targetElement);
	// Transition the target element to its final resting place
	$tw.utils.setStyle(targetElement,[
		{transition: $tw.utils.roundTripPropertyName("transform") + " " + $tw.config.preferences.animationDurationMs + " ease-in-out, " +
					"opacity " + $tw.config.preferences.animationDurationMs + " ease-out, " +
					"margin-right " + $tw.config.preferences.animationDurationMs + " ease-in-out"},
		{transform: "none"},
		{marginRight: "0px"}
	]);
	// Scroll the target element into view
	//$tw.scroller.scrollIntoView(dstRect);
};

SidewaysListView.prototype.insert = function(index) {
	var listElementNode = this.listMacro.listFrame.children[index],
		targetElement = listElementNode.domNode,
		currWidth = targetElement.offsetWidth;
	// Set up the initial position of the element
	$tw.utils.setStyle(targetElement,[
		{transition: "none"},
		{opacity: "0.0"},
		{marginRight: (-currWidth) + "px"}
	]);
	$tw.utils.forceLayout(targetElement);
	// Transition to the final position
	$tw.utils.setStyle(targetElement,[
		{transition: "opacity " + $tw.config.preferences.animationDurationMs + " ease-out, " +
					"margin-right " + $tw.config.preferences.animationDurationMs + " ease-in-out"},
		{opacity: "1.0"},
		{marginRight: ""}
	]);
};

SidewaysListView.prototype.remove = function(index) {
	var listElementNode = this.listMacro.listFrame.children[index],
		targetElement = listElementNode.domNode,
		currWidth = targetElement.offsetWidth;
	// Attach an event handler for the end of the transition
	targetElement.addEventListener($tw.utils.convertEventName("transitionEnd"),function(event) {
		if(targetElement.parentNode) {
			targetElement.parentNode.removeChild(targetElement);
		}
	},false);
	// Animate the closure
	$tw.utils.setStyle(targetElement,[
		{transition: ""},
		{opacity: "1.0"},
		{marginRight: "0px"}
	]);
	$tw.utils.forceLayout(targetElement);
	$tw.utils.setStyle(targetElement,[
		{transition: "opacity " + $tw.config.preferences.animationDurationMs + " ease-out, " +
					"margin-right " + $tw.config.preferences.animationDurationMs + " ease-in-out"},
		{opacity: "0.0"},
		{marginRight: (-currWidth) + "px"}
	]);
	// Returning true causes the DOM node not to be deleted
	return true;
};

exports["sideways"] = SidewaysListView;

})();
