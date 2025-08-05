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
	// Track elements being pushed down by insertions
	this.elementsBeingPushed = {};
	// Pre-calculate will-change values for GPU optimization
	this.insertWillChange = "transform, opacity";
	this.removeWillChange = "transform, opacity, max-height";
	
	// Load configuration options
	this.loadConfig();
};

// Load configuration from tiddlers
ClassicStoryView.prototype.loadConfig = function() {
	var wiki = this.listWidget.wiki;
	
	// Store previous config for comparison
	var previousConfig = this.config ? JSON.stringify(this.config) : null;
	
	// Animation configuration
	this.config = {
		// Insert animation settings
		insertAnimation: wiki.getTiddlerText("$:/config/StoryView/Classic/InsertAnimation", "slide-down"), // slide-down, fade, slide-right, zoom
		insertEasing: wiki.getTiddlerText("$:/config/StoryView/Classic/InsertEasing", easing),
		
		// Remove animation settings  
		removeAnimation: wiki.getTiddlerText("$:/config/StoryView/Classic/RemoveAnimation", "slide-left"), // slide-left, fade, slide-right, shrink
		removeEasing: wiki.getTiddlerText("$:/config/StoryView/Classic/RemoveEasing", easing),
		
		// Navigate settings
		navigateScrollBehavior: wiki.getTiddlerText("$:/config/StoryView/Classic/NavigateScrollBehavior", "smooth"), // smooth, instant
		navigateScrollOffset: parseInt(wiki.getTiddlerText("$:/config/StoryView/Classic/NavigateScrollOffset", "0"), 10) || 0,
		
		// Performance settings
		useGPU: wiki.getTiddlerText("$:/config/StoryView/Classic/UseGPU", "yes") === "yes",
		animateSimultaneous: wiki.getTiddlerText("$:/config/StoryView/Classic/AnimateSimultaneous", "yes") === "yes",
		maxSimultaneousAnimations: parseInt(wiki.getTiddlerText("$:/config/StoryView/Classic/MaxSimultaneousAnimations", "5"), 10) || 5
	};
	
	// Check if configuration changed
	if(previousConfig && previousConfig !== JSON.stringify(this.config)) {
		this.handleConfigChange();
	}
};

