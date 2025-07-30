/*\
title: $:/core/modules/utils/dom/animations/slide.js
type: application/javascript
module-type: animation

A simple slide animation that varies the height of the element

\*/

"use strict";

// Helper function to get current computed dimensions during animation
function getCurrentDimensions(domNode, isHorizontal) {
	var computedStyle = window.getComputedStyle(domNode);
	if(isHorizontal) {
		return {
			size: parseFloat(computedStyle.width) || 0,
			marginStart: parseFloat(computedStyle.marginLeft) || 0,
			marginEnd: parseFloat(computedStyle.marginRight) || 0,
			paddingStart: parseFloat(computedStyle.paddingLeft) || 0,
			paddingEnd: parseFloat(computedStyle.paddingRight) || 0,
			opacity: parseFloat(computedStyle.opacity) || 0
		};
	} else {
		return {
			size: parseFloat(computedStyle.height) || 0,
			marginStart: parseFloat(computedStyle.marginTop) || 0,
			marginEnd: parseFloat(computedStyle.marginBottom) || 0,
			paddingStart: parseFloat(computedStyle.paddingTop) || 0,
			paddingEnd: parseFloat(computedStyle.paddingBottom) || 0,
			opacity: parseFloat(computedStyle.opacity) || 0
		};
	}
}

// Helper to check if element is currently animating
function isAnimating(domNode) {
	return domNode.dataset.slideAnimating === "true";
}

// Helper to mark animation state
function setAnimating(domNode, state) {
	if(state) {
		domNode.dataset.slideAnimating = "true";
	} else {
		delete domNode.dataset.slideAnimating;
	}
}

