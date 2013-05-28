/*\
title: $:/core/modules/utils/dom/animations/slide.js
type: application/javascript
module-type: animation

A simple slide animation that varies the height of the element

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

function slideOpen(domNode,options) {
	// Get the current height of the domNode
	var computedStyle = window.getComputedStyle(domNode),
		currMarginBottom = parseInt(computedStyle.marginBottom,10),
		currMarginTop = parseInt(computedStyle.marginTop,10),
		currPaddingBottom = parseInt(computedStyle.paddingBottom,10),
		currPaddingTop = parseInt(computedStyle.paddingTop,10),
		currHeight = domNode.offsetHeight;
	// Reset the margin once the transition is over
	var transitionEventName = $tw.utils.convertEventName("transitionEnd");
	domNode.addEventListener(transitionEventName,function handler(event) {
		$tw.utils.setStyle(domNode,[
			{transition: "none"},
			{marginBottom: ""},
			{marginTop: ""},
			{paddingBottom: ""},
			{paddingTop: ""},
			{height: "auto"}
		]);
		domNode.removeEventListener(transitionEventName,handler,false);
		if(options.callback) {
			options.callback();
		}
	},false);
	// Set up the initial position of the element
	$tw.utils.setStyle(domNode,[
		{transition: "none"},
		{marginTop: "0px"},
		{marginBottom: "0px"},
		{paddingTop: "0px"},
		{paddingBottom: "0px"},
		{height: "0px"}
	]);
	$tw.utils.forceLayout(domNode);
	// Transition to the final position
	$tw.utils.setStyle(domNode,[
		{transition: "margin-top " + $tw.config.preferences.animationDurationMs + " ease-in-out, " +
					"margin-bottom " + $tw.config.preferences.animationDurationMs + " ease-in-out, " +
					"padding-top " + $tw.config.preferences.animationDurationMs + " ease-in-out, " +
					"padding-bottom " + $tw.config.preferences.animationDurationMs + " ease-in-out, " +
					"height " + $tw.config.preferences.animationDurationMs + " ease-in-out"},
		{marginBottom: currMarginBottom + "px"},
		{marginTop: currMarginTop + "px"},
		{paddingBottom: currPaddingBottom + "px"},
		{paddingTop: currPaddingTop + "px"},
		{height: currHeight + "px"}
	]);
}

function slideClosed(domNode,options) {
	var currHeight = domNode.offsetHeight;
	// Clear the properties we've set when the animation is over
	var transitionEventName = $tw.utils.convertEventName("transitionEnd");
	domNode.addEventListener(transitionEventName,function handler(event) {
		$tw.utils.setStyle(domNode,[
			{transition: "none"},
			{marginBottom: ""},
			{marginTop: ""},
			{paddingBottom: ""},
			{paddingTop: ""},
			{height: "auto"}
		]);
		domNode.removeEventListener(transitionEventName,handler,false);
		if(options.callback) {
			options.callback();
		}
	},false);
	// Set up the initial position of the element
	$tw.utils.setStyle(domNode,[
		{height: currHeight + "px"}
	]);
	$tw.utils.forceLayout(domNode);
	// Transition to the final position
	$tw.utils.setStyle(domNode,[
		{transition: "margin-top " + $tw.config.preferences.animationDurationMs + " ease-in-out, " +
					"margin-bottom " + $tw.config.preferences.animationDurationMs + " ease-in-out, " +
					"padding-top " + $tw.config.preferences.animationDurationMs + " ease-in-out, " +
					"padding-bottom " + $tw.config.preferences.animationDurationMs + " ease-in-out, " +
					"height " + $tw.config.preferences.animationDurationMs + " ease-in-out"},
		{marginTop: "0px"},
		{marginBottom: "0px"},
		{paddingTop: "0px"},
		{paddingBottom: "0px"},
		{height: "0px"}
	]);
}

exports.slide = {
	open: slideOpen,
	close: slideClosed
};

})();
