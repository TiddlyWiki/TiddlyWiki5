/*\
title: $:/core/modules/storyviews/pop.js
type: application/javascript
module-type: storyview

Animates list insertions and removals

\*/

"use strict";

var PopStoryView = function(listWidget) {
	this.listWidget = listWidget;
	this.animatingElements = {}; // Track elements currently animating
	
	// Load initial configuration
	this.loadConfig();
};

// Load configuration from tiddlers
PopStoryView.prototype.loadConfig = function() {
	// Default easing for pop animations
	var defaultEasing = "cubic-bezier(0.4, 0.0, 0.2, 1)";
	
	this.config = {
		// Shared configuration with ClassicStoryView
		useGPUAcceleration: $tw.wiki.getTiddlerText("$:/config/AnimationGPUAcceleration") !== "no",
		easingFunction: $tw.wiki.getTiddlerText("$:/config/AnimationEasing") || defaultEasing,
		animationScale: parseFloat($tw.wiki.getTiddlerText("$:/config/AnimationScale") || "1.0"),
		useWillChange: $tw.wiki.getTiddlerText("$:/config/AnimationWillChange") !== "no",
		
		// Pop-specific configuration
		insertScale: parseFloat($tw.wiki.getTiddlerText("$:/config/PopStoryView/InsertScale") || "2"),
		insertRotation: parseFloat($tw.wiki.getTiddlerText("$:/config/PopStoryView/InsertRotation") || "0"),
		insertOpacity: parseFloat($tw.wiki.getTiddlerText("$:/config/PopStoryView/InsertOpacity") || "0"),
		removeScale: parseFloat($tw.wiki.getTiddlerText("$:/config/PopStoryView/RemoveScale") || "0.1"),
		removeRotation: parseFloat($tw.wiki.getTiddlerText("$:/config/PopStoryView/RemoveRotation") || "0"),
		removeOpacity: parseFloat($tw.wiki.getTiddlerText("$:/config/PopStoryView/RemoveOpacity") || "0"),
		enableBlur: $tw.wiki.getTiddlerText("$:/config/PopStoryView/EnableBlur") === "yes",
		enableNavigationHighlight: $tw.wiki.getTiddlerText("$:/config/PopStoryView/EnableNavigationHighlight") !== "no"
	};
};

// Called at the start of a refresh cycle
PopStoryView.prototype.refreshStart = function(changedTiddlers) {
	// Check if any configuration tiddlers changed
	if(changedTiddlers["$:/config/AnimationGPUAcceleration"] ||
	   changedTiddlers["$:/config/AnimationEasing"] ||
	   changedTiddlers["$:/config/AnimationScale"] ||
	   changedTiddlers["$:/config/AnimationWillChange"] ||
	   changedTiddlers["$:/config/PopStoryView/InsertScale"] ||
	   changedTiddlers["$:/config/PopStoryView/InsertRotation"] ||
	   changedTiddlers["$:/config/PopStoryView/InsertOpacity"] ||
	   changedTiddlers["$:/config/PopStoryView/RemoveScale"] ||
	   changedTiddlers["$:/config/PopStoryView/RemoveRotation"] ||
	   changedTiddlers["$:/config/PopStoryView/RemoveOpacity"] ||
	   changedTiddlers["$:/config/PopStoryView/EnableBlur"] ||
	   changedTiddlers["$:/config/PopStoryView/EnableNavigationHighlight"]) {
		this.loadConfig();
	}
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
	
	// Highlight the target element briefly if enabled
	if(this.config.enableNavigationHighlight) {
		var duration = $tw.utils.getAnimationDuration() * this.config.animationScale;
		$tw.utils.setStyle(targetElement,[
			{transition: "none"},
			{filter: "brightness(1.2)"}
		]);
		$tw.utils.forceLayout(targetElement);
		$tw.utils.setStyle(targetElement,[
			{transition: "filter " + duration + "ms " + this.config.easingFunction},
			{filter: "brightness(1)"}
		]);
	}
	
	// Scroll the node into view with a small delay to let the highlight start
	setTimeout(function() {
		this.listWidget.dispatchEvent({type: "tm-scroll", target: targetElement});
	}.bind(this), 50);
};

