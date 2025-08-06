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
	this.animationFrame = null;
	this.animatingElements = {}; // Track elements currently animating with their timeout IDs
	
	// Load initial configuration
	this.loadConfig();
};

// Load configuration from tiddlers
ClassicStoryView.prototype.loadConfig = function() {
	this.config = {
		useGPUAcceleration: $tw.wiki.getTiddlerText("$:/config/AnimationGPUAcceleration") !== "no",
		usePreciseCalculations: $tw.wiki.getTiddlerText("$:/config/AnimationPreciseCalculations") !== "no",
		easingFunction: $tw.wiki.getTiddlerText("$:/config/AnimationEasing") || easing,
		insertAnimation: $tw.wiki.getTiddlerText("$:/config/ClassicStoryView/InsertAnimation") || "slide",
		removeAnimation: $tw.wiki.getTiddlerText("$:/config/ClassicStoryView/RemoveAnimation") || "slide",
		slideDirection: $tw.wiki.getTiddlerText("$:/config/ClassicStoryView/SlideDirection") || "left",
		animationScale: parseFloat($tw.wiki.getTiddlerText("$:/config/AnimationScale") || "1.0"),
		useWillChange: $tw.wiki.getTiddlerText("$:/config/AnimationWillChange") !== "no"
	};
};

// Called at the start of a refresh cycle
ClassicStoryView.prototype.refreshStart = function(changedTiddlers) {
	// Check if any of our config tiddlers changed
	if(changedTiddlers["$:/config/AnimationGPUAcceleration"] ||
	   changedTiddlers["$:/config/AnimationPreciseCalculations"] ||
	   changedTiddlers["$:/config/AnimationEasing"] ||
	   changedTiddlers["$:/config/ClassicStoryView/InsertAnimation"] ||
	   changedTiddlers["$:/config/ClassicStoryView/RemoveAnimation"] ||
	   changedTiddlers["$:/config/ClassicStoryView/SlideDirection"] ||
	   changedTiddlers["$:/config/AnimationScale"] ||
	   changedTiddlers["$:/config/AnimationWillChange"]) {
		this.loadConfig();
	}
};

// Helper method to apply GPU-accelerated styles
ClassicStoryView.prototype.applyGPUStyles = function(element, styles) {
	var gpuStyles = styles.slice();
	
	if(this.config.useGPUAcceleration) {
		// Use transform3d for GPU acceleration
		for(var i = 0; i < gpuStyles.length; i++) {
			if(gpuStyles[i].transform && gpuStyles[i].transform.indexOf("translateX") !== -1) {
				gpuStyles[i].transform = gpuStyles[i].transform.replace(/translateX\((.*?)\)/, "translate3d($1, 0, 0)");
			}
		}
		
		// Add will-change property for better performance
		if(this.config.useWillChange) {
			var willChangeProps = [];
			for(var j = 0; j < gpuStyles.length; j++) {
				if(gpuStyles[j].transform) willChangeProps.push("transform");
				if(gpuStyles[j].opacity) willChangeProps.push("opacity");
				if(gpuStyles[j].marginBottom) willChangeProps.push("margin-bottom");
			}
			if(willChangeProps.length > 0) {
				gpuStyles.push({willChange: willChangeProps.join(", ")});
			}
		}
	}
	
	$tw.utils.setStyle(element, gpuStyles);
};

// Helper method for precise animation calculations
ClassicStoryView.prototype.animateWithPrecision = function(element, fromStyles, toStyles, duration, callback) {
	var self = this;
	
	if(!this.config.usePreciseCalculations) {
		// Fall back to CSS transitions
		this.applyGPUStyles(element, toStyles);
		if(callback) {
			setTimeout(callback, duration);
		}
		return;
	}
	
	// Cancel any existing animation
	if(this.animationFrame) {
		cancelAnimationFrame(this.animationFrame);
	}
	
	var startTime = performance.now();
	var scaledDuration = duration * this.config.animationScale;
	
	function animate(currentTime) {
		var elapsed = currentTime - startTime;
		var progress = Math.min(elapsed / scaledDuration, 1);
		
		// Apply cubic-bezier easing manually for more precision
		var easedProgress = self.cubicBezier(progress, 0.645, 0.045, 0.355, 1);
		
		// Interpolate styles
		var currentStyles = [];
		for(var key in toStyles[0]) {
			if(fromStyles[key] !== undefined && toStyles[0][key] !== undefined) {
				var fromValue = parseFloat(fromStyles[key]) || 0;
				var toValue = parseFloat(toStyles[0][key]) || 0;
				var currentValue = fromValue + (toValue - fromValue) * easedProgress;
				var style = {};
				style[key] = currentValue + (toStyles[0][key].match(/[a-z%]+$/i) || [""])[0];
				currentStyles.push(style);
			}
		}
		
		self.applyGPUStyles(element, currentStyles);
		
		if(progress < 1) {
			self.animationFrame = requestAnimationFrame(animate);
		} else {
			self.animationFrame = null;
			if(callback) {
				callback();
			}
		}
	}
	
	this.animationFrame = requestAnimationFrame(animate);
};

