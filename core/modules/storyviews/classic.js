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
	var listElementIndex = this.listWidget.findListItem(0,historyInfo.title);
	if(listElementIndex === undefined) {
		return;
	}
	var listItemWidget = this.listWidget.children[listElementIndex],
		targetElement = listItemWidget.findFirstDomNode();
	// Abandon if the list entry isn't a DOM element (it might be a text node)
	if(!(targetElement instanceof Element)) {
		return;
	}
	// Scroll the node into view
	this.listWidget.dispatchEvent({type: "tm-scroll", target: targetElement});
};

ClassicStoryView.prototype.insert = function(widget,options) {
	var targetElement = widget.findFirstDomNode(),
		duration = $tw.utils.getAnimationDuration();
	// Abandon if the list entry isn't a DOM element (it might be a text node)
	if(!(targetElement instanceof Element)) {
		return;
	}
	// Get the current height of the tiddler
	var computedStyle = window.getComputedStyle(targetElement),
		currMarginBottom = parseInt(computedStyle.marginBottom,10),
		currMarginTop = parseInt(computedStyle.marginTop,10),
		currHeight = targetElement.offsetHeight + currMarginTop,
	    	isBottom = options.index === options.listLength - 1;
	var initialStyle = isBottom ? [{marginTop: (-currHeight) + "px"}] : [{marginBottom: (-currHeight) + "px"}];
	var finalStyle = isBottom ? [{transition: "opacity " + duration + "ms " + easing + ", " +
						"margin-top " + duration + "ms " + easing},
					{marginTop: currMarginTop + "px"}] : 
					[{transition: "opacity " + duration + "ms " + easing + ", " +
						"margin-bottom " + duration + "ms " + easing},
					{marginBottom: currMarginBottom + "px"}];
	// Reset the margin once the transition is over
	setTimeout(function() {
		$tw.utils.setStyle(targetElement,[
			{transition: "none"},
			{marginBottom: ""},
			{marginTop: ""},
			{zIndex: ""}
		]);
	},duration);
	// Set up the initial position of the element
	$tw.utils.setStyle(targetElement,initialStyle);
	$tw.utils.setStyle(targetElement,[
		{transition: "none"},
		{zIndex: "-1"},
		{opacity: "0.0"}
	]);
	$tw.utils.forceLayout(targetElement);
	// Transition to the final position
	$tw.utils.setStyle(targetElement,finalStyle);
	$tw.utils.setStyle(targetElement,[
		{opacity: "1.0"},
		{zIndex: "-1"}
	]);
};

ClassicStoryView.prototype.remove = function(widget,options) {
	var targetElement = widget.findFirstDomNode(),
		duration = $tw.utils.getAnimationDuration(),
		removeElement = function() {
			widget.removeChildDomNodes();
		};
	// Abandon if the list entry isn't a DOM element (it might be a text node)
	if(!(targetElement instanceof Element)) {
		removeElement();
		return;
	}
	// Get the current height of the tiddler
	var currWidth = targetElement.offsetWidth,
		computedStyle = window.getComputedStyle(targetElement),
		currMarginBottom = parseInt(computedStyle.marginBottom,10),
		currMarginTop = parseInt(computedStyle.marginTop,10),
		currHeight = targetElement.offsetHeight + currMarginTop,
	    	isBottom = options.index === options.listLength;
	var initialStyle = isBottom ? [{marginTop:  currMarginTop + "px"}]: [{marginBottom:  currMarginBottom + "px"}];
	var finalStyle = isBottom ? [{transition: $tw.utils.roundTripPropertyName("transform") + " " + duration + "ms " + easing + ", " +
						"opacity " + duration + "ms " + easing + ", " +
						"margin-top " + duration + "ms " + easing},
					{marginTop: (-currHeight) + "px"}] :
					[{transition: $tw.utils.roundTripPropertyName("transform") + " " + duration + "ms " + easing + ", " +
						"opacity " + duration + "ms " + easing + ", " +
						"margin-bottom " + duration + "ms " + easing},
					{marginBottom: (-currHeight) + "px"}];
	// Remove the dom nodes of the widget at the end of the transition
	setTimeout(removeElement,duration);
	// Animate the closure
	$tw.utils.setStyle(targetElement,initialStyle);
	$tw.utils.setStyle(targetElement,[
		{transition: "none"},
		{transform: "translateX(0px)"},
		{opacity: "1.0"},
		{zIndex: "-1"}
	]);
	$tw.utils.forceLayout(targetElement);
	$tw.utils.setStyle(targetElement,finalStyle);
	$tw.utils.setStyle(targetElement,[
		{transform: "translateX(-" + currWidth + "px)"},
		{opacity: "0.0"},
		{zIndex: "-1"}
	]);

};

exports.classic = ClassicStoryView;

})();