PopStoryView.prototype.insert = function(widget) {
	var self = this;
	var targetElement = widget.findFirstDomNode(),
		duration = $tw.utils.getAnimationDuration() * this.config.animationScale;
	// Abandon if the list entry isn't a DOM element (it might be a text node)
	if(!targetElement || targetElement.nodeType === Node.TEXT_NODE) {
		return;
	}
	
	// Generate a unique ID for this element
	var elementId = "anim_" + Date.now() + "_" + Math.random();
	targetElement.setAttribute("data-animation-id", elementId);
	
	// Get the current dimensions of the tiddler
	var computedStyle = window.getComputedStyle(targetElement),
		currMarginBottom = parseInt(computedStyle.marginBottom,10),
		currMarginTop = parseInt(computedStyle.marginTop,10),
		currHeight = targetElement.offsetHeight + currMarginTop;
	
	// Build transform string with GPU acceleration
	var transformStart;
	if(this.config.useGPUAcceleration) {
		transformStart = "scale3d(" + this.config.insertScale + ", " + this.config.insertScale + ", 1)";
		if(this.config.insertRotation !== 0) {
			transformStart += " rotateZ(" + this.config.insertRotation + "deg)";
		}
	} else {
		transformStart = "scale(" + this.config.insertScale + ")";
		if(this.config.insertRotation !== 0) {
			transformStart += " rotate(" + this.config.insertRotation + "deg)";
		}
	}
	
	// Build filter string
	var filterStart = this.config.enableBlur ? "blur(5px)" : "none";
	
	// Build will-change property list
	var willChangeProps = ["transform", "opacity", "margin-bottom"];
	if(this.config.enableBlur) {
		willChangeProps.push("filter");
	}
	
	// Reset once the transition is over
	var cleanupTimeout = setTimeout(function() {
		delete self.animatingElements[elementId];
		if(targetElement.parentNode) {
			targetElement.removeAttribute("data-animation-id");
			$tw.utils.setStyle(targetElement,[
				{transition: ""},
				{transform: ""},
				{filter: ""},
				{opacity: ""},
				{willChange: ""},
				{marginBottom: ""},
				{zIndex: ""},
				{position: ""}
			]);
			$tw.utils.setStyle(widget.document.body,[
				{"overflow-x": ""}
			]);
		}
	}, duration + 100);
	
	// Store the animation info
	this.animatingElements[elementId] = {
		element: targetElement,
		timeout: cleanupTimeout,
		type: "insert"
	};
	
	// Prevent the page from overscrolling due to the zoom factor
	$tw.utils.setStyle(widget.document.body,[
		{"overflow-x": "hidden"}
	]);
	
	// Set up the initial position of the element
	var initialStyles = [
		{transition: "none"},
		{transform: transformStart},
		{filter: filterStart},
		{opacity: String(this.config.insertOpacity)},
		{transformOrigin: "center center"},
		{marginBottom: (-currHeight) + "px"},
		{position: "relative"},
		{zIndex: "1000"}
	];
	if(this.config.useWillChange) {
		initialStyles.push({willChange: willChangeProps.join(", ")});
	}
	$tw.utils.setStyle(targetElement, initialStyles);
	$tw.utils.forceLayout(targetElement);
	
	// Transition to the final position - use setTimeout to ensure initial styles are applied
	setTimeout(function() {
		var transitions = [
			$tw.utils.roundTripPropertyName("transform") + " " + duration + "ms " + self.config.easingFunction,
			"opacity " + duration + "ms " + self.config.easingFunction,
			"margin-bottom " + duration + "ms " + self.config.easingFunction
		];
		if(self.config.enableBlur) {
			transitions.push("filter " + duration + "ms " + self.config.easingFunction);
		}
		
		var finalTransform = self.config.useGPUAcceleration ? "scale3d(1, 1, 1) rotateZ(0deg)" : "scale(1) rotate(0deg)";
		
		$tw.utils.setStyle(targetElement,[
			{transition: transitions.join(", ")},
			{transform: finalTransform},
			{filter: "none"},
			{opacity: "1"},
			{marginBottom: currMarginBottom + "px"}
		]);
	}, 10);
};