// Cubic bezier implementation for precise easing
ClassicStoryView.prototype.cubicBezier = function(t, x1, y1, x2, y2) {
	// Newton-Raphson iteration for cubic bezier
	var epsilon = 0.001;
	var maxIterations = 10;
	
	function sampleCurveX(t) {
		return ((1 - t) * (1 - t) * (1 - t) * 0 + 3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t * 1);
	}
	
	function sampleCurveY(t) {
		return ((1 - t) * (1 - t) * (1 - t) * 0 + 3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t * t * y2 + t * t * t * 1);
	}
	
	function sampleCurveDerivativeX(t) {
		return 3 * (1 - t) * (1 - t) * (x1 - 0) + 6 * (1 - t) * t * (x2 - x1) + 3 * t * t * (1 - x2);
	}
	
	var x = t;
	for(var i = 0; i < maxIterations; i++) {
		var xError = sampleCurveX(x) - t;
		if(Math.abs(xError) < epsilon) {
			return sampleCurveY(x);
		}
		var d = sampleCurveDerivativeX(x);
		if(Math.abs(d) < epsilon) {
			break;
		}
		x = x - xError / d;
	}
	
	return sampleCurveY(x);
};

ClassicStoryView.prototype.navigateTo = function(historyInfo) {
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
	// Scroll the node into view
	this.listWidget.dispatchEvent({type: "tm-scroll", target: targetElement});
};

ClassicStoryView.prototype.insert = function(widget) {
	var self = this;
	var duration = $tw.utils.getAnimationDuration() * this.config.animationScale;
	if(duration) {
		var targetElement = widget.findFirstDomNode();
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
			currHeight = targetElement.offsetHeight + currMarginTop,
			currWidth = targetElement.offsetWidth;
		
		// Choose animation based on configuration
		var animationType = this.config.insertAnimation;
		
		// Track cleanup timeout
		var cleanupTimeout;
		
		if(animationType === "fade") {
			// Fade in animation
			this.applyGPUStyles(targetElement,[
				{transition: "none"},
				{opacity: "0.0"}
			]);
			$tw.utils.forceLayout(targetElement);
			this.applyGPUStyles(targetElement,[
				{transition: "opacity " + duration + "ms " + this.config.easingFunction},
				{opacity: "1.0"}
			]);
			// Clean up after animation
			cleanupTimeout = setTimeout(function() {
				delete self.animatingElements[elementId];
				if(targetElement.parentNode) {
					targetElement.removeAttribute("data-animation-id");
				}
			}, duration);
		} else if(animationType === "zoom") {
			// Zoom in animation with GPU acceleration
			this.applyGPUStyles(targetElement,[
				{transition: "none"},
				{transform: "scale3d(0.8, 0.8, 1)"},
				{opacity: "0.0"}
			]);
			$tw.utils.forceLayout(targetElement);
			this.applyGPUStyles(targetElement,[
				{transition: $tw.utils.roundTripPropertyName("transform") + " " + duration + "ms " + this.config.easingFunction + ", " +
							"opacity " + duration + "ms " + this.config.easingFunction},
				{transform: "scale3d(1, 1, 1)"},
				{opacity: "1.0"}
			]);
			// Clean up after animation
			cleanupTimeout = setTimeout(function() {
				delete self.animatingElements[elementId];
				if(targetElement.parentNode) {
					$tw.utils.setStyle(targetElement,[
						{transition: "none"},
						{transform: ""},
						{willChange: ""}
					]);
					targetElement.removeAttribute("data-animation-id");
				}
			}, duration);
		} else {
			// Default slide animation with GPU acceleration
			// Set up the initial position of the element
			this.applyGPUStyles(targetElement,[
				{transition: "none"},
				{marginBottom: (-currHeight) + "px"},
				{opacity: "0.0"},
				{transform: "translate3d(0, 0, 0)"} // Force GPU layer
			]);
			$tw.utils.forceLayout(targetElement);
			// Transition to the final position
			this.applyGPUStyles(targetElement,[
				{transition: "opacity " + duration + "ms " + this.config.easingFunction + ", " +
							"margin-bottom " + duration + "ms " + this.config.easingFunction + ", " +
							$tw.utils.roundTripPropertyName("transform") + " " + duration + "ms " + this.config.easingFunction},
				{marginBottom: currMarginBottom + "px"},
				{opacity: "1.0"},
				{transform: "translate3d(0, 0, 0)"}
			]);
			// Reset the margin once the transition is over
			cleanupTimeout = setTimeout(function() {
				delete self.animatingElements[elementId];
				if(targetElement.parentNode) {
					$tw.utils.setStyle(targetElement,[
						{transition: "none"},
						{transform: ""},
						{marginBottom: ""},
						{willChange: ""}
					]);
					targetElement.removeAttribute("data-animation-id");
				}
			}, duration);
		}
		
		// Store the cleanup timeout so we can cancel it if needed
		this.animatingElements[elementId] = {
			element: targetElement,
			timeout: cleanupTimeout,
			type: "insert"
		};
	}
};