function slideOpen(domNode,options) {
	options = options || {};
	var duration = options.duration || $tw.utils.getAnimationDuration();
	var direction = options.direction || "vertical";
	var isHorizontal = direction === "horizontal";
	var origin = options.origin || (isHorizontal ? "left" : "top");
	
	// If currently animating, capture current state
	var startState;
	var needsTargetDimensions = true;
	
	if(isAnimating(domNode)) {
		startState = getCurrentDimensions(domNode, isHorizontal);
		// Remove any existing transition end handlers
		var oldHandler = domNode._slideTransitionHandler;
		if(oldHandler) {
			domNode.removeEventListener("transitionend", oldHandler);
		}
		// Always recalculate target dimensions when opening
		// (the element's natural size may have changed while it was closing)
		needsTargetDimensions = true;
	} else {
		startState = {
			size: 0,
			marginStart: 0,
			marginEnd: 0,
			paddingStart: 0,
			paddingEnd: 0,
			opacity: 0
		};
	}
	
	// Get or update target dimensions
	if(needsTargetDimensions) {
		// If we're in the middle of an animation, we need to temporarily reset the element
		// to get its natural dimensions
		var originalStyles = {};
		if(isAnimating(domNode)) {
			// Store current styles
			originalStyles.height = domNode.style.height;
			originalStyles.width = domNode.style.width;
			originalStyles.transition = domNode.style.transition;
			
			// Temporarily reset to get natural dimensions
			domNode.style.transition = "none";
			domNode.style.height = "";
			domNode.style.width = "";
			$tw.utils.forceLayout(domNode);
		}
		
		var computedStyle = window.getComputedStyle(domNode),
			targetMarginBottom = parseInt(computedStyle.marginBottom,10),
			targetMarginTop = parseInt(computedStyle.marginTop,10),
			targetMarginLeft = parseInt(computedStyle.marginLeft,10),
			targetMarginRight = parseInt(computedStyle.marginRight,10),
			targetPaddingBottom = parseInt(computedStyle.paddingBottom,10),
			targetPaddingTop = parseInt(computedStyle.paddingTop,10),
			targetPaddingLeft = parseInt(computedStyle.paddingLeft,10),
			targetPaddingRight = parseInt(computedStyle.paddingRight,10),
			targetHeight = domNode.offsetHeight,
			targetWidth = domNode.offsetWidth;
			
		// Restore original styles if we changed them
		if(isAnimating(domNode)) {
			domNode.style.height = originalStyles.height;
			domNode.style.width = originalStyles.width;
			domNode.style.transition = originalStyles.transition;
		}
		
		// Store target dimensions for potential interruption
		domNode._slideTargetDimensions = {
			marginBottom: targetMarginBottom,
			marginTop: targetMarginTop,
			marginLeft: targetMarginLeft,
			marginRight: targetMarginRight,
			paddingBottom: targetPaddingBottom,
			paddingTop: targetPaddingTop,
			paddingLeft: targetPaddingLeft,
			paddingRight: targetPaddingRight,
			height: targetHeight,
			width: targetWidth
		};
	}
	
	// Mark as animating
	setAnimating(domNode, true);
	
	// Reset the properties once the transition is over
	var transitionEndHandler = function() {
		domNode.removeEventListener("transitionend", transitionEndHandler);
		delete domNode._slideTransitionHandler;
		setAnimating(domNode, false);
		$tw.utils.setStyle(domNode,[
			{transition: ""},
			{marginBottom: ""},
			{marginTop: ""},
			{marginLeft: ""},
			{marginRight: ""},
			{paddingBottom: ""},
			{paddingTop: ""},
			{paddingLeft: ""},
			{paddingRight: ""},
			{height: ""},
			{width: ""},
			{opacity: ""},
			{overflow: ""},
			{willChange: ""}
		]);
		delete domNode._slideTargetDimensions;
		if(options.callback) {
			options.callback();
		}
	};
	
	// Store handler reference for potential interruption
	domNode._slideTransitionHandler = transitionEndHandler;
	
	// Set up the initial position
	$tw.utils.setStyle(domNode,[{transition: "none"}]);
	
	var targets = domNode._slideTargetDimensions;
	
	if(isHorizontal) {
		// For horizontal slides, the approach depends on origin
		if(origin === "right") {
			// For right origin, we use negative margin-left to hide the element
			$tw.utils.setStyle(domNode,[
				{marginLeft: (-targets.width - targets.marginLeft - targets.marginRight - targets.paddingLeft - targets.paddingRight) + "px"},
				{marginRight: targets.marginRight + "px"},
				{paddingLeft: targets.paddingLeft + "px"},
				{paddingRight: targets.paddingRight + "px"},
				{width: targets.width + "px"},
				{opacity: startState.opacity},
				{overflow: "hidden"},
				{willChange: "margin-left, opacity"}
			]);
		} else if(origin === "center") {
			// For center origin, start with zero width and center margins
			var totalWidth = targets.width + targets.paddingLeft + targets.paddingRight;
			$tw.utils.setStyle(domNode,[
				{marginLeft: (totalWidth / 2) + targets.marginLeft + "px"},
				{marginRight: (totalWidth / 2) + targets.marginRight + "px"},
				{paddingLeft: startState.paddingStart + "px"},
				{paddingRight: startState.paddingEnd + "px"},
				{width: startState.size + "px"},
				{opacity: startState.opacity},
				{overflow: "hidden"},
				{willChange: "width, opacity, margin-left, margin-right, padding-left, padding-right"}
			]);
		} else {
			// Default left origin
			$tw.utils.setStyle(domNode,[
				{marginLeft: startState.marginStart + "px"},
				{marginRight: startState.marginEnd + "px"},
				{paddingLeft: startState.paddingStart + "px"},
				{paddingRight: startState.paddingEnd + "px"},
				{width: startState.size + "px"},
				{opacity: startState.opacity},
				{overflow: "hidden"},
				{willChange: "width, opacity, margin-left, margin-right, padding-left, padding-right"}
			]);
		}
	} else {
		// For vertical slides
		if(origin === "bottom") {
			// For bottom origin, use negative margin-top to hide the element
			$tw.utils.setStyle(domNode,[
				{marginTop: (-targets.height - targets.marginTop - targets.marginBottom - targets.paddingTop - targets.paddingBottom) + "px"},
				{marginBottom: targets.marginBottom + "px"},
				{paddingTop: targets.paddingTop + "px"},
				{paddingBottom: targets.paddingBottom + "px"},
				{height: targets.height + "px"},
				{opacity: startState.opacity},
				{overflow: "hidden"},
				{willChange: "margin-top, opacity"}
			]);
		} else if(origin === "center") {
			// For center origin, start with zero height and center margins
			var totalHeight = targets.height + targets.paddingTop + targets.paddingBottom;
			$tw.utils.setStyle(domNode,[
				{marginTop: (totalHeight / 2) + targets.marginTop + "px"},
				{marginBottom: (totalHeight / 2) + targets.marginBottom + "px"},
				{paddingTop: startState.paddingStart + "px"},
				{paddingBottom: startState.paddingEnd + "px"},
				{height: startState.size + "px"},
				{opacity: startState.opacity},
				{overflow: "hidden"},
				{willChange: "height, opacity, margin-top, margin-bottom, padding-top, padding-bottom"}
			]);
		} else {
			// Default top origin
			$tw.utils.setStyle(domNode,[
				{marginTop: startState.marginStart + "px"},
				{marginBottom: startState.marginEnd + "px"},
				{paddingTop: startState.paddingStart + "px"},
				{paddingBottom: startState.paddingEnd + "px"},
				{height: startState.size + "px"},
				{opacity: startState.opacity},
				{overflow: "hidden"},
				{willChange: "height, opacity, margin-top, margin-bottom, padding-top, padding-bottom"}
			]);
		}
	}
	
	$tw.utils.forceLayout(domNode);
	
	// Add transition end listener
	domNode.addEventListener("transitionend", transitionEndHandler);
	
	// Transition to the final position
	var easing = options.easing || "cubic-bezier(0.4, 0.0, 0.2, 1)";
	
	if(isHorizontal) {
		// Different transitions based on origin
		if(origin === "right") {
			// For right origin, we only animate margin-left
			$tw.utils.setStyle(domNode,[
				{transition: "margin-left " + duration + "ms " + easing + ", " +
							"opacity " + duration + "ms " + easing},
				{marginLeft: targets.marginLeft + "px"},
				{opacity: "1"}
			]);
		} else if(origin === "center") {
			// For center origin, animate width and margins
			$tw.utils.setStyle(domNode,[
				{transition: "margin-left " + duration + "ms " + easing + ", " +
							"margin-right " + duration + "ms " + easing + ", " +
							"padding-left " + duration + "ms " + easing + ", " +
							"padding-right " + duration + "ms " + easing + ", " +
							"width " + duration + "ms " + easing + ", " +
							"opacity " + duration + "ms " + easing},
				{marginLeft: targets.marginLeft + "px"},
				{marginRight: targets.marginRight + "px"},
				{paddingLeft: targets.paddingLeft + "px"},
				{paddingRight: targets.paddingRight + "px"},
				{width: targets.width + "px"},
				{opacity: "1"}
			]);
		} else {
			// Default left origin
			$tw.utils.setStyle(domNode,[
				{transition: "margin-left " + duration + "ms " + easing + ", " +
							"margin-right " + duration + "ms " + easing + ", " +
							"padding-left " + duration + "ms " + easing + ", " +
							"padding-right " + duration + "ms " + easing + ", " +
							"width " + duration + "ms " + easing + ", " +
							"opacity " + duration + "ms " + easing},
				{marginLeft: targets.marginLeft + "px"},
				{marginRight: targets.marginRight + "px"},
				{paddingLeft: targets.paddingLeft + "px"},
				{paddingRight: targets.paddingRight + "px"},
				{width: targets.width + "px"},
				{opacity: "1"}
			]);
		}
	} else {
		// Different transitions based on origin for vertical
		if(origin === "bottom") {
			// For bottom origin, we only animate margin-top
			$tw.utils.setStyle(domNode,[
				{transition: "margin-top " + duration + "ms " + easing + ", " +
							"opacity " + duration + "ms " + easing},
				{marginTop: targets.marginTop + "px"},
				{opacity: "1"}
			]);
		} else if(origin === "center") {
			// For center origin, animate height and margins
			$tw.utils.setStyle(domNode,[
				{transition: "margin-top " + duration + "ms " + easing + ", " +
							"margin-bottom " + duration + "ms " + easing + ", " +
							"padding-top " + duration + "ms " + easing + ", " +
							"padding-bottom " + duration + "ms " + easing + ", " +
							"height " + duration + "ms " + easing + ", " +
							"opacity " + duration + "ms " + easing},
				{marginTop: targets.marginTop + "px"},
				{marginBottom: targets.marginBottom + "px"},
				{paddingTop: targets.paddingTop + "px"},
				{paddingBottom: targets.paddingBottom + "px"},
				{height: targets.height + "px"},
				{opacity: "1"}
			]);
		} else {
			// Default top origin
			$tw.utils.setStyle(domNode,[
				{transition: "margin-top " + duration + "ms " + easing + ", " +
							"margin-bottom " + duration + "ms " + easing + ", " +
							"padding-top " + duration + "ms " + easing + ", " +
							"padding-bottom " + duration + "ms " + easing + ", " +
							"height " + duration + "ms " + easing + ", " +
							"opacity " + duration + "ms " + easing},
				{marginBottom: targets.marginBottom + "px"},
				{marginTop: targets.marginTop + "px"},
				{paddingBottom: targets.paddingBottom + "px"},
				{paddingTop: targets.paddingTop + "px"},
				{height: targets.height + "px"},
				{opacity: "1"}
			]);
		}
	}
}

