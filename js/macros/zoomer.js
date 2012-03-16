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

function startZoomer(macroNode) {
	macroNode.inZoomer = true;
	utils.addClass(document.body,"in-zoomer");
}

function stopZoomer(macroNode) {
	macroNode.inZoomer = false;
	utils.removeClass(document.body,"in-zoomer");
	document.body.style.webkitTransform = "scale(1)";
}

/*
Set the position of the chooser panel within its wrapper given a touch/mouse position in screen coordinates
*/
function hoverZoomer(macroNode,x,y) {
	// Put the transform origin at the top in the middle
	document.body.style.webkitTransformOrigin = "50% 0";
	// Compute the scale factor for fitting the entire page into the window
	var scaleToFit = window.innerHeight / document.body.offsetHeight;
	// Start with a scale factor determined by how far in from the right we are
	var scale = (window.innerWidth - (window.innerWidth - x) * 2) / window.innerWidth;
	// Don't scale any smaller than needed to fit the entire page
	if(scale < scaleToFit) {
		scale = scaleToFit;
	}
	// Nothing to shift horizontally
	var translateX = 0;
	// Start by offsetting to compensate for the current scroll position
	var translateY = (window.scrollY / scale); 
	// Apply the transform
	document.body.style.webkitTransform = "scale(" + scale + ") translateX(" + translateX + "px) translateY(" + translateY + "px)";

}

exports.macro = {
	name: "zoomer",
	wrapperTag: "div",
	params: {
	},
	events: {
		touchstart: function(event) {
			startZoomer(this);
			hoverZoomer(this,event.touches[0].screenX,event.touches[0].screenY);
			event.preventDefault();
			return false;
		},
		touchmove: function(event) {
			hoverZoomer(this,event.touches[0].screenX,event.touches[0].screenY);
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

