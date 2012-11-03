/*\
title: $:/core/modules/macros/list/listviews/classic.js
type: application/javascript
module-type: listview

Views the list as a linear sequence

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

function ClassicListView(listMacro) {
	this.listMacro = listMacro;
	var listFrame = this.listMacro.listFrame,
		listFrameDomNode = listFrame.domNode;
	$tw.utils.setStyle(listFrameDomNode,[
		{perspective: 50000},
	]);
}

ClassicListView.prototype.navigateTo = function(historyInfo) {
	var listElementIndex = this.listMacro.findListElementByTitle(0,historyInfo.title),
		listElementNode = this.listMacro.listFrame.children[listElementIndex],
		targetElement = listElementNode.domNode;
	// Scroll the node into view
	$tw.scroller.scrollIntoView(targetElement);
};

ClassicListView.prototype.insert = function(index) {
	var listElementNode = this.listMacro.listFrame.children[index],
		targetElement = listElementNode.domNode;
	// Get the current height of the tiddler
	var currHeight = targetElement.offsetHeight + parseInt(window.getComputedStyle(targetElement).marginTop,10);
	// Reset the margin once the transition is over
	targetElement.addEventListener($tw.utils.convertEventName("transitionEnd"),function(event) {
		$tw.utils.setStyle(targetElement,[
			{transition: "none"},
			{marginBottom: "auto"}
		]);
	},false);
	// Set up the initial position of the element
	$tw.utils.setStyle(targetElement,[
		{transition: "none"},
		{marginBottom: (-currHeight) + "px"},
		{opacity: "0.0"}
	]);
	$tw.utils.forceLayout(targetElement);
	// Transition to the final position
	$tw.utils.setStyle(targetElement,[
		{transition: "opacity " + $tw.config.preferences.animationDurationMs + " ease-in-out, " +
					"margin-bottom " + $tw.config.preferences.animationDurationMs + " ease-in-out"},
		{transform: "rotateX(0deg)"},
		{marginBottom: "0px"},
		{opacity: "1.0"}
	]);
};

ClassicListView.prototype.remove = function(index) {
	var listElementNode = this.listMacro.listFrame.children[index],
		targetElement = listElementNode.domNode;
	// Get the current height of the tiddler
	var currWidth = targetElement.offsetWidth,
		currHeight = targetElement.offsetHeight + parseInt(window.getComputedStyle(targetElement).marginTop,10);
	// Attach an event handler for the end of the transition
	targetElement.addEventListener($tw.utils.convertEventName("transitionEnd"),function(event) {
		if(targetElement.parentNode) {
			targetElement.parentNode.removeChild(targetElement);
		}
	},false);
	// Animate the closure
	$tw.utils.setStyle(targetElement,[
		{transition: "none"},
		{transform: "translateX(0px)"},
		{marginBottom:  "0px"},
		{opacity: "1.0"}
	]);
	$tw.utils.forceLayout(targetElement);
	$tw.utils.setStyle(targetElement,[
		{transition: $tw.utils.roundTripPropertyName("transform") + " " + $tw.config.preferences.animationDurationMs + " ease-in-out, " +
					"opacity " + $tw.config.preferences.animationDurationMs + " ease-in-out, " +
					"margin-bottom " + $tw.config.preferences.animationDurationMs + " ease-in-out"},
		{transform: "translateX(" + currWidth + "px)"},
		{marginBottom: (-currHeight) + "px"},
		{opacity: "0.0"}
	]);
	// Returning true causes the DOM node not to be deleted
	return true;
};

exports["classic"] = ClassicListView;

})();
