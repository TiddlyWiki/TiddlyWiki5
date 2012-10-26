/*\
title: $:/core/modules/macros/list/listviews/classic.js
type: application/javascript
module-type: listview

Views the list as a linear sequence

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

function ClassicListView(listMacro) {
	this.listMacro = listMacro;
}

ClassicListView.prototype.navigateTo = function(historyInfo) {
	var listElementIndex = this.listMacro.findListElementByTitle(0,historyInfo.title),
		listElementNode = this.listMacro.listFrame.children[listElementIndex],
		targetElement = listElementNode.domNode;
	// Remove any transform on the target element
	$tw.utils.setStyle(targetElement,[
		{transition: "none"},
		{transformOrigin: "0% 0%"},
		{transform: "none"},
		{height: "auto"}
	]);
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
$tw.utils.forceLayout(targetElement);
	var dstRect = $tw.utils.getBoundingPageRect(targetElement);
	// Compute the transformations
	var scale = srcRect.width / dstRect.width;
	// Position the target element over the source rectangle
	$tw.utils.setStyle(targetElement,[
		{transition: "none"},
		{transform: "translateX(" + (srcRect.left-dstRect.left) + "px) translateY(" + (srcRect.top-dstRect.top) + "px) scale(" + scale + ")"}
	]);
	$tw.utils.forceLayout(targetElement);
	// Transition the target element to its final resting place
	$tw.utils.setStyle(targetElement,[
		{transition: $tw.utils.roundTripPropertyName("transform") + " " + $tw.config.preferences.animationDurationMs + " ease-in-out, " +
					"opacity " + $tw.config.preferences.animationDurationMs + " ease-out"},
		{transform: "none"}
	]);
	// Scroll the target element into view
	$tw.scroller.scrollIntoView(dstRect);
};

ClassicListView.prototype.insert = function(index) {
	var listElementNode = this.listMacro.listFrame.children[index],
		targetElement = listElementNode.domNode;
	// Get the current height of the tiddler
	var currHeight = targetElement.offsetHeight;
	// Reset the height once the transition is over
	targetElement.addEventListener($tw.utils.convertEventName("transitionEnd"),function(event) {
		$tw.utils.setStyle(targetElement,[
			{transition: "none"},
			{height: "auto"}
		]);
	},false);
	// Set up the initial position of the element
	$tw.utils.setStyle(targetElement,[
		{transition: "none"},
		{transformOrigin: "0% 0%"},
		{transform: "translateX(" + window.innerWidth + "px)"},
		{opacity: "0.0"},
		{height: "0px"}
	]);
	$tw.utils.forceLayout(targetElement);
	// Transition to the final position
	$tw.utils.setStyle(targetElement,[
		{transition: $tw.utils.roundTripPropertyName("transform") + " " + $tw.config.preferences.animationDurationMs + " ease-in-out, " +
					"opacity " + $tw.config.preferences.animationDurationMs + " ease-out, " +
					"height " + $tw.config.preferences.animationDurationMs + " ease-in-out"},
		{transform: "translateX(0px)"},
		{opacity: "1.0"},
		{height: currHeight + "px"}
	]);
};

ClassicListView.prototype.remove = function(index) {
	var listElementNode = this.listMacro.listFrame.children[index],
		targetElement = listElementNode.domNode;
	// Get the current height of the tiddler
	var currHeight = targetElement.offsetHeight;
	// Put a wrapper around the dom node we're closing
	var wrapperElement = document.createElement("div");
	targetElement.parentNode.insertBefore(wrapperElement,targetElement);
	wrapperElement.appendChild(targetElement);
	// Attach an event handler for the end of the transition
	wrapperElement.addEventListener($tw.utils.convertEventName("transitionEnd"),function(event) {
		if(wrapperElement.parentNode) {
			wrapperElement.parentNode.removeChild(wrapperElement);
		}
	},false);
	// Animate the closure
	$tw.utils.setStyle(wrapperElement,[
		{transition: $tw.utils.roundTripPropertyName("transform") + " " + $tw.config.preferences.animationDurationMs + " ease-in-out, " +
					"opacity " + $tw.config.preferences.animationDurationMs + " ease-out, " +
					"height " + $tw.config.preferences.animationDurationMs + " ease-in-out"},
		{transformOrigin: "0% 0%"},
		{transform: "translateX(0px)"},
		{opacity: "1.0"},
		{height: currHeight + "px"}
	]);
	$tw.utils.forceLayout(wrapperElement);
	$tw.utils.setStyle(wrapperElement,[
		{transform: "translateX(-" + window.innerWidth + "px)"},
		{opacity: "0.0"},
		{height: "0px"}
	]);
	// Returning true causes the DOM node not to be deleted
	return true;
};

exports["classic"] = ClassicListView;

})();
