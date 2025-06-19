/*\
title: $:/plugins/tiddlywiki/dynannotate/element-spotlight.js
type: application/javascript
module-type: library

Manages the element spotlight effect

\*/
"use strict";

function ElementSpotlight() {
	this.animationStartTime; // Undefined if no animation is in  progress
	// Create DOM nodes
	this.spotlightElement = $tw.utils.domMaker("div",{
		"class": "tc-dynannotate-spotlight"
	});
	this.spotlightWrapper = $tw.utils.domMaker("div",{
		"class": "tc-dynannotate-spotlight-wrapper",
		children: [
			this.spotlightElement
		]
	});
	document.body.appendChild(this.spotlightWrapper);
}

/*
Return the first visible element that matches a selector
*/
ElementSpotlight.prototype.querySelectorSafe = function(selector) {
	var targetNodes;
	// Get the matching elements
	try {
		targetNodes = document.querySelectorAll(selector);
	} catch(e) {
		console.log("Error with selector: " + selector);
	}
	if(!targetNodes) {
		return undefined;
	}
	// Remove any elements from the start of the list that are hidden, or have hidden ancestors
	var didRemoveFirstEntry;
	do {
		didRemoveFirstEntry = false;
		var hasHiddenAncestor = false,
			n = targetNodes[0];
		while(n) {
			if(n.hidden || (n instanceof Element && window.getComputedStyle(n).display === "none")) {
				hasHiddenAncestor = true;
				break;
			}
			n = n.parentNode;
		}
		if(hasHiddenAncestor) {
			// Remove first entry from targetNodes array
			targetNodes = [].slice.call(targetNodes, 1); 
			didRemoveFirstEntry = true;
		}
	} while(didRemoveFirstEntry)
	// Return the first result
	return targetNodes[0];
};

ElementSpotlight.prototype.positionSpotlight = function(x,y,innerRadius,outerRadius,opacity) {
	this.spotlightElement.style.display = "block";
	this.spotlightElement.style.backgroundImage = "radial-gradient(circle at " + (x / document.documentElement.clientWidth * 100) + "% " + (y / document.documentElement.clientHeight * 100) + "%, transparent " + innerRadius + "px, rgba(0, 0, 0, " + opacity + ") " + outerRadius + "px)";
};

ElementSpotlight.prototype.easeInOut = function(v) {
	return (Math.sin((v - 0.5) * Math.PI) + 1) / 2;
};

/*
Shine a spotlight on the first element that matches an array of selectors
*/
ElementSpotlight.prototype.shineSpotlight = function(selectors) {
	var self = this;
	function animationLoop(selectors) {
		// Calculate how far through the animation we are
		// 0...1 = zoom in
		// 1...2 = hold
		// 2...3 = fade out
		var now = new Date(),
			t = (now - self.animationStartTime) / ($tw.utils.getAnimationDuration() * 2);
		t = t >= 3 ? 3 : t;
		// Query the selector for the target element
		var targetNode, selectorIndex = 0;
		while(!targetNode && selectorIndex < selectors.length) {
			targetNode = self.querySelectorSafe(selectors[selectorIndex]);
			selectorIndex += 1;
		}
		// Position the spotlight if we've got the target
		if(targetNode) {
			var rect = targetNode.getBoundingClientRect();
			var innerRadius, outerRadius, opacity;
			if(t <= 1) {
				t = self.easeInOut(t);
				innerRadius = rect.width / 2 + (window.innerWidth * 2 * (1 - t));
				outerRadius = rect.width + (window.innerWidth * 3 * (1 - t));
				opacity = 0.2 + t / 4;
			} else if(t <= 2) {
				innerRadius = rect.width / 2;
				outerRadius = rect.width;
				opacity = 0.45;
			} else {
				t = self.easeInOut(3 - t);
				innerRadius = rect.width / 2 + (window.innerWidth * 2 * (1 - t));
				outerRadius = rect.width + (window.innerWidth * 3 * (1 - t));
				opacity = t / 3;
			}
			self.positionSpotlight((rect.left + rect.right) / 2,(rect.top + rect.bottom) / 2,innerRadius,outerRadius,opacity);
		} else {
			self.spotlightElement.style.display = "none";
		}
		// Call the next frame unless we're at the end
		if(t <= 3) {
			window.requestAnimationFrame(function () {
				animationLoop(selectors);
			});
		} else {
			// End the animation if we've exceeded the time limit
			self.animationStartTime = undefined;
		}
	}
	this.animationStartTime = new Date();
	window.requestAnimationFrame(function () {
		animationLoop(selectors);
	});
};

exports.ElementSpotlight = ElementSpotlight;
