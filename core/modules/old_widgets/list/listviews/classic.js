/*\
title: $:/core/modules/widgets/list/listviews/classic.js
type: application/javascript
module-type: listview

Views the list as a linear sequence

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var ClassicListView = function(listWidget) {
	this.listWidget = listWidget;
}

ClassicListView.prototype.navigateTo = function(historyInfo) {
	var listElementIndex = this.listWidget.findListElementByTitle(0,historyInfo.title);
	if(listElementIndex === undefined) {
		return;
	}
	var listElementNode = this.listWidget.children[listElementIndex],
		targetElement = listElementNode.domNode;
	// Scroll the node into view
	var scrollEvent = this.listWidget.renderer.renderTree.document.createEvent("Event");
	scrollEvent.initEvent("tw-scroll",true,true);
	targetElement.dispatchEvent(scrollEvent);
};

ClassicListView.prototype.insert = function(index) {
	var listElementNode = this.listWidget.children[index],
		targetElement = listElementNode.domNode,
		duration = $tw.utils.getAnimationDuration();
	// Get the current height of the tiddler
	var currMarginBottom = parseInt(window.getComputedStyle(targetElement).marginBottom,10),
		currMarginTop = parseInt(window.getComputedStyle(targetElement).marginTop,10),
		currHeight = targetElement.offsetHeight + currMarginTop;
	// Reset the margin once the transition is over
	setTimeout(function() {
		$tw.utils.setStyle(targetElement,[
			{transition: "none"},
			{marginBottom: ""}
		]);
	},duration);
	// Set up the initial position of the element
	$tw.utils.setStyle(targetElement,[
		{transition: "none"},
		{marginBottom: (-currHeight) + "px"},
		{opacity: "0.0"}
	]);
	$tw.utils.forceLayout(targetElement);
	// Transition to the final position
	$tw.utils.setStyle(targetElement,[
		{transition: "opacity " + duration + "ms ease-in-out, " +
					"margin-bottom " + duration + "ms ease-in-out"},
		{marginBottom: currMarginBottom + "px"},
		{opacity: "1.0"}
	]);
};

ClassicListView.prototype.remove = function(index) {
	var listElementNode = this.listWidget.children[index],
		targetElement = listElementNode.domNode,
		duration = $tw.utils.getAnimationDuration();
	// Get the current height of the tiddler
	var currWidth = targetElement.offsetWidth,
		currMarginBottom = parseInt(window.getComputedStyle(targetElement).marginBottom,10),
		currMarginTop = parseInt(window.getComputedStyle(targetElement).marginTop,10),
		currHeight = targetElement.offsetHeight + currMarginTop;
	// Remove the element at the end of the transition
	setTimeout(function() {
		if(targetElement.parentNode) {
			targetElement.parentNode.removeChild(targetElement);
		}
	},duration);
	// Animate the closure
	$tw.utils.setStyle(targetElement,[
		{transition: "none"},
		{transform: "translateX(0px)"},
		{marginBottom:  currMarginBottom + "px"},
		{opacity: "1.0"}
	]);
	$tw.utils.forceLayout(targetElement);
	$tw.utils.setStyle(targetElement,[
		{transition: $tw.utils.roundTripPropertyName("transform") + " " + duration + "ms ease-in-out, " +
					"opacity " + duration + "ms ease-in-out, " +
					"margin-bottom " + duration + "ms ease-in-out"},
		{transform: "translateX(-" + currWidth + "px)"},
		{marginBottom: (-currHeight) + "px"},
		{opacity: "0.0"}
	]);
	// Returning true causes the DOM node not to be deleted
	return true;
};

exports.classic = ClassicListView;

})();
