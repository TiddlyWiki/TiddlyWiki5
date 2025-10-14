/*\
title: $:/core/modules/storyviews/zoomin.js
type: application/javascript
module-type: storyview

Zooms between individual tiddlers

\*/

"use strict";

var ZoominListView = function(listWidget) {
	var self = this;
	this.listWidget = listWidget;
	this.textNodeLogger = new $tw.utils.Logger("zoomin story river view", {
		enable: true,
		colour: 'red'
	});
	
	// Load initial configuration
	this.loadConfig();
	
	// Get the index of the tiddler that is at the top of the history
	var history = this.listWidget.wiki.getTiddlerDataCached(this.listWidget.historyTitle,[]),
		targetTiddler;
	if(history.length > 0) {
		targetTiddler = history[history.length-1].title;
	}
	// Make all the tiddlers position absolute, and hide all but the top (or first) one
	var foundTarget = false;
	$tw.utils.each(this.listWidget.children,function(itemWidget,index) {
		var domNode = itemWidget.findFirstDomNode();
		// Abandon if the list entry isn't a DOM element (it might be a text node)
		if(!(domNode instanceof Element)) {
			return;
		}
		// Check if this is the target tiddler or the first one if no target
		var isTarget = targetTiddler && targetTiddler === itemWidget.parseTreeNode.itemTitle;
		var isFirst = index === 0;
		
		if(isTarget || (!foundTarget && isFirst)) {
			// Show this tiddler
			domNode.style.display = "block";
			self.currentTiddlerDomNode = domNode;
			foundTarget = true;
		} else {
			// Hide this tiddler
			domNode.style.display = "none";
		}
		$tw.utils.addClass(domNode,"tc-storyview-zoomin-tiddler");
	});
};

// Load configuration from tiddlers
ZoominListView.prototype.loadConfig = function() {
	// Default easing for zoom animations - from http://easings.net/#easeInOutCubic
	var defaultEasing = "cubic-bezier(0.645, 0.045, 0.355, 1)";
	
	this.config = {
		// Shared configuration
		useGPUAcceleration: $tw.wiki.getTiddlerText("$:/config/AnimationGPUAcceleration") !== "no",
		easingFunction: $tw.wiki.getTiddlerText("$:/config/AnimationEasing") || defaultEasing,
		animationScale: parseFloat($tw.wiki.getTiddlerText("$:/config/AnimationScale") || "1.0"),
		useWillChange: $tw.wiki.getTiddlerText("$:/config/AnimationWillChange") !== "no",
		
		// Zoomin-specific configuration
		navigateFromScale: parseFloat($tw.wiki.getTiddlerText("$:/config/ZoominStoryView/NavigateFromScale") || "1"),
		navigateToScale: parseFloat($tw.wiki.getTiddlerText("$:/config/ZoominStoryView/NavigateToScale") || "1"),
		removeScale: parseFloat($tw.wiki.getTiddlerText("$:/config/ZoominStoryView/RemoveScale") || "0.1"),
		returnScale: parseFloat($tw.wiki.getTiddlerText("$:/config/ZoominStoryView/ReturnScale") || "10")
	};
};

// Called at the start of a refresh cycle
ZoominListView.prototype.refreshStart = function(changedTiddlers) {
	// Check if any configuration tiddlers changed
	if(changedTiddlers["$:/config/AnimationGPUAcceleration"] ||
	   changedTiddlers["$:/config/AnimationEasing"] ||
	   changedTiddlers["$:/config/AnimationScale"] ||
	   changedTiddlers["$:/config/AnimationWillChange"] ||
	   changedTiddlers["$:/config/ZoominStoryView/NavigateFromScale"] ||
	   changedTiddlers["$:/config/ZoominStoryView/NavigateToScale"] ||
	   changedTiddlers["$:/config/ZoominStoryView/RemoveScale"] ||
	   changedTiddlers["$:/config/ZoominStoryView/ReturnScale"]) {
		this.loadConfig();
	}
};

ZoominListView.prototype.navigateTo = function(historyInfo) {
	// Check if storyview animations/navigation is enabled
	var enableAnimation = this.listWidget.getVariable("tv-enable-storyview-scroll");
	if(enableAnimation !== "yes") {
		// If animations are disabled, still need to switch to the target tiddler but without animation
		var listElementIndex = this.listWidget.findListItem(0,historyInfo.title);
		if(listElementIndex === undefined) {
			return;
		}
		var listItemWidget = this.listWidget.children[listElementIndex],
			targetElement = listItemWidget.findFirstDomNode();
		if(!targetElement || targetElement.nodeType === Node.TEXT_NODE) {
			return;
		}
		// Simply hide current and show target without animation
		if(this.currentTiddlerDomNode && this.currentTiddlerDomNode !== targetElement) {
			this.currentTiddlerDomNode.style.display = "none";
		}
		targetElement.style.display = "block";
		this.currentTiddlerDomNode = targetElement;
		return;
	}
	
	var duration = $tw.utils.getAnimationDuration() * this.config.animationScale,
		listElementIndex = this.listWidget.findListItem(0,historyInfo.title);
	if(listElementIndex === undefined) {
		return;
	}
	var listItemWidget = this.listWidget.children[listElementIndex],
		targetElement = listItemWidget.findFirstDomNode();
	// Abandon if the list entry isn't a DOM element (it might be a text node)
	if(!targetElement) {
		return;
	} else if (targetElement.nodeType === Node.TEXT_NODE) {
		this.logTextNodeRoot(targetElement);
		return;
	}
	
	// Build will-change property list
	var willChangeProps = ["transform", "opacity"];
	
	// Make the new tiddler be position absolute and visible so that we can measure it
	$tw.utils.addClass(targetElement,"tc-storyview-zoomin-tiddler");
	var initialStyles = [
		{display: "block"},
		{transformOrigin: "0 0"},
		{transition: "none"},
		{opacity: "0.0"}
	];
	
	// Set initial transform based on GPU acceleration preference
	if(this.config.useGPUAcceleration) {
		initialStyles.push({transform: "translate3d(0, 0, 0) scale3d(1, 1, 1)"});
	} else {
		initialStyles.push({transform: "translateX(0px) translateY(0px) scale(1)"});
	}
	
	if(this.config.useWillChange) {
		initialStyles.push({willChange: willChangeProps.join(", ")});
	}
	
	$tw.utils.setStyle(targetElement, initialStyles);
	
	// Get the position of the source node, or use the centre of the window as the source position
	var sourceBounds = historyInfo.fromPageRect || {
			left: window.innerWidth/2 - 2,
			top: window.innerHeight/2 - 2,
			width: window.innerWidth/8,
			height: window.innerHeight/8
		};
	// Try to find the title node in the target tiddler
	var titleDomNode = findTitleDomNode(listItemWidget) || listItemWidget.findFirstDomNode(),
		zoomBounds = titleDomNode.getBoundingClientRect();
	// Compute the transform for the target tiddler to make the title lie over the source rectange
	var targetBounds = targetElement.getBoundingClientRect(),
		scale = (sourceBounds.width / zoomBounds.width) * this.config.navigateFromScale,
		x = sourceBounds.left - targetBounds.left - (zoomBounds.left - targetBounds.left) * scale,
		y = sourceBounds.top - targetBounds.top - (zoomBounds.top - targetBounds.top) * scale;
	
	// Transform the target tiddler to its starting position with GPU acceleration
	if(this.config.useGPUAcceleration) {
		$tw.utils.setStyle(targetElement,[
			{transform: "translate3d(" + x + "px, " + y + "px, 0) scale3d(" + scale + ", " + scale + ", 1)"}
		]);
	} else {
		$tw.utils.setStyle(targetElement,[
			{transform: "translateX(" + x + "px) translateY(" + y + "px) scale(" + scale + ")"}
		]);
	}
	// Force layout
	$tw.utils.forceLayout(targetElement);
	// Apply the ending transitions with a timeout to ensure that the previously applied transformations are applied first
	var self = this,
		prevCurrentTiddler = this.currentTiddlerDomNode;
	this.currentTiddlerDomNode = targetElement;
	
	// Transform the target tiddler to its natural size
	var targetTransform = this.config.useGPUAcceleration ? 
		"translate3d(0, 0, 0) scale3d(" + this.config.navigateToScale + ", " + this.config.navigateToScale + ", 1)" :
		"translateX(0px) translateY(0px) scale(" + this.config.navigateToScale + ")";
	
	$tw.utils.setStyle(targetElement,[
		{transition: $tw.utils.roundTripPropertyName("transform") + " " + duration + "ms " + this.config.easingFunction + ", opacity " + duration + "ms " + this.config.easingFunction},
		{opacity: "1.0"},
		{transform: targetTransform},
		{zIndex: "500"}
	]);
	
	// Transform the previous tiddler out of the way and then hide it
	if(prevCurrentTiddler && prevCurrentTiddler !== targetElement) {
		scale = (zoomBounds.width / sourceBounds.width) * this.config.navigateFromScale;
		x = zoomBounds.left - targetBounds.left - (sourceBounds.left - targetBounds.left) * scale;
		y = zoomBounds.top - targetBounds.top - (sourceBounds.top - targetBounds.top) * scale;
		
		var prevTransform = this.config.useGPUAcceleration ?
			"translate3d(" + x + "px, " + y + "px, 0) scale3d(" + scale + ", " + scale + ", 1)" :
			"translateX(" + x + "px) translateY(" + y + "px) scale(" + scale + ")";
		
		$tw.utils.setStyle(prevCurrentTiddler,[
			{transition: $tw.utils.roundTripPropertyName("transform") + " " + duration + "ms " + this.config.easingFunction + ", opacity " + duration + "ms " + this.config.easingFunction},
			{opacity: "0.0"},
			{transformOrigin: "0 0"},
			{transform: prevTransform},
			{zIndex: "0"}
		]);
		// Hide the tiddler when the transition has finished
		setTimeout(function() {
			if(self.currentTiddlerDomNode !== prevCurrentTiddler) {
				prevCurrentTiddler.style.display = "none";
				// Clean up transform and will-change
				$tw.utils.setStyle(prevCurrentTiddler,[
					{transition: "none"},
					{transform: ""},
					{willChange: ""}
				]);
			}
		}, duration);
	}
	
	// Clean up transform and will-change after animation
	setTimeout(function() {
		if(targetElement.parentNode) {
			$tw.utils.setStyle(targetElement,[
				{transition: "none"},
				{transform: ""},
				{willChange: ""}
			]);
		}
	}, duration + 100);
};

/*
Find the first child DOM node of a widget that has the class "tc-title"
*/
function findTitleDomNode(widget,targetClass) {
	targetClass = targetClass || "tc-title";
	var domNode = widget.findFirstDomNode();
	if(domNode && domNode.querySelector) {
		return $tw.utils.querySelectorSafe("." + targetClass,domNode);
	}
	return null;
}

ZoominListView.prototype.insert = function(widget) {
	var targetElement = widget.findFirstDomNode();
	// Abandon if the list entry isn't a DOM element (it might be a text node)
	if(!targetElement) {
		return;
	} else if (targetElement.nodeType === Node.TEXT_NODE) {
		this.logTextNodeRoot(targetElement);
		return;
	}
	// Make the newly inserted node position absolute and hidden
	$tw.utils.addClass(targetElement,"tc-storyview-zoomin-tiddler");
	$tw.utils.setStyle(targetElement,[
		{display: "none"}
	]);
};

ZoominListView.prototype.remove = function(widget) {
	var targetElement = widget.findFirstDomNode(),
		duration = $tw.utils.getAnimationDuration() * this.config.animationScale,
		removeElement = function() {
			widget.removeChildDomNodes();
		};
	// Abandon if the list entry isn't a DOM element (it might be a text node)
	if(!targetElement || targetElement.nodeType === Node.TEXT_NODE) {
		removeElement();
		return;
	}
	// Abandon if hidden
	if(targetElement.style.display != "block" ) {
		removeElement();
		return;
	}
	
	// Build will-change property list
	var willChangeProps = ["transform", "opacity"];
	
	// Set up the tiddler that is being closed
	$tw.utils.addClass(targetElement,"tc-storyview-zoomin-tiddler");
	var initialStyles = [
		{display: "block"},
		{transformOrigin: "50% 50%"},
		{transition: "none"},
		{zIndex: "0"}
	];
	
	// Set initial transform based on GPU acceleration preference
	if(this.config.useGPUAcceleration) {
		initialStyles.push({transform: "translate3d(0, 0, 0) scale3d(1, 1, 1)"});
	} else {
		initialStyles.push({transform: "translateX(0px) translateY(0px) scale(1)"});
	}
	
	if(this.config.useWillChange) {
		initialStyles.push({willChange: willChangeProps.join(", ")});
	}
	
	$tw.utils.setStyle(targetElement, initialStyles);
	
	// We'll move back to the previous or next element in the story
	var toWidget = widget.previousSibling();
	if(!toWidget) {
		toWidget = widget.nextSibling();
	}
	var toWidgetDomNode = toWidget && toWidget.findFirstDomNode();
	// Set up the tiddler we're moving back in
	if(toWidgetDomNode) {
		if (toWidgetDomNode.nodeType === Node.TEXT_NODE) {
			this.logTextNodeRoot(toWidgetDomNode);
			toWidgetDomNode = null;
		} else {
			$tw.utils.addClass(toWidgetDomNode,"tc-storyview-zoomin-tiddler");
			
			var returnTransform = this.config.useGPUAcceleration ?
				"translate3d(0, 0, 0) scale3d(" + this.config.returnScale + ", " + this.config.returnScale + ", 1)" :
				"translateX(0px) translateY(0px) scale(" + this.config.returnScale + ")";
			
			var returnStyles = [
				{display: "block"},
				{transformOrigin: "50% 50%"},
				{transform: returnTransform},
				{transition: $tw.utils.roundTripPropertyName("transform") + " " + duration + "ms " + this.config.easingFunction + ", opacity " + duration + "ms " + this.config.easingFunction},
				{opacity: "0"},
				{zIndex: "500"}
			];
			
			if(this.config.useWillChange) {
				returnStyles.push({willChange: willChangeProps.join(", ")});
			}
			
			$tw.utils.setStyle(toWidgetDomNode, returnStyles);
			this.currentTiddlerDomNode = toWidgetDomNode;
		}
	}
	// Animate them both
	// Force layout
	$tw.utils.forceLayout(this.listWidget.parentDomNode);
	
	// First, the tiddler we're closing
	var closeTransform = this.config.useGPUAcceleration ?
		"translate3d(0, 0, 0) scale3d(" + this.config.removeScale + ", " + this.config.removeScale + ", 1)" :
		"translateX(0px) translateY(0px) scale(" + this.config.removeScale + ")";
	
	$tw.utils.setStyle(targetElement,[
		{transformOrigin: "50% 50%"},
		{transform: closeTransform},
		{transition: $tw.utils.roundTripPropertyName("transform") + " " + duration + "ms " + this.config.easingFunction + ", opacity " + duration + "ms " + this.config.easingFunction},
		{opacity: "0"},
		{zIndex: "0"}
	]);
	
	// Clean up after animation
	var self = this;
	setTimeout(function() {
		removeElement();
	}, duration);
	
	// Now the tiddler we're going back to
	if(toWidgetDomNode) {
		var finalTransform = this.config.useGPUAcceleration ?
			"translate3d(0, 0, 0) scale3d(1, 1, 1)" :
			"translateX(0px) translateY(0px) scale(1)";
		
		$tw.utils.setStyle(toWidgetDomNode,[
			{transform: finalTransform},
			{opacity: "1"}
		]);
		
		// Clean up transform and will-change after animation
		setTimeout(function() {
			if(toWidgetDomNode.parentNode) {
				$tw.utils.setStyle(toWidgetDomNode,[
					{transition: "none"},
					{transform: ""},
					{willChange: ""}
				]);
			}
		}, duration + 100);
	}
	return true; // Indicate that we'll delete the DOM node
};

ZoominListView.prototype.logTextNodeRoot = function(node) {
	this.textNodeLogger.log($tw.language.getString("Error/ZoominTextNode") + " " + node.textContent);
};

exports.zoomin = ZoominListView;
