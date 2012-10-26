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
}

ClassicListView.prototype.navigateTo = function(title) {
	var listElementIndex = this.listMacro.findListElementByTitle(0,title),
		listElementNode = this.listMacro.listFrame.children[listElementIndex],
		targetElement = listElementNode.domNode;
	// Replace any previous transition on the target element
	$tw.utils.setStyle(targetElement,[
		{transition: ""}
	]);
	$tw.utils.forceLayout(targetElement);
	$tw.utils.setStyle(targetElement,[
		{transform: ""},
	]);
	$tw.utils.forceLayout(targetElement);
	// Scroll the target element into view
	$tw.scroller.scrollIntoView(targetElement);
};

ClassicListView.prototype.insert = function(index) {
	var listElementNode = this.listMacro.listFrame.children[index],
		targetElement = listElementNode.domNode;
	// Get the current height of the tiddler
	var currHeight = targetElement.offsetHeight;
	// Animate the closure
	$tw.utils.setStyle(targetElement,[
		{transition: ""},
		{transformOrigin: "0% 0%"},
		{transform: "translateX(" + window.innerWidth + "px)"},
		{opacity: "0.0"},
		{height: "0px"}
	]);
	$tw.utils.forceLayout(targetElement);
	targetElement.addEventListener($tw.utils.convertEventName("transitionEnd"),function(event) {
		$tw.utils.setStyle(targetElement,[
			{transition: ""},
			{height: "auto"}
		]);
	},false);
	$tw.utils.setStyle(targetElement,[
		{transition: $tw.utils.roundTripPropertyName("transform") + " " + $tw.config.preferences.animationDurationMs + " ease-in-out, " +
					"opacity " + $tw.config.preferences.animationDurationMs + " ease-out, " +
					"height " + $tw.config.preferences.animationDurationMs + " ease-in-out"},
		{transform: "translateX(0px)"},
		{opacity: "1.0"},
		{height: currHeight + "px"}
	]);
};

ClassicListView.prototype.remove = function(index) {
	var listElementNode = this.listMacro.listFrame.children[index],
		targetElement = listElementNode.domNode;
	// Get the current height of the tiddler
	var currHeight = targetElement.offsetHeight;
	// Put a wrapper around the dom node we're closing
	var wrapperElement = document.createElement("div");
	targetElement.parentNode.insertBefore(wrapperElement,targetElement);
	wrapperElement.appendChild(targetElement);
	// Attach an event handler for the end of the transition
	wrapperElement.addEventListener($tw.utils.convertEventName("transitionEnd"),function(event) {
		if(wrapperElement.parentNode) {
			wrapperElement.parentNode.removeChild(wrapperElement);
		}
	},false);
	// Animate the closure
	$tw.utils.setStyle(wrapperElement,[
		{transition: $tw.utils.roundTripPropertyName("transform") + " " + $tw.config.preferences.animationDurationMs + " ease-in-out, " +
					"opacity " + $tw.config.preferences.animationDurationMs + " ease-out, " +
					"height " + $tw.config.preferences.animationDurationMs + " ease-in-out"},
		{transformOrigin: "0% 0%"},
		{transform: "translateX(0px)"},
		{opacity: "1.0"},
		{height: currHeight + "px"}
	]);
	$tw.utils.forceLayout(wrapperElement);
	$tw.utils.setStyle(wrapperElement,[
		{transform: "translateX(-" + window.innerWidth + "px)"},
		{opacity: "0.0"},
		{height: "0px"}
	]);
	// Returning true causes the DOM node not to be deleted
	return true;
};

exports["classic"] = ClassicListView;

})();
