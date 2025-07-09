/*\
title: $:/core/modules/utils/dom/animations/slide.js
type: application/javascript
module-type: animation

A simple slide animation that varies the height of the element

\*/

"use strict";

function slideOpen(domNode,options) {
	options = options || {};
	const duration = options.duration || $tw.utils.getAnimationDuration();
	// Get the current height of the domNode
	const computedStyle = window.getComputedStyle(domNode);
	const currMarginBottom = parseInt(computedStyle.marginBottom,10);
	const currMarginTop = parseInt(computedStyle.marginTop,10);
	const currPaddingBottom = parseInt(computedStyle.paddingBottom,10);
	const currPaddingTop = parseInt(computedStyle.paddingTop,10);
	const currHeight = domNode.offsetHeight;
	// Reset the margin once the transition is over
	setTimeout(() => {
		$tw.utils.setStyle(domNode,[
			{transition: "none"},
			{marginBottom: ""},
			{marginTop: ""},
			{paddingBottom: ""},
			{paddingTop: ""},
			{height: "auto"},
			{opacity: ""}
		]);
		if(options.callback) {
			options.callback();
		}
	},duration);
	// Set up the initial position of the element
	$tw.utils.setStyle(domNode,[
		{transition: "none"},
		{marginTop: "0px"},
		{marginBottom: "0px"},
		{paddingTop: "0px"},
		{paddingBottom: "0px"},
		{height: "0px"},
		{opacity: "0"}
	]);
	$tw.utils.forceLayout(domNode);
	// Transition to the final position
	$tw.utils.setStyle(domNode,[
		{
			transition: `margin-top ${duration}ms ease-in-out, ` +
				`margin-bottom ${duration}ms ease-in-out, ` +
				`padding-top ${duration}ms ease-in-out, ` +
				`padding-bottom ${duration}ms ease-in-out, ` +
				`height ${duration}ms ease-in-out, ` +
				`opacity ${duration}ms ease-in-out`
		},
		{marginBottom: `${currMarginBottom}px`},
		{marginTop: `${currMarginTop}px`},
		{paddingBottom: `${currPaddingBottom}px`},
		{paddingTop: `${currPaddingTop}px`},
		{height: `${currHeight}px`},
		{opacity: "1"}
	]);
}

function slideClosed(domNode,options) {
	options = options || {};
	const duration = options.duration || $tw.utils.getAnimationDuration();
	const currHeight = domNode.offsetHeight;
	// Clear the properties we've set when the animation is over
	setTimeout(() => {
		$tw.utils.setStyle(domNode,[
			{transition: "none"},
			{marginBottom: ""},
			{marginTop: ""},
			{paddingBottom: ""},
			{paddingTop: ""},
			{height: "auto"},
			{opacity: ""}
		]);
		if(options.callback) {
			options.callback();
		}
	},duration);
	// Set up the initial position of the element
	$tw.utils.setStyle(domNode,[
		{height: `${currHeight}px`},
		{opacity: "1"}
	]);
	$tw.utils.forceLayout(domNode);
	// Transition to the final position
	$tw.utils.setStyle(domNode,[
		{
			transition: `margin-top ${duration}ms ease-in-out, ` +
				`margin-bottom ${duration}ms ease-in-out, ` +
				`padding-top ${duration}ms ease-in-out, ` +
				`padding-bottom ${duration}ms ease-in-out, ` +
				`height ${duration}ms ease-in-out, ` +
				`opacity ${duration}ms ease-in-out`
		},
		{marginTop: "0px"},
		{marginBottom: "0px"},
		{paddingTop: "0px"},
		{paddingBottom: "0px"},
		{height: "0px"},
		{opacity: "0"}
	]);
}

exports.slide = {
	open: slideOpen,
	close: slideClosed
};