function slideClosed(domNode,options) {
	options = options || {};
	var duration = options.duration || $tw.utils.getAnimationDuration();
	var direction = options.direction || "vertical";
	var isHorizontal = direction === "horizontal";
	var origin = options.origin || (isHorizontal ? "left" : "top");
	
	// If currently animating, capture current state
	var startState;
	if(isAnimating(domNode)) {
		startState = getCurrentDimensions(domNode, isHorizontal);
		// Remove any existing transition end handlers
		var oldHandler = domNode._slideTransitionHandler;
		if(oldHandler) {
			domNode.removeEventListener("transitionend", oldHandler);
		}
		// Adjust duration based on current progress
		var progress = startState.opacity; // Use opacity as progress indicator
		duration = Math.round(duration * progress);
	} else {
		// Normal starting state
		startState = {
			size: isHorizontal ? domNode.offsetWidth : domNode.offsetHeight,
			marginStart: parseFloat(window.getComputedStyle(domNode)[isHorizontal ? "marginLeft" : "marginTop"]) || 0,
			marginEnd: parseFloat(window.getComputedStyle(domNode)[isHorizontal ? "marginRight" : "marginBottom"]) || 0,
			paddingStart: parseFloat(window.getComputedStyle(domNode)[isHorizontal ? "paddingLeft" : "paddingTop"]) || 0,
			paddingEnd: parseFloat(window.getComputedStyle(domNode)[isHorizontal ? "paddingRight" : "paddingBottom"]) || 0,
			opacity: 1
		};
	}
	
	// Mark as animating
	setAnimating(domNode, true);
	
	// Clear the properties when animation is over
	var transitionEndHandler = function() {
		domNode.removeEventListener("transitionend", transitionEndHandler);
		delete domNode._slideTransitionHandler;
		setAnimating(domNode, false);
		$tw.utils.setStyle(domNode,[
			{transition: ""},
			{marginBottom: ""},
			{marginTop: ""},
			{marginLeft: ""},
			{marginRight: ""},
			{paddingBottom: ""},
			{paddingTop: ""},
			{paddingLeft: ""},
			{paddingRight: ""},
			{height: ""},
			{width: ""},
			{opacity: ""},
			{overflow: ""},
			{willChange: ""}
		]);
		delete domNode._slideTargetDimensions;
		if(options.callback) {
			options.callback();
		}
	};
	
	// Store handler reference
	domNode._slideTransitionHandler = transitionEndHandler;
	
	// Set up the initial position
	$tw.utils.setStyle(domNode,[{transition: "none"}]);
	
	if(isHorizontal) {
		$tw.utils.setStyle(domNode,[
			{width: startState.size + "px"},
			{marginLeft: startState.marginStart + "px"},
			{marginRight: startState.marginEnd + "px"},
			{paddingLeft: startState.paddingStart + "px"},
			{paddingRight: startState.paddingEnd + "px"},
			{opacity: startState.opacity},
			{overflow: "hidden"},
			{willChange: "width, opacity, margin-left, margin-right, padding-left, padding-right"}
		]);
	} else {
		$tw.utils.setStyle(domNode,[
			{height: startState.size + "px"},
			{marginTop: startState.marginStart + "px"},
			{marginBottom: startState.marginEnd + "px"},
			{paddingTop: startState.paddingStart + "px"},
			{paddingBottom: startState.paddingEnd + "px"},
			{opacity: startState.opacity},
			{overflow: "hidden"},
			{willChange: "height, opacity, margin-top, margin-bottom, padding-top, padding-bottom"}
		]);
	}
	
	$tw.utils.forceLayout(domNode);
	
	// Add transition end listener
	domNode.addEventListener("transitionend", transitionEndHandler);
	
	// Transition to the final position
	var easing = options.easing || "cubic-bezier(0.4, 0.0, 0.2, 1)";
	
	// Get computed style for calculating negative margins
	var computedStyle = window.getComputedStyle(domNode);
	var currentWidth = domNode.offsetWidth;
	var currentHeight = domNode.offsetHeight;
	var marginLeft = parseInt(computedStyle.marginLeft, 10) || 0;
	var marginRight = parseInt(computedStyle.marginRight, 10) || 0;
	var marginTop = parseInt(computedStyle.marginTop, 10) || 0;
	var marginBottom = parseInt(computedStyle.marginBottom, 10) || 0;
	var paddingLeft = parseInt(computedStyle.paddingLeft, 10) || 0;
	var paddingRight = parseInt(computedStyle.paddingRight, 10) || 0;
	var paddingTop = parseInt(computedStyle.paddingTop, 10) || 0;
	var paddingBottom = parseInt(computedStyle.paddingBottom, 10) || 0;
	
	if(isHorizontal) {
		// Different transitions based on origin
		if(origin === "right") {
			// For right origin, slide out to the right using negative margin-left
			var totalWidth = currentWidth + marginLeft + marginRight + paddingLeft + paddingRight;
			$tw.utils.setStyle(domNode,[
				{transition: "margin-left " + duration + "ms " + easing + ", " +
							"opacity " + duration + "ms " + easing},
				{marginLeft: (-totalWidth) + "px"},
				{opacity: "0"}
			]);
		} else if(origin === "center") {
			// For center origin, collapse width and expand margins
			var halfWidth = (currentWidth + paddingLeft + paddingRight) / 2;
			$tw.utils.setStyle(domNode,[
				{transition: "margin-left " + duration + "ms " + easing + ", " +
							"margin-right " + duration + "ms " + easing + ", " +
							"padding-left " + duration + "ms " + easing + ", " +
							"padding-right " + duration + "ms " + easing + ", " +
							"width " + duration + "ms " + easing + ", " +
							"opacity " + duration + "ms " + easing},
				{marginLeft: (marginLeft + halfWidth) + "px"},
				{marginRight: (marginRight + halfWidth) + "px"},
				{paddingLeft: "0px"},
				{paddingRight: "0px"},
				{width: "0px"},
				{opacity: "0"}
			]);
		} else {
			// Default left origin
			$tw.utils.setStyle(domNode,[
				{transition: "margin-left " + duration + "ms " + easing + ", " +
							"margin-right " + duration + "ms " + easing + ", " +
							"padding-left " + duration + "ms " + easing + ", " +
							"padding-right " + duration + "ms " + easing + ", " +
							"width " + duration + "ms " + easing + ", " +
							"opacity " + duration + "ms " + easing},
				{marginLeft: "0px"},
				{marginRight: "0px"},
				{paddingLeft: "0px"},
				{paddingRight: "0px"},
				{width: "0px"},
				{opacity: "0"}
			]);
		}
	} else {
		// Different transitions based on origin for vertical
		if(origin === "bottom") {
			// For bottom origin, slide out to the bottom using negative margin-top
			var totalHeight = currentHeight + marginTop + marginBottom + paddingTop + paddingBottom;
			$tw.utils.setStyle(domNode,[
				{transition: "margin-top " + duration + "ms " + easing + ", " +
							"opacity " + duration + "ms " + easing},
				{marginTop: (-totalHeight) + "px"},
				{opacity: "0"}
			]);
		} else if(origin === "center") {
			// For center origin, collapse height and expand margins
			var halfHeight = (currentHeight + paddingTop + paddingBottom) / 2;
			$tw.utils.setStyle(domNode,[
				{transition: "margin-top " + duration + "ms " + easing + ", " +
							"margin-bottom " + duration + "ms " + easing + ", " +
							"padding-top " + duration + "ms " + easing + ", " +
							"padding-bottom " + duration + "ms " + easing + ", " +
							"height " + duration + "ms " + easing + ", " +
							"opacity " + duration + "ms " + easing},
				{marginTop: (marginTop + halfHeight) + "px"},
				{marginBottom: (marginBottom + halfHeight) + "px"},
				{paddingTop: "0px"},
				{paddingBottom: "0px"},
				{height: "0px"},
				{opacity: "0"}
			]);
		} else {
			// Default top origin
			$tw.utils.setStyle(domNode,[
				{transition: "margin-top " + duration + "ms " + easing + ", " +
							"margin-bottom " + duration + "ms " + easing + ", " +
							"padding-top " + duration + "ms " + easing + ", " +
							"padding-bottom " + duration + "ms " + easing + ", " +
							"height " + duration + "ms " + easing + ", " +
							"opacity " + duration + "ms " + easing},
				{marginTop: "0px"},
				{marginBottom: "0px"},
				{paddingTop: "0px"},
				{paddingBottom: "0px"},
				{height: "0px"},
				{opacity: "0"}
			]);
		}
	}
}

