/*\
title: $:/core/modules/storyviews/classic.js
type: application/javascript
module-type: storyview

Views the story as a linear sequence

\*/

"use strict";

var easing = "cubic-bezier(0.645, 0.045, 0.355, 1)"; // From http://easings.net/#easeInOutCubic

var ClassicStoryView = function(listWidget) {
	this.listWidget = listWidget;
	// Track animations in progress for better performance
	this.animationsInProgress = {};
	// Pre-calculate will-change values for GPU optimization
	this.insertWillChange = "transform, opacity";
	this.removeWillChange = "transform, opacity, max-height";
};

ClassicStoryView.prototype.navigateTo = function(historyInfo) {
	var self = this;
	// Check if storyview scrolling is enabled
	var enableScroll = this.listWidget.getVariable("tv-enable-storyview-scroll");
	if(enableScroll !== "yes") {
		return;
	}
	
	var duration = $tw.utils.getAnimationDuration();
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
	
	// Check if we're already animating this element
	if(targetElement.dataset && targetElement.dataset.navigating === "true") {
		return;
	}
	
	// Mark element as being navigated to
	if(targetElement.dataset) {
		targetElement.dataset.navigating = "true";
	}
	
	// Apply will-change for smooth scrolling
	$tw.utils.setStyle(targetElement,[
		{willChange: "transform"}
	]);
	
	// Dispatch scroll event with optimized parameters
	this.listWidget.dispatchEvent({
		type: "tm-scroll",
		target: targetElement,
		paramObject: {
			animationDuration: duration
		}
	});
	
	// Clean up after scrolling completes
	setTimeout(function() {
		if(targetElement.parentNode) {
			$tw.utils.setStyle(targetElement,[
				{willChange: ""}
			]);
			if(targetElement.dataset) {
				delete targetElement.dataset.navigating;
			}
		}
	}, duration + 100); // Add small buffer after animation duration
};

ClassicStoryView.prototype.insert = function(widget) {
	var self = this;
	var duration = $tw.utils.getAnimationDuration();
	if(duration) {
		var targetElement = widget.findFirstDomNode();
		// Abandon if the list entry isn't a DOM element (it might be a text node)
		if(!targetElement || targetElement.nodeType === Node.TEXT_NODE) {
			return;
		}
		
		// Generate unique ID for tracking
		var animId = "anim_" + Date.now() + "_" + Math.random();
		self.animationsInProgress[animId] = true;
		
		// Get the current height of the tiddler
		var computedStyle = window.getComputedStyle(targetElement);
		var currMarginBottom = parseFloat(computedStyle.marginBottom) || 0;
		var currMarginTop = parseFloat(computedStyle.marginTop) || 0;
		var currPaddingTop = parseFloat(computedStyle.paddingTop) || 0;
		var currPaddingBottom = parseFloat(computedStyle.paddingBottom) || 0;
		var currHeight = targetElement.offsetHeight;
		
		// Set up initial state - collapsed with negative margin
		$tw.utils.setStyle(targetElement,[
			{transition: "none"},
			{marginBottom: (-currHeight - currMarginTop) + "px"},
			{opacity: "0"},
			{transform: "translate3d(0, 0, 0)"}, // Force GPU layer
			{willChange: "margin-bottom, opacity"}
		]);
		
		// Force layout recalculation
		$tw.utils.forceLayout(targetElement);
		
		// Apply transition
		$tw.utils.setStyle(targetElement,[
			{transition: "margin-bottom " + duration + "ms " + easing + ", " +
						"opacity " + duration + "ms " + easing},
			{marginBottom: currMarginBottom + "px"},
			{opacity: "1"}
		]);
		
		// Clean up after animation
		setTimeout(function() {
			if(targetElement.parentNode) {
				$tw.utils.setStyle(targetElement,[
					{transition: ""},
					{marginBottom: ""},
					{opacity: ""},
					{transform: ""},
					{willChange: ""}
				]);
			}
			delete self.animationsInProgress[animId];
		}, duration);
	}
};

ClassicStoryView.prototype.remove = function(widget) {
	var self = this;
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
		
		// Generate unique ID for tracking
		var animId = "anim_" + Date.now() + "_" + Math.random();
		self.animationsInProgress[animId] = true;
		
		// Get the current width for slide animation
		var currWidth = targetElement.offsetWidth;
		var computedStyle = window.getComputedStyle(targetElement);
		var currMarginBottom = parseFloat(computedStyle.marginBottom) || 0;
		var currMarginTop = parseFloat(computedStyle.marginTop) || 0;
		var currHeight = targetElement.offsetHeight + currMarginTop;
		
		// Prepare for animation
		$tw.utils.setStyle(targetElement,[
			{transition: "none"},
			{transform: "translate3d(0, 0, 0)"}, // Force GPU layer
			{marginBottom: currMarginBottom + "px"},
			{opacity: "1"},
			{willChange: $tw.utils.roundTripPropertyName("transform") + ", opacity, margin-bottom"}
		]);
		
		// Force layout recalculation
		$tw.utils.forceLayout(targetElement);
		
		// Apply exit animation
		$tw.utils.setStyle(targetElement,[
			{transition: $tw.utils.roundTripPropertyName("transform") + " " + duration + "ms " + easing + ", " +
						"opacity " + duration + "ms " + easing + ", " +
						"margin-bottom " + duration + "ms " + easing},
			{transform: "translate3d(-" + currWidth + "px, 0, 0)"},
			{marginBottom: (-currHeight) + "px"},
			{opacity: "0"}
		]);
		
		// Remove element after animation completes
		setTimeout(function() {
			removeElement();
			delete self.animationsInProgress[animId];
		}, duration);
	} else {
		widget.removeChildDomNodes();
	}
};

exports.classic = ClassicStoryView;
