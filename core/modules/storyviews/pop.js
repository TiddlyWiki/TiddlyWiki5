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
	// Check if storyview scrolling is enabled
	var enableScroll = this.listWidget.getVariable("tv-enable-storyview-scroll");
	if(enableScroll !== "yes") {
		return;
	}
	
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
	// Highlight the target element briefly
	var duration = $tw.utils.getAnimationDuration(),
		easing = $tw.wiki.getTiddlerText("$:/config/StoryView/Pop/Easing","cubic-bezier(0.4, 0.0, 0.2, 1)");
	$tw.utils.setStyle(targetElement,[
		{transition: "none"},
		{filter: "brightness(1.2)"}
	]);
	$tw.utils.forceLayout(targetElement);
	$tw.utils.setStyle(targetElement,[
		{transition: "filter " + duration + "ms " + easing},
		{filter: "brightness(1)"}
	]);
	// Scroll the node into view with a small delay to let the highlight start
	setTimeout(function() {
		this.listWidget.dispatchEvent({type: "tm-scroll", target: targetElement});
	}.bind(this), 50);
};

PopStoryView.prototype.insert = function(widget) {
	var targetElement = widget.findFirstDomNode(),
		duration = $tw.utils.getAnimationDuration();
	// Abandon if the list entry isn't a DOM element (it might be a text node)
	if(!targetElement || targetElement.nodeType === Node.TEXT_NODE) {
		return;
	}
	
	// Check if element is currently animating
	if(targetElement.dataset.popAnimating === "true") {
		return;
	}
	targetElement.dataset.popAnimating = "true";
	
	// Re-read configuration for live updates
	var insertScale = parseFloat($tw.wiki.getTiddlerText("$:/config/StoryView/Pop/InsertScale","2"));
	var insertRotation = parseFloat($tw.wiki.getTiddlerText("$:/config/StoryView/Pop/InsertRotation","0"));
	var enableBlur = $tw.wiki.getTiddlerText("$:/config/StoryView/Pop/EnableBlur","no") === "yes";
	var easing = $tw.wiki.getTiddlerText("$:/config/StoryView/Pop/Easing","cubic-bezier(0.4, 0.0, 0.2, 1)");
	
	// Build transform string
	var transformStart = "scale(" + insertScale + ")";
	if(insertRotation !== 0) {
		transformStart += " rotate(" + insertRotation + "deg)";
	}
	
	// Build filter string
	var filterStart = enableBlur ? "blur(5px)" : "none";
	
	// Reset once the transition is over
	var transitionEndHandler = function() {
		targetElement.removeEventListener("transitionend", transitionEndHandler);
		delete targetElement.dataset.popAnimating;
		$tw.utils.setStyle(targetElement,[
			{transition: ""},
			{transform: ""},
			{filter: ""},
			{opacity: ""},
			{willChange: ""}
		]);
		$tw.utils.setStyle(widget.document.body,[
			{"overflow-x": ""}
		]);
	};
	
	// Prevent the page from overscrolling due to the zoom factor
	$tw.utils.setStyle(widget.document.body,[
		{"overflow-x": "hidden"}
	]);
	
	// Set up the initial position of the element
	$tw.utils.setStyle(targetElement,[
		{transition: "none"},
		{transform: transformStart},
		{filter: filterStart},
		{opacity: "0"},
		{transformOrigin: "center center"},
		{willChange: "transform, opacity, filter"}
	]);
	$tw.utils.forceLayout(targetElement);
	
	// Add transition end listener
	targetElement.addEventListener("transitionend", transitionEndHandler);
	
	// Transition to the final position - use setTimeout to ensure initial styles are applied
	setTimeout(function() {
		var transitions = [
			$tw.utils.roundTripPropertyName("transform") + " " + duration + "ms " + easing,
			"opacity " + duration + "ms " + easing
		];
		if(enableBlur) {
			transitions.push("filter " + duration + "ms " + easing);
		}
		
		$tw.utils.setStyle(targetElement,[
			{transition: transitions.join(", ")},
			{transform: "scale(1) rotate(0deg)"},
			{filter: "none"},
			{opacity: "1"}
		]);
	}, 10);
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
	
	// Check if element is currently animating
	if(targetElement.dataset.popAnimating === "true") {
		// If already animating, just remove it
		removeElement();
		return;
	}
	targetElement.dataset.popAnimating = "true";
	
	// Re-read configuration for live updates
	var removeScale = parseFloat($tw.wiki.getTiddlerText("$:/config/StoryView/Pop/RemoveScale","0.1"));
	var removeRotation = parseFloat($tw.wiki.getTiddlerText("$:/config/StoryView/Pop/RemoveRotation","0"));
	var enableBlur = $tw.wiki.getTiddlerText("$:/config/StoryView/Pop/EnableBlur","no") === "yes";
	var easing = $tw.wiki.getTiddlerText("$:/config/StoryView/Pop/Easing","cubic-bezier(0.4, 0.0, 0.2, 1)");
	
	// Build transform string
	var transformEnd = "scale(" + removeScale + ")";
	if(removeRotation !== 0) {
		transformEnd += " rotate(" + removeRotation + "deg)";
	}
	
	// Build filter string
	var filterEnd = enableBlur ? "blur(5px)" : "none";
	
	// Set up initial state
	$tw.utils.setStyle(targetElement,[
		{transition: "none"},
		{transform: "scale(1) rotate(0deg)"},
		{filter: "none"},
		{opacity: "1"},
		{transformOrigin: "center center"},
		{willChange: "transform, opacity, filter"}
	]);
	$tw.utils.forceLayout(targetElement);
	
	// Remove the element at the end of the transition
	var transitionEndHandler = function() {
		targetElement.removeEventListener("transitionend", transitionEndHandler);
		removeElement();
	};
	targetElement.addEventListener("transitionend", transitionEndHandler);
	
	// Animate the removal - use setTimeout to ensure initial styles are applied
	setTimeout(function() {
		var transitions = [
			$tw.utils.roundTripPropertyName("transform") + " " + duration + "ms " + easing,
			"opacity " + duration + "ms " + easing
		];
		if(enableBlur) {
			transitions.push("filter " + duration + "ms " + easing);
		}
		
		$tw.utils.setStyle(targetElement,[
			{transition: transitions.join(", ")},
			{transform: transformEnd},
			{filter: filterEnd},
			{opacity: "0"}
		]);
	}, 10);
};

exports.pop = PopStoryView;
