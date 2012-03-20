/*\
title: js/macros/zoomer.js

\*/
(function(){

/*jslint node: true, browser: true */
"use strict";

var Renderer = require("../Renderer.js").Renderer,
    Dependencies = require("../Dependencies.js").Dependencies,
	Tiddler = require("../Tiddler.js").Tiddler,
	utils = require("../Utils.js");

function startZoomer(macroNode,x,y) {
	macroNode.inZoomer = true;
	macroNode.startX = x;
	macroNode.startY = y;
	utils.addClass(document.body,"in-zoomer");
}

function stopZoomer(macroNode) {
	var newScrollY = macroNode.yFactor * (macroNode.bodyHeight - macroNode.windowHeight);
	macroNode.inZoomer = false;
	window.scrollTo(0,newScrollY);
	document.body.style.webkitTransform = "translateY(" + newScrollY * macroNode.xFactor + "px) " + 
										  "scale(" + macroNode.scale + ") " +
										  "translateY(" + ((macroNode.windowHeight / macroNode.scale) - macroNode.bodyHeight) * macroNode.yFactor * macroNode.xFactor + "px)";
	utils.removeClass(document.body,"in-zoomer");
	document.body.style.webkitTransform = "translateY(0) scale(1) translateY(0)";
}

/*
Zoom the body element given a touch/mouse position in screen coordinates
*/
function hoverZoomer(macroNode,x,y) {
	// Put the transform origin at the top in the middle
	document.body.style.webkitTransformOrigin = "50% 0";
	// Some shortcuts
	macroNode.bodyWidth = document.body.offsetWidth;
	macroNode.bodyHeight = document.body.offsetHeight;
	macroNode.windowWidth = window.innerWidth;
	macroNode.windowHeight = window.innerHeight;
	// Compute the scale factor for fitting the entire page into the window. This is
	// the scale factor we'll use when the touch is far to the left
	macroNode.minScale = macroNode.windowHeight / macroNode.bodyHeight;
	if(macroNode.minScale < 0.1) {
		// Don't scale to less than 10% of original size
		macroNode.minScale = 0.1;
	} else if(macroNode.minScale > 1) {
		// Nor should we scale up if the body is shorter than the window
		macroNode.minScale = 1;
	}
	// We divide the screen into two horizontal zones divided by the right edge of the body at maximum zoom (ie minimum scale)
	macroNode.splitPos = macroNode.windowWidth/2 + (macroNode.bodyWidth * macroNode.minScale)/2;
	// Compute the 0->1 ratio (from right to left) of the position of the touch within the right zone
	macroNode.xFactor = (macroNode.windowWidth - x) / (macroNode.windowWidth - macroNode.splitPos);
	if(macroNode.xFactor > 1) {
		macroNode.xFactor = 1;
	}
	// And the 0->1 ration (from top to bottom) of the position of the touch down the screen
	macroNode.yFactor = y/macroNode.windowHeight;
	// Now interpolate the scale
	macroNode.scale = (macroNode.minScale - 1) * macroNode.xFactor + 1;
	// Apply the transform
	document.body.style.webkitTransform = "translateY(" + window.scrollY * macroNode.xFactor + "px) " + 
										  "scale(" + macroNode.scale + ") " +
										  "translateY(" + ((macroNode.windowHeight / macroNode.scale) - macroNode.bodyHeight) * macroNode.yFactor * macroNode.xFactor + "px)";
}

exports.macro = {
	name: "zoomer",
	wrapperTag: "div",
	params: {
	},
	events: {
		touchstart: function(event) {
			startZoomer(this,event.touches[0].clientX,event.touches[0].clientY);
			hoverZoomer(this,event.touches[0].clientX,event.touches[0].clientY);
			event.preventDefault();
			return false;
		},
		touchmove: function(event) {
			hoverZoomer(this,event.touches[0].clientX,event.touches[0].clientY);
			event.preventDefault();
			return false;
		},
		touchend: function(event) {
			stopZoomer(this);
			event.preventDefault();
			return false;
		}
	},
	execute: function() {
		this.inZoomer = false;
		return [];
	}
};

})();