// Handle configuration changes
ClassicStoryView.prototype.handleConfigChange = function() {
	// Clear any ongoing animations to prevent conflicts
	var self = this;
	
	// Cancel all current animations
	Object.keys(this.animationsInProgress).forEach(function(animId) {
		delete self.animationsInProgress[animId];
	});
	
	// Clear pushed elements tracking
	Object.keys(this.elementsBeingPushed).forEach(function(pushId) {
		delete self.elementsBeingPushed[pushId];
	});
	
	// Update will-change values based on new config
	if(this.config.useGPU) {
		this.insertWillChange = "transform, opacity";
		this.removeWillChange = "transform, opacity, max-height";
	} else {
		this.insertWillChange = "opacity";
		this.removeWillChange = "opacity, max-height";
	}
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
		
		// Check if we should limit simultaneous animations
		if(!self.config.animateSimultaneous) {
			var animCount = Object.keys(self.animationsInProgress).length;
			if(animCount >= self.config.maxSimultaneousAnimations) {
				return;
			}
		}
		
		// Generate unique ID for tracking
		var animId = "anim_" + Date.now() + "_" + Math.random();
		self.animationsInProgress[animId] = true;
		
		// Get measurements
		var computedStyle = window.getComputedStyle(targetElement);
		var currMarginBottom = parseFloat(computedStyle.marginBottom) || 0;
		var currMarginTop = parseFloat(computedStyle.marginTop) || 0;
		
		// Use scrollHeight for more accurate height including clearfix
		var currHeight = targetElement.scrollHeight;
		var currWidth = targetElement.offsetWidth;
		
		// Ensure minimum height to prevent collapse issues
		if(currHeight < 1) {
			currHeight = targetElement.offsetHeight;
		}
		
		// Find elements below that might be animating
		var nextSibling = targetElement.nextElementSibling;
		var elementsToAdjust = [];
		while(nextSibling) {
			if(nextSibling.dataset && nextSibling.dataset.animating === "true") {
				elementsToAdjust.push(nextSibling);
			}
			nextSibling = nextSibling.nextElementSibling;
		}
		
		// Set up initial state based on animation type
		var initialStyles = [{transition: "none"}, {opacity: "0"}];
		var finalStyles = [{opacity: "1"}];
		var transitions = ["opacity " + duration + "ms " + self.config.insertEasing];
		var willChange = ["opacity"];
		
		// Mark element as animating
		if(targetElement.dataset) {
			targetElement.dataset.animating = "true";
		}
		
		if(self.config.useGPU) {
			initialStyles.push({transform: "translate3d(0, 0, 0)"});
		}
		
		// For slide-down animation, we need special handling
		if(self.config.insertAnimation === "slide-down") {
			// Use height animation with proper overflow handling
			initialStyles.push({height: "0px"});
			initialStyles.push({overflow: "hidden"});
			initialStyles.push({marginTop: currMarginTop + "px"});
			initialStyles.push({marginBottom: currMarginBottom + "px"});
			// Ensure clearfix doesn't interfere
			initialStyles.push({minHeight: "0"});
			
			// If there are elements below that are animating, push them smoothly
			if(elementsToAdjust.length > 0) {
				elementsToAdjust.forEach(function(elem) {
					var currentTransform = window.getComputedStyle(elem).transform;
					var currentY = 0;
					if(currentTransform && currentTransform !== "none") {
						var matrix = new DOMMatrix(currentTransform);
						currentY = matrix.m42; // Get Y translation
					}
					
					// Add to pushed elements tracking
					var pushId = "push_" + Date.now() + "_" + Math.random();
					self.elementsBeingPushed[pushId] = elem;
					
					// Apply smooth push down
					$tw.utils.setStyle(elem, [
						{transition: $tw.utils.roundTripPropertyName("transform") + " " + duration + "ms " + self.config.insertEasing},
						{transform: "translate3d(0, " + (currentY + currHeight + currMarginTop + currMarginBottom) + "px, 0)"}
					]);
					
					// Clean up after animation
					setTimeout(function() {
						if(elem.parentNode) {
							$tw.utils.setStyle(elem, [
								{transition: ""},
								{transform: ""}
							]);
						}
						delete self.elementsBeingPushed[pushId];
					}, duration);
				});
			}
			
			finalStyles.push({height: currHeight + "px"});
			transitions.push("height " + duration + "ms " + self.config.insertEasing);
			willChange.push("height");
		} else {
			// Handle other animation types as before
			switch(self.config.insertAnimation) {
				case "slide-right":
					initialStyles.push({transform: "translate3d(-100%, 0, 0)"});
					finalStyles.push({transform: "translate3d(0, 0, 0)"});
					transitions.push($tw.utils.roundTripPropertyName("transform") + " " + duration + "ms " + self.config.insertEasing);
					willChange.push("transform");
					break;
				case "zoom":
					initialStyles.push({transform: "translate3d(0, 0, 0) scale(0.5)"});
					finalStyles.push({transform: "translate3d(0, 0, 0) scale(1)"});
					transitions.push($tw.utils.roundTripPropertyName("transform") + " " + duration + "ms " + self.config.insertEasing);
					willChange.push("transform");
					break;
				case "fade":
				default:
					// For fade, still use margin animation but smoother
					initialStyles.push({marginBottom: (-currHeight - currMarginTop) + "px"});
					finalStyles.push({marginBottom: currMarginBottom + "px"});
					transitions.push("margin-bottom " + duration + "ms " + self.config.insertEasing);
					willChange.push("margin-bottom");
					break;
			}
		}
		
		initialStyles.push({willChange: willChange.join(", ")});
		
		// Apply initial state
		$tw.utils.setStyle(targetElement, initialStyles);
		$tw.utils.forceLayout(targetElement);
		
		// Apply transition
		finalStyles.unshift({transition: transitions.join(", ")});
		$tw.utils.setStyle(targetElement, finalStyles);
		
		// Clean up after animation
		setTimeout(function() {
			if(targetElement.parentNode) {
				$tw.utils.setStyle(targetElement,[
					{transition: ""},
					{marginBottom: ""},
					{marginTop: ""},
					{height: ""},
					{opacity: ""},
					{transform: ""},
					{overflow: ""},
					{willChange: ""}
				]);
				if(targetElement.dataset) {
					delete targetElement.dataset.animating;
				}
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
		
		// Check if we should limit simultaneous animations
		if(!self.config.animateSimultaneous) {
			var animCount = Object.keys(self.animationsInProgress).length;
			if(animCount >= self.config.maxSimultaneousAnimations) {
				removeElement();
				return;
			}
		}
		
		// Generate unique ID for tracking
		var animId = "anim_" + Date.now() + "_" + Math.random();
		self.animationsInProgress[animId] = true;
		
		// Get measurements
		var currWidth = targetElement.offsetWidth;
		var computedStyle = window.getComputedStyle(targetElement);
		var currMarginBottom = parseFloat(computedStyle.marginBottom) || 0;
		var currMarginTop = parseFloat(computedStyle.marginTop) || 0;
		// Use scrollHeight for accurate measurement including clearfix
		var currHeight = targetElement.scrollHeight + currMarginTop;
		
		// Set up initial state
		var initialStyles = [{transition: "none"}, {opacity: "1"}];
		var finalStyles = [{opacity: "0"}];
		var transitions = ["opacity " + duration + "ms " + self.config.removeEasing];
		var willChange = ["opacity"];
		
		if(self.config.useGPU) {
			initialStyles.push({transform: "translate3d(0, 0, 0)"});
		}
		
		switch(self.config.removeAnimation) {
			case "slide-left":
				initialStyles.push({marginBottom: currMarginBottom + "px"});
				finalStyles.push({transform: "translate3d(-" + currWidth + "px, 0, 0)"});
				finalStyles.push({marginBottom: (-currHeight) + "px"});
				transitions.push($tw.utils.roundTripPropertyName("transform") + " " + duration + "ms " + self.config.removeEasing);
				transitions.push("margin-bottom " + duration + "ms " + self.config.removeEasing);
				willChange.push("transform", "margin-bottom");
				break;
			case "slide-right":
				initialStyles.push({marginBottom: currMarginBottom + "px"});
				finalStyles.push({transform: "translate3d(" + currWidth + "px, 0, 0)"});
				finalStyles.push({marginBottom: (-currHeight) + "px"});
				transitions.push($tw.utils.roundTripPropertyName("transform") + " " + duration + "ms " + self.config.removeEasing);
				transitions.push("margin-bottom " + duration + "ms " + self.config.removeEasing);
				willChange.push("transform", "margin-bottom");
				break;
			case "shrink":
				initialStyles.push({transform: "translate3d(0, 0, 0) scale(1)"});
				initialStyles.push({transformOrigin: "center center"});
				finalStyles.push({transform: "translate3d(0, 0, 0) scale(0)"});
				finalStyles.push({marginBottom: (-currHeight) + "px"});
				transitions.push($tw.utils.roundTripPropertyName("transform") + " " + duration + "ms " + self.config.removeEasing);
				transitions.push("margin-bottom " + duration + "ms " + self.config.removeEasing);
				willChange.push("transform", "margin-bottom");
				break;
			case "fade":
			default:
				// Just fade out with height collapse
				finalStyles.push({marginBottom: (-currHeight) + "px"});
				transitions.push("margin-bottom " + duration + "ms " + self.config.removeEasing);
				willChange.push("margin-bottom");
				break;
		}
		
		initialStyles.push({willChange: willChange.join(", ")});
		
		// Apply initial state
		$tw.utils.setStyle(targetElement, initialStyles);
		$tw.utils.forceLayout(targetElement);
		
		// Apply transition
		finalStyles.unshift({transition: transitions.join(", ")});
		$tw.utils.setStyle(targetElement, finalStyles);
		
		// Remove element after animation completes
		setTimeout(function() {
			removeElement();
			delete self.animationsInProgress[animId];
		}, duration);
	} else {
		widget.removeChildDomNodes();
	}
};

// Refresh the story view - called when the list widget refreshes
ClassicStoryView.prototype.refreshStart = function(changedTiddlers,changedAttributes) {
	// Check if any configuration tiddlers have changed
	var configTiddlers = [
		"$:/config/StoryView/Classic/InsertAnimation",
		"$:/config/StoryView/Classic/InsertEasing",
		"$:/config/StoryView/Classic/RemoveAnimation",
		"$:/config/StoryView/Classic/RemoveEasing",
		"$:/config/StoryView/Classic/NavigateScrollBehavior",
		"$:/config/StoryView/Classic/NavigateScrollOffset",
		"$:/config/StoryView/Classic/UseGPU",
		"$:/config/StoryView/Classic/AnimateSimultaneous",
		"$:/config/StoryView/Classic/MaxSimultaneousAnimations"
	];
	
	var configChanged = false;
	for(var i = 0; i < configTiddlers.length; i++) {
		if(changedTiddlers[configTiddlers[i]]) {
			configChanged = true;
			break;
		}
	}
	
	// Reload configuration if any config tiddler changed
	if(configChanged) {
		this.loadConfig();
	}
};

ClassicStoryView.prototype.refreshEnd = function(changedTiddlers,changedAttributes) {
	// Called after refresh cycle completes
	// Currently not needed for classic storyview
};

exports.classic = ClassicStoryView;
