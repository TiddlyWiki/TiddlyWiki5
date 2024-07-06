/*\
title: $:/core/modules/storyviews/classic.js
type: application/javascript
module-type: storyview

Views the story as a linear sequence

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var easing = "cubic-bezier(0.645, 0.045, 0.355, 1)"; // From http://easings.net/#easeInOutCubic

var ClassicStoryView = function(listWidget) {
	this.listWidget = listWidget;
};

ClassicStoryView.prototype.navigateTo = function(historyInfo) {
	var duration = $tw.utils.getAnimationDuration()
	var listElementIndex = this.listWidget.findListItem(0,historyInfo.title);
	if(listElementIndex === undefined) {
		return;
	}
	var listItemWidget = this.listWidget.children[listElementIndex],
		targetElement = listItemWidget.findFirstDomNode();
	// Abandon if the list entry isn't a DOM element (it might be a text node)
	if(!targetElement || targetElement.nodeType === Node.TEXT_NODE) {
		return;
	}
	if(duration) {
		// Scroll the node into view
		this.listWidget.dispatchEvent({type: "tm-scroll", target: targetElement});
	} else {
		targetElement.scrollIntoView();
	}
};

ClassicStoryView.prototype.insert = function(widget) {
	var duration = $tw.utils.getAnimationDuration();
	if(duration) {
		var targetElement = widget.findFirstDomNode();
		// Abandon if the list entry isn't a DOM element (it might be a text node)
		if(!targetElement || targetElement.nodeType === Node.TEXT_NODE) {
			return;
		}
		// Get the current height of the tiddler
		var computedStyle = window.getComputedStyle(targetElement),
			currMarginBottom = parseInt(computedStyle.marginBottom,10),
			currMarginTop = parseInt(computedStyle.marginTop,10),
			currHeight = targetElement.offsetHeight + currMarginTop;
		// Reset the margin once the transition is over
		setTimeout(function() {
			$tw.utils.setStyle(targetElement,[
				{transition: "none"},
				{marginBottom: ""}
			]);
		},duration);
		// Set up the initial position of the element
		$tw.utils.setStyle(targetElement,[
			{transition: "none"},
			{marginBottom: (-currHeight) + "px"},
			{opacity: "0.0"}
		]);
		$tw.utils.forceLayout(targetElement);
		// Transition to the final position
		$tw.utils.setStyle(targetElement,[
			{transition: "opacity " + duration + "ms " + easing + ", " +
						"margin-bottom " + duration + "ms " + easing},
			{marginBottom: currMarginBottom + "px"},
			{opacity: "1.0"}
	]);
	}
};

ClassicStoryView.prototype.remove = function(widget) {
	var duration = $tw.utils.getAnimationDuration();
	if(duration) {
		var targetElement = widget.findFirstDomNode(),
			removeElement = function() {
				widget.removeChildDomNodes();
			};
		// Abandon if the list entry isn't a DOM element (it might be a text node)
		if(!targetElement || targetElement.nodeType === Node.TEXT_NODE) {
			widget.removeChildDomNodes();
			return;
		}
		// Clone the target element
		var cloneElement = targetElement.cloneNode(true);
		targetElement.parentNode.insertBefore(cloneElement,targetElement);
		// Remove the original element
		widget.removeChildDomNodes();
		// Get the current height of the tiddler
		var currWidth = cloneElement.offsetWidth,
			computedStyle = window.getComputedStyle(cloneElement),
			currMarginBottom = parseInt(computedStyle.marginBottom,10),
			currMarginTop = parseInt(computedStyle.marginTop,10),
			currHeight = cloneElement.offsetHeight + currMarginTop;
		// Remove the dom nodes of the widget at the end of the transition
		setTimeout(function() {
			cloneElement.parentNode.removeChild(cloneElement);
		},duration);
		// Animate the closure
		$tw.utils.setStyle(cloneElement,[
			{transition: "none"},
			{transform: "translateX(0px)"},
			{marginBottom:  currMarginBottom + "px"},
			{opacity: "1.0"}
		]);
		$tw.utils.forceLayout(cloneElement);
		$tw.utils.setStyle(cloneElement,[
			{transition: $tw.utils.roundTripPropertyName("transform") + " " + duration + "ms " + easing + ", " +
						"opacity " + duration + "ms " + easing + ", " +
						"margin-bottom " + duration + "ms " + easing},
			{transform: "translateX(-" + currWidth + "px)"},
			{marginBottom: (-currHeight) + "px"},
			{opacity: "0.0"}
		]);
	} else {
		widget.removeChildDomNodes();
	}
};

exports.classic = ClassicStoryView;

})();
