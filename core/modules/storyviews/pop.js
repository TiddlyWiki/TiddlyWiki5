/*\
title: $:/core/modules/storyviews/pop.js
type: application/javascript
module-type: storyview

Animates list insertions and removals

\*/

"use strict";

var PopStoryView = function(listWidget) {
	this.listWidget = listWidget;
};

PopStoryView.prototype.navigateTo = function(historyInfo) {
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
	// Scroll the node into view
	this.listWidget.dispatchEvent({type: "tm-scroll", target: targetElement});
};

PopStoryView.prototype.insert = function(widget) {
	var targetElement = widget.findFirstDomNode(),
		duration = $tw.utils.getAnimationDuration();
	// Abandon if the list entry isn't a DOM element (it might be a text node)
	if(!targetElement || targetElement.nodeType === Node.TEXT_NODE) {
		return;
	}
	// Reset once the transition is over
	setTimeout(function() {
		$tw.utils.removeStyles(targetElement, ["transition", "transform"]);		
		$tw.utils.setStyle(widget.document.body,[
			{"overflow-x": ""}
		]);
	},duration);
	// Prevent the page from overscrolling due to the zoom factor
	$tw.utils.setStyle(widget.document.body,[
		{"overflow-x": "hidden"}
	]);
	// Set up the initial position of the element
	$tw.utils.setStyle(targetElement,[
		{transform: "scale(2)"},
		{opacity: "0.0"}
	]);
	$tw.utils.removeStyle(targetElement, "transition");		
	$tw.utils.forceLayout(targetElement);
	// Transition to the final position
	$tw.utils.setStyle(targetElement,[
		{transition: $tw.utils.roundTripPropertyName("transform") + " " + duration + "ms ease-in-out, " +
					"opacity " + duration + "ms ease-in-out"},
		{transform: "scale(1)"},
		{opacity: "1.0"}
	]);
	setTimeout(function() {
		$tw.utils.removeStyles(targetElement, ["transition", "transform", "opactity"]);
	}, duration)
};

PopStoryView.prototype.remove = function(widget) {
	var targetElement = widget.findFirstDomNode(),
		duration = $tw.utils.getAnimationDuration(),
		removeElement = function() {
			if(targetElement && targetElement.parentNode) {
				widget.removeChildDomNodes();
			}
		};
	// Abandon if the list entry isn't a DOM element (it might be a text node)
	if(!targetElement || targetElement.nodeType === Node.TEXT_NODE) {
		removeElement();
		return;
	}
	// Remove the element at the end of the transition
	setTimeout(removeElement,duration);
	// Animate the closure
	$tw.utils.removeStyles(targetElement, ["transition", "transform", "opacity"]);		
	$tw.utils.forceLayout(targetElement);
	$tw.utils.setStyle(targetElement,[
		{transition: $tw.utils.roundTripPropertyName("transform") + " " + duration + "ms ease-in-out, " +
					"opacity " + duration + "ms ease-in-out"},
		{transform: "scale(0.1)"},
		{opacity: "0.0"}
	]);
};

exports.pop = PopStoryView;