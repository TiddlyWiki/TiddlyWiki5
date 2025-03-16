/*\
title: $:/core/modules/storyviews/zoomin.js
type: application/javascript
module-type: storyview

Zooms between individual tiddlers

\*/

"use strict";

var easing = "cubic-bezier(0.645, 0.045, 0.355, 1)"; // From http://easings.net/#easeInOutCubic

var ZoominListView = function(listWidget) {
	var self = this;
	this.listWidget = listWidget;
	this.textNodeLogger = new $tw.utils.Logger("zoomin story river view", {
		enable: true,
		colour: 'red'
	});
	// Get the index of the tiddler that is at the top of the history
	var history = this.listWidget.wiki.getTiddlerDataCached(this.listWidget.historyTitle,[]),
		targetTiddler;
	if(history.length > 0) {
		targetTiddler = history[history.length-1].title;
	}
	// Make all the tiddlers position absolute, and hide all but the top (or first) one
	$tw.utils.each(this.listWidget.children,function(itemWidget,index) {
		var domNode = itemWidget.findFirstDomNode();
		// Abandon if the list entry isn't a DOM element (it might be a text node)
		if(!(domNode instanceof Element)) {
			return;
		}
		if((targetTiddler && targetTiddler !== itemWidget.parseTreeNode.itemTitle) || (!targetTiddler && index)) {
			domNode.style.display = "none";
		} else {
			self.currentTiddlerDomNode = domNode;
		}
		$tw.utils.addClass(domNode,"tc-storyview-zoomin-tiddler");
	});
};

ZoominListView.prototype.navigateTo = function(historyInfo) {
	var duration = $tw.utils.getAnimationDuration(),
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
	// Make the new tiddler be position absolute and visible so that we can measure it
	$tw.utils.addClass(targetElement,"tc-storyview-zoomin-tiddler");
	$tw.utils.setStyle(targetElement,[
		{display: "block"},
		{transformOrigin: "0 0"},
		{transform: "translateX(0px) translateY(0px) scale(1)"},
		{transition: "none"},
		{opacity: "0.0"}
	]);
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
		scale = sourceBounds.width / zoomBounds.width,
		x = sourceBounds.left - targetBounds.left - (zoomBounds.left - targetBounds.left) * scale,
		y = sourceBounds.top - targetBounds.top - (zoomBounds.top - targetBounds.top) * scale;
	// Transform the target tiddler to its starting position
	$tw.utils.setStyle(targetElement,[
		{transform: "translateX(" + x + "px) translateY(" + y + "px) scale(" + scale + ")"}
	]);
	// Force layout
	$tw.utils.forceLayout(targetElement);
	// Apply the ending transitions with a timeout to ensure that the previously applied transformations are applied first
	var self = this,
		prevCurrentTiddler = this.currentTiddlerDomNode;
	this.currentTiddlerDomNode = targetElement;
	// Transform the target tiddler to its natural size
	$tw.utils.setStyle(targetElement,[
		{transition: $tw.utils.roundTripPropertyName("transform") + " " + duration + "ms " + easing + ", opacity " + duration + "ms " + easing},
		{opacity: "1.0"},
		{transform: "translateX(0px) translateY(0px) scale(1)"},
		{zIndex: "500"},
	]);
	// Transform the previous tiddler out of the way and then hide it
	if(prevCurrentTiddler && prevCurrentTiddler !== targetElement) {
		scale = zoomBounds.width / sourceBounds.width;
		x =  zoomBounds.left - targetBounds.left - (sourceBounds.left - targetBounds.left) * scale;
		y =  zoomBounds.top - targetBounds.top - (sourceBounds.top - targetBounds.top) * scale;
		$tw.utils.setStyle(prevCurrentTiddler,[
			{transition: $tw.utils.roundTripPropertyName("transform") + " " + duration + "ms " + easing + ", opacity " + duration + "ms " + easing},
			{opacity: "0.0"},
			{transformOrigin: "0 0"},
			{transform: "translateX(" + x + "px) translateY(" + y + "px) scale(" + scale + ")"},
			{zIndex: "0"}
		]);
		// Hide the tiddler when the transition has finished
		setTimeout(function() {
			if(self.currentTiddlerDomNode !== prevCurrentTiddler) {
				prevCurrentTiddler.style.display = "none";
			}
		},duration);
	}
	// Scroll the target into view
//	$tw.pageScroller.scrollIntoView(targetElement);
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
		duration = $tw.utils.getAnimationDuration(),
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
	// Set up the tiddler that is being closed
	$tw.utils.addClass(targetElement,"tc-storyview-zoomin-tiddler");
	$tw.utils.setStyle(targetElement,[
		{display: "block"},
		{transformOrigin: "50% 50%"},
		{transform: "translateX(0px) translateY(0px) scale(1)"},
		{transition: "none"},
		{zIndex: "0"}
	]);
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
			$tw.utils.setStyle(toWidgetDomNode,[
				{display: "block"},
				{transformOrigin: "50% 50%"},
				{transform: "translateX(0px) translateY(0px) scale(10)"},
				{transition: $tw.utils.roundTripPropertyName("transform") + " " + duration + "ms " + easing + ", opacity " + duration + "ms " + easing},
				{opacity: "0"},
				{zIndex: "500"}
			]);
			this.currentTiddlerDomNode = toWidgetDomNode;
		}
	}
	// Animate them both
	// Force layout
	$tw.utils.forceLayout(this.listWidget.parentDomNode);
	// First, the tiddler we're closing
	$tw.utils.setStyle(targetElement,[
		{transformOrigin: "50% 50%"},
		{transform: "translateX(0px) translateY(0px) scale(0.1)"},
		{transition: $tw.utils.roundTripPropertyName("transform") + " " + duration + "ms " + easing + ", opacity " + duration + "ms " + easing},
		{opacity: "0"},
		{zIndex: "0"}
	]);
	setTimeout(removeElement,duration);
	// Now the tiddler we're going back to
	if(toWidgetDomNode) {
		$tw.utils.setStyle(toWidgetDomNode,[
			{transform: "translateX(0px) translateY(0px) scale(1)"},
			{opacity: "1"}
		]);
	}
	return true; // Indicate that we'll delete the DOM node
};

ZoominListView.prototype.logTextNodeRoot = function(node) {
	this.textNodeLogger.log($tw.language.getString("Error/ZoominTextNode") + " " + node.textContent);
};

exports.zoomin = ZoominListView;