PopStoryView.prototype.remove = function(widget) {
	var self = this;
	var targetElement = widget.findFirstDomNode(),
		duration = $tw.utils.getAnimationDuration() * this.config.animationScale,
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
	
	// Check if this element is still animating from an insert
	var animationId = targetElement.getAttribute("data-animation-id");
	if(animationId && this.animatingElements[animationId]) {
		// Cancel the pending cleanup
		clearTimeout(this.animatingElements[animationId].timeout);
		delete this.animatingElements[animationId];
		
		// Stop the current animation at its current state
		var currentStyle = window.getComputedStyle(targetElement);
		var currentOpacity = currentStyle.opacity;
		var currentTransform = currentStyle.transform;
		var currentFilter = currentStyle.filter;
		var currentMarginBottom = currentStyle.marginBottom;
		
		// Apply the current computed values to freeze the animation
		$tw.utils.setStyle(targetElement,[
			{transition: "none"},
			{opacity: currentOpacity},
			{transform: currentTransform},
			{filter: currentFilter},
			{marginBottom: currentMarginBottom}
		]);
		$tw.utils.forceLayout(targetElement);
	}
	
	// Get the current dimensions of the tiddler
	var computedStyle = window.getComputedStyle(targetElement),
		currMarginBottom = parseInt(computedStyle.marginBottom,10),
		currMarginTop = parseInt(computedStyle.marginTop,10),
		currHeight = targetElement.offsetHeight + currMarginTop;
	
	// Build transform string with GPU acceleration
	var transformEnd;
	if(this.config.useGPUAcceleration) {
		transformEnd = "scale3d(" + this.config.removeScale + ", " + this.config.removeScale + ", 1)";
		if(this.config.removeRotation !== 0) {
			transformEnd += " rotateZ(" + this.config.removeRotation + "deg)";
		}
	} else {
		transformEnd = "scale(" + this.config.removeScale + ")";
		if(this.config.removeRotation !== 0) {
			transformEnd += " rotate(" + this.config.removeRotation + "deg)";
		}
	}
	
	// Build filter string
	var filterEnd = this.config.enableBlur ? "blur(5px)" : "none";
	
	// Build will-change property list
	var willChangeProps = ["transform", "opacity", "margin-bottom"];
	if(this.config.enableBlur) {
		willChangeProps.push("filter");
	}
	
	// If not already animating, set up initial state
	if(!animationId) {
		var initialTransform = this.config.useGPUAcceleration ? "scale3d(1, 1, 1) rotateZ(0deg)" : "scale(1) rotate(0deg)";
		var initialStyles = [
			{transition: "none"},
			{transform: initialTransform},
			{filter: "none"},
			{opacity: "1"},
			{transformOrigin: "center center"},
			{marginBottom: currMarginBottom + "px"}
		];
		if(this.config.useWillChange) {
			initialStyles.push({willChange: willChangeProps.join(", ")});
		}
		$tw.utils.setStyle(targetElement, initialStyles);
		$tw.utils.forceLayout(targetElement);
	}
	
	// Remove the element at the end of the transition
	setTimeout(removeElement, duration);
	
	// Animate the removal - use setTimeout to ensure initial styles are applied
	setTimeout(function() {
		var transitions = [
			$tw.utils.roundTripPropertyName("transform") + " " + duration + "ms " + self.config.easingFunction,
			"opacity " + duration + "ms " + self.config.easingFunction,
			"margin-bottom " + duration + "ms " + self.config.easingFunction
		];
		if(self.config.enableBlur) {
			transitions.push("filter " + duration + "ms " + self.config.easingFunction);
		}
		
		$tw.utils.setStyle(targetElement,[
			{transition: transitions.join(", ")},
			{transform: transformEnd},
			{filter: filterEnd},
			{opacity: String(self.config.removeOpacity)},
			{marginBottom: (-currHeight) + "px"}
		]);
	}, 10);
};

exports.pop = PopStoryView;