// Transform-based versions with interruption support
function slideOpenTransform(domNode,options) {
	options = options || {};
	var duration = options.duration || $tw.utils.getAnimationDuration();
	var direction = options.direction || "vertical";
	var isHorizontal = direction === "horizontal";
	
	// Get current transform if animating
	var startScale = 0;
	var startOpacity = 0;
	if(isAnimating(domNode)) {
		var computedStyle = window.getComputedStyle(domNode);
		var transform = computedStyle.transform;
		if(transform && transform !== "none") {
			var matrix = new DOMMatrix(transform);
			startScale = isHorizontal ? matrix.a : matrix.d;
		}
		startOpacity = parseFloat(computedStyle.opacity) || 0;
		// Remove existing handler
		var oldHandler = domNode._slideTransitionHandler;
		if(oldHandler) {
			domNode.removeEventListener("transitionend", oldHandler);
		}
	}
	
	// Mark as animating
	setAnimating(domNode, true);
	
	// Reset after animation
	var transitionEndHandler = function() {
		domNode.removeEventListener("transitionend", transitionEndHandler);
		delete domNode._slideTransitionHandler;
		setAnimating(domNode, false);
		$tw.utils.setStyle(domNode,[
			{transition: ""},
			{transform: ""},
			{transformOrigin: ""},
			{opacity: ""},
			{willChange: ""}
		]);
		if(options.callback) {
			options.callback();
		}
	};
	
	domNode._slideTransitionHandler = transitionEndHandler;
	
	// Set initial state
	var transformOrigin;
	if(isHorizontal) {
		transformOrigin = (options.origin || "left") + " center";
	} else {
		transformOrigin = "center " + (options.origin || "top");
	}
	$tw.utils.setStyle(domNode,[
		{transition: "none"},
		{transform: isHorizontal ? "scaleX(" + startScale + ")" : "scaleY(" + startScale + ")"},
		{transformOrigin: transformOrigin},
		{opacity: startOpacity},
		{willChange: "transform, opacity"}
	]);
	
	$tw.utils.forceLayout(domNode);
	
	// Add transition end listener
	domNode.addEventListener("transitionend", transitionEndHandler);
	
	// Animate to final state
	var easing = options.easing || "cubic-bezier(0.4, 0.0, 0.2, 1)";
	$tw.utils.setStyle(domNode,[
		{transition: "transform " + duration + "ms " + easing + ", opacity " + duration + "ms " + easing},
		{transform: "scale(1)"},
		{opacity: "1"}
	]);
}

