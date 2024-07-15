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
		// Blur the focus if it is within the descendents of the node we are removing
		if($tw.utils.domContains(targetElement,targetElement.ownerDocument.activeElement)) {
			targetElement.ownerDocument.activeElement.blur();
		}
		// Abandon if the list entry isn't a DOM element (it might be a text node)
		if(!targetElement || targetElement.nodeType === Node.TEXT_NODE) {
			removeElement();
			return;
		}
		// Get the current height of the tiddler
		var currWidth = targetElement.offsetWidth,
			computedStyle = window.getComputedStyle(targetElement),
			currMarginBottom = parseInt(computedStyle.marginBottom,10),
			currMarginTop = parseInt(computedStyle.marginTop,10),
			currHeight = targetElement.offsetHeight + currMarginTop;
		// Remove the dom nodes of the widget at the end of the transition
		setTimeout(removeElement,duration);
		// Animate the closure
		$tw.utils.setStyle(targetElement,[
			{transition: "none"},
			{transform: "translateX(0px)"},
			{marginBottom:  currMarginBottom + "px"},
			{opacity: "1.0"}
		]);
		$tw.utils.forceLayout(targetElement);
		$tw.utils.setStyle(targetElement,[
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
