/*\
title: $:/core/modules/utils/dom/sprite.js
type: application/javascript
module-type: utils

Animated sprites

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Create a sprite factory object
*/
var Sprite = function() {
};

/*
Animates a sprite that moves from the source location to the destination.
	source: DOM element or {left:,top:,width:,height:} rectangle in viewport coordinates
	dest: DOM element or {left:,top:,width:,height:} rectangle in viewport coordinates
	content: content to be displayed in the sprite {text:,style:,class:}
*/
Sprite.prototype.fly = function(source,dest,content) {
	// Create the element
	var sprite = document.createElement("div");
	if(content.text) {
		sprite.appendChild(document.createTextNode(content.text));
	}
	if(content.style) {
		sprite.setAttribute("style",content.style);
	}
	if(content["class"]) {
		sprite["class"] = content["class"];
	}
	document.body.appendChild(sprite);
	// Set the initial position of the sprite
	var currWidth = sprite.offsetWidth,
		scale = source.width/currWidth;
	$tw.utils.setStyle(sprite,[
		{position: "fixed"},
		{top: "0px"},
		{left: "0px"},
		{transition: "none"},
		{transformOrigin: "0% 0%"},
		{transform: "translateX(" + source.left + "px) translateY(" + source.top + "px) scale(" + scale + ")"}
	]);
	// Set up a transition event handler to delete the sprite
	sprite.addEventListener($tw.utils.convertEventName("transitionEnd"),function(event) {
		sprite.parentNode.removeChild(sprite);
	},false);
	// Transition to its new position
	$tw.utils.forceLayout(sprite);
	scale = dest.width/currWidth;
	$tw.utils.setStyle(sprite,[
		{transition: $tw.utils.roundTripPropertyName("transform") + " " + $tw.config.preferences.animationDurationMs + " ease-in-out, "+
					"opacity " + $tw.config.preferences.animationDurationMs + " ease-out"},
		{transformOrigin: "0% 0%"},
		{transform: "translateX(" + dest.left + "px) translateY(" + dest.top + "px) scale(" + scale + ")"}
	]);
};

exports.Sprite = Sprite;

})();