ClassicStoryView.prototype.remove = function(widget) {
	var self = this;
	var duration = $tw.utils.getAnimationDuration() * this.config.animationScale;
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
			var currentMarginBottom = currentStyle.marginBottom;
			
			// Apply the current computed values to freeze the animation
			this.applyGPUStyles(targetElement,[
				{transition: "none"},
				{opacity: currentOpacity},
				{transform: currentTransform},
				{marginBottom: currentMarginBottom}
			]);
			$tw.utils.forceLayout(targetElement);
		}
		// Get the current dimensions of the tiddler
		var currWidth = targetElement.offsetWidth,
			computedStyle = window.getComputedStyle(targetElement),
			currMarginBottom = parseInt(computedStyle.marginBottom,10),
			currMarginTop = parseInt(computedStyle.marginTop,10),
			currHeight = targetElement.offsetHeight + currMarginTop;
		
		// Choose animation based on configuration
		var animationType = this.config.removeAnimation;
		
		// Remove the dom nodes of the widget at the end of the transition
		setTimeout(removeElement, duration);
		
		if(animationType === "fade") {
			// Fade out animation
			this.applyGPUStyles(targetElement,[
				{transition: "none"},
				{opacity: "1.0"}
			]);
			$tw.utils.forceLayout(targetElement);
			this.applyGPUStyles(targetElement,[
				{transition: "opacity " + duration + "ms " + this.config.easingFunction},
				{opacity: "0.0"}
			]);
		} else if(animationType === "zoom") {
			// Zoom out animation with GPU acceleration
			this.applyGPUStyles(targetElement,[
				{transition: "none"},
				{transform: "scale3d(1, 1, 1)"},
				{opacity: "1.0"}
			]);
			$tw.utils.forceLayout(targetElement);
			this.applyGPUStyles(targetElement,[
				{transition: $tw.utils.roundTripPropertyName("transform") + " " + duration + "ms " + this.config.easingFunction + ", " +
							"opacity " + duration + "ms " + this.config.easingFunction},
				{transform: "scale3d(0.8, 0.8, 1)"},
				{opacity: "0.0"}
			]);
		} else if(animationType === "slideOut") {
			// Slide out horizontally with GPU acceleration (no collapse)
			var slideX = this.config.slideDirection === "right" ? currWidth : -currWidth;
			this.applyGPUStyles(targetElement,[
				{transition: "none"},
				{transform: "translate3d(0, 0, 0)"},
				{opacity: "1.0"}
			]);
			$tw.utils.forceLayout(targetElement);
			this.applyGPUStyles(targetElement,[
				{transition: $tw.utils.roundTripPropertyName("transform") + " " + duration + "ms " + this.config.easingFunction + ", " +
							"opacity " + duration + "ms " + this.config.easingFunction},
				{transform: "translate3d(" + slideX + "px, 0, 0)"},
				{opacity: "0.0"}
			]);
		} else {
			// Default slide animation with GPU acceleration and collapse
			var slideX = this.config.slideDirection === "right" ? currWidth : -currWidth;
			this.applyGPUStyles(targetElement,[
				{transition: "none"},
				{transform: "translate3d(0, 0, 0)"},
				{marginBottom: currMarginBottom + "px"},
				{opacity: "1.0"}
			]);
			$tw.utils.forceLayout(targetElement);
			this.applyGPUStyles(targetElement,[
				{transition: $tw.utils.roundTripPropertyName("transform") + " " + duration + "ms " + this.config.easingFunction + ", " +
							"opacity " + duration + "ms " + this.config.easingFunction + ", " +
							"margin-bottom " + duration + "ms " + this.config.easingFunction},
				{transform: "translate3d(" + slideX + "px, 0, 0)"},
				{marginBottom: (-currHeight) + "px"},
				{opacity: "0.0"}
			]);
		}
	} else {
		widget.removeChildDomNodes();
	}
};

// Clean up method to cancel any running animations
ClassicStoryView.prototype.cleanup = function() {
	if(this.animationFrame) {
		cancelAnimationFrame(this.animationFrame);
		this.animationFrame = null;
	}
};

exports.classic = ClassicStoryView;