function slideClosedTransform(domNode,options) {
	options = options || {};
	var duration = options.duration || $tw.utils.getAnimationDuration();
	var direction = options.direction || "vertical";
	var isHorizontal = direction === "horizontal";
	
	// Get current transform if animating
	var startScale = 1;
	var startOpacity = 1;
	if(isAnimating(domNode)) {
		var computedStyle = window.getComputedStyle(domNode);
		var transform = computedStyle.transform;
		if(transform && transform !== "none") {
			var matrix = new DOMMatrix(transform);
			startScale = isHorizontal ? matrix.a : matrix.d;
		}
		startOpacity = parseFloat(computedStyle.opacity) || 1;
		// Adjust duration based on progress
		duration = Math.round(duration * startOpacity);
		// Remove existing handler
		var oldHandler = domNode._slideTransitionHandler;
		if(oldHandler) {
			domNode.removeEventListener("transitionend", oldHandler);
		}
	}
	
	// Mark as animating
	setAnimating(domNode, true);
	
	// Reset after animation
	var transitionEndHandler = function() {
		domNode.removeEventListener("transitionend", transitionEndHandler);
		delete domNode._slideTransitionHandler;
		setAnimating(domNode, false);
		$tw.utils.setStyle(domNode,[
			{transition: ""},
			{transform: ""},
			{transformOrigin: ""},
			{opacity: ""},
			{willChange: ""}
		]);
		if(options.callback) {
			options.callback();
		}
	};
	
	domNode._slideTransitionHandler = transitionEndHandler;
	
	// Set initial state
	var transformOrigin;
	if(isHorizontal) {
		transformOrigin = (options.origin || "left") + " center";
	} else {
		transformOrigin = "center " + (options.origin || "top");
	}
	$tw.utils.setStyle(domNode,[
		{transition: "none"},
		{transform: isHorizontal ? "scaleX(" + startScale + ")" : "scaleY(" + startScale + ")"},
		{transformOrigin: transformOrigin},
		{opacity: startOpacity},
		{willChange: "transform, opacity"}
	]);
	
	$tw.utils.forceLayout(domNode);
	
	// Add transition end listener
	domNode.addEventListener("transitionend", transitionEndHandler);
	
	// Animate to final state
	var easing = options.easing || "cubic-bezier(0.4, 0.0, 0.2, 1)";
	$tw.utils.setStyle(domNode,[
		{transition: "transform " + duration + "ms " + easing + ", opacity " + duration + "ms " + easing},
		{transform: isHorizontal ? "scaleX(0)" : "scaleY(0)"},
		{opacity: "0"}
	]);
}

exports.slide = {
	open: slideOpen,
	close: slideClosed,
	openTransform: slideOpenTransform,
	closeTransform: slideClosedTransform
};
