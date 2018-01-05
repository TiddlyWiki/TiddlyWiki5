/*\
title: $:/plugins/tiddlywiki/dynaview/dynaview.js
type: application/javascript
module-type: startup

Zoom everything

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Export name and synchronous status
exports.name = "dynaview";
exports.platforms = ["browser"];
exports.after = ["render"];
exports.synchronous = true;

var isWaitingForAnimationFrame = false;

exports.startup = function() {
	window.addEventListener("load",onScrollOrResize,false);
	window.addEventListener("scroll",onScrollOrResize,false);
	window.addEventListener("resize",onScrollOrResize,false);
	$tw.hooks.addHook("th-page-refreshed",function() {
		checkVisibility();
	});
};

function onScrollOrResize(event) {
	if(!isWaitingForAnimationFrame) {
		window.requestAnimationFrame(function() {
			setZoomClasses();
			checkVisibility();
			isWaitingForAnimationFrame = false;
		});
	}
	isWaitingForAnimationFrame = true;
}

function setZoomClasses() {
	var zoomFactor = document.body.scrollWidth / window.innerWidth,
		classList = document.body.classList;
	classList.add("tc-dynaview")
	classList.toggle("tc-dynaview-zoom-factor-1",zoomFactor <= 2);
	classList.toggle("tc-dynaview-zoom-factor-1-and-above",zoomFactor >= 1);
	classList.toggle("tc-dynaview-zoom-factor-1a-and-above",zoomFactor >= 1.14);
	classList.toggle("tc-dynaview-zoom-factor-1b-and-above",zoomFactor >= 1.33);
	classList.toggle("tc-dynaview-zoom-factor-1c-and-above",zoomFactor >= 1.6);
	classList.toggle("tc-dynaview-zoom-factor-2",zoomFactor >= 2 && zoomFactor <= 3);
	classList.toggle("tc-dynaview-zoom-factor-2-and-above",zoomFactor >= 2);
	classList.toggle("tc-dynaview-zoom-factor-2a-and-above",zoomFactor >= 2.66);
	classList.toggle("tc-dynaview-zoom-factor-3",zoomFactor >= 3 && zoomFactor <= 4);
	classList.toggle("tc-dynaview-zoom-factor-3-and-above",zoomFactor >= 3);
	classList.toggle("tc-dynaview-zoom-factor-4",zoomFactor >= 4);
	classList.toggle("tc-dynaview-zoom-factor-4-and-above",zoomFactor >= 4);
}

function checkVisibility() {
	var elements = document.querySelectorAll(".tc-dynaview-set-tiddler-when-visible");
	$tw.utils.each(elements,function(element) {
		// Check if the element is visible
		var elementRect = element.getBoundingClientRect(),
			viewportWidth = window.innerWidth || document.documentElement.clientWidth,
			viewportHeight = window.innerHeight || document.documentElement.clientHeight,
			viewportRect = {
				left: 0,
				right: viewportWidth,
				top: 0,
				bottom: viewportHeight
			};
		if(element.classList.contains("tc-dynaview-expand-viewport")) {
			viewportRect.left -= viewportWidth;
			viewportRect.right += viewportWidth;
			viewportRect.top -= viewportHeight;
			viewportRect.bottom += viewportHeight;
		}
		if(!(elementRect.left > viewportRect.right || 
				elementRect.right < viewportRect.left || 
				elementRect.top > viewportRect.bottom ||
				elementRect.bottom < viewportRect.top)) {
			// Set the tiddler value
			var tiddler = element.getAttribute("data-dynaview-set-tiddler"),
				value = element.getAttribute("data-dynaview-set-value") || "";
			if(tiddler && $tw.wiki.getTiddlerText(tiddler) !== value) {
				$tw.wiki.addTiddler(new $tw.Tiddler({title: tiddler, text: value}));	
			}
		}
	});
}

})();