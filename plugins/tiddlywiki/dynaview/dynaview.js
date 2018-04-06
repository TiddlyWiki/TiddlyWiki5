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

var isWaitingForAnimationFrame = 0, // Bitmask:
	ANIM_FRAME_CAUSED_BY_LOAD = 1, // Animation frame was requested because of page load
	ANIM_FRAME_CAUSED_BY_SCROLL = 2, // Animation frame was requested because of page scroll
	ANIM_FRAME_CAUSED_BY_RESIZE = 4; // Animation frame was requested because of window resize

exports.startup = function() {
	window.addEventListener("load",onLoad,false);
	window.addEventListener("scroll",onScroll,false);
	window.addEventListener("resize",onResize,false);
	$tw.hooks.addHook("th-page-refreshed",function() {
		optisizeFonts();
		checkTopmost();
		checkVisibility();
		saveViewportDimensions();
	});
};

function onLoad(event) {
	if(!isWaitingForAnimationFrame) {
		window.requestAnimationFrame(worker);
	}
	isWaitingForAnimationFrame |= ANIM_FRAME_CAUSED_BY_LOAD;
}

function onScroll(event) {
	if(!isWaitingForAnimationFrame) {
		window.requestAnimationFrame(worker);
	}
	isWaitingForAnimationFrame |= ANIM_FRAME_CAUSED_BY_SCROLL;
}

function onResize(event) {
	if(!isWaitingForAnimationFrame) {
		window.requestAnimationFrame(worker);
	}
	isWaitingForAnimationFrame |= ANIM_FRAME_CAUSED_BY_RESIZE;
}

function worker() {
	if(isWaitingForAnimationFrame & (ANIM_FRAME_CAUSED_BY_RESIZE | ANIM_FRAME_CAUSED_BY_LOAD)) {
		optisizeFonts();
		saveViewportDimensions();
	}
	setZoomClasses();
	checkTopmost();
	checkVisibility();
	isWaitingForAnimationFrame = 0;
}

var lastSiteWidth, lastMaquetteString;

function optisizeFonts() {
	if($tw.wiki.getTiddlerText("$:/config/DynaView/Optisizer") === "yes") {
		var domSite = document.querySelector(".tc-dynaview-optisizer-site"),
			domMaquette = document.querySelector(".tc-dynaview-optisizer-maquette");
		if(domSite && domMaquette) {
			// Check that we're not at the same size as last time
			if(domSite.offsetWidth === lastSiteWidth && $tw.wiki.getTiddlerText("$:/config/DynaView/Optisizer/Text") === lastMaquetteString) {
				return;
			}
			// Get the current font size
			domMaquette.style.fontSize = "";
			var initialFontSize = parseInt(window.getComputedStyle(domMaquette).fontSize,10),
				minFontSize = 1,
				maxFontSize = 100,
				adjustFontSize = maxFontSize,
				newFontSize = initialFontSize,
				maquetteWidth;
			lastSiteWidth = domSite.offsetWidth;
			lastMaquetteString = $tw.wiki.getTiddlerText("$:/config/DynaView/Optisizer/Text");
			while(domMaquette.firstChild) {
				domMaquette.removeChild(domMaquette.firstChild);
			}
			domMaquette.appendChild(document.createTextNode(lastMaquetteString));
			// We use a binary search algorithm to find the optimum size
			do {
				// Apply the size we're considering
				domMaquette.style.fontSize = newFontSize + "px";
				// Measure the width of the maquette
				maquetteWidth = domMaquette.offsetWidth;
				// Adjust bigger or smaller
				if(maquetteWidth < lastSiteWidth) {
					newFontSize += adjustFontSize;
				} else {
					newFontSize -= adjustFontSize;
				}
				newFontSize = Math.min(newFontSize,maxFontSize);
				newFontSize = Math.max(newFontSize,minFontSize);
				adjustFontSize = adjustFontSize / 2;
			} while (adjustFontSize > 0.5);
			var newFontSizeString = newFontSize + "px";
			if($tw.wiki.getTiddlerText("$:/state/DynaView/Optisizer/FontSize") !== newFontSizeString) {
				$tw.wiki.setText("$:/state/DynaView/Optisizer/FontSize",undefined,undefined,newFontSizeString,undefined);
			}
		}
	}
}

function setZoomClasses() {
	var zoomFactor = document.body.scrollWidth / window.innerWidth,
		classList = document.body.classList;
	classList.add("tc-dynaview");
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
		// Bail if we've already triggered this element
		if(element.getAttribute("data-dynaview-has-triggered") === "true") {
			return;
		}
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
			element.setAttribute("data-dynaview-has-triggered",true);
		}
	});
}

function checkTopmost() {
	if($tw.wiki.getTiddlerText("$:/config/DynaView/UpdateAddressBar") === "yes") {
		var elements = document.querySelectorAll(".tc-tiddler-frame[data-tiddler-title]"),
			topmostElement = null,
			topmostElementTop = 1 * 1000 * 1000;
		$tw.utils.each(elements,function(element) {
			// Check if the element is visible
			var elementRect = element.getBoundingClientRect();
			if((elementRect.top < topmostElementTop) && (elementRect.bottom > 0)) {
				topmostElement = element;
				topmostElementTop = elementRect.top;
			}
		});
		if(topmostElement) {
			var title = topmostElement.getAttribute("data-tiddler-title"),
				hash = "#" + encodeURIComponent(title) + ":" + encodeURIComponent("[list[$:/StoryList]]");
			if(title && $tw.locationHash !== hash) {
				$tw.locationHash = hash;
				window.location.hash = hash;			
			}
		}
	}
}

function saveViewportDimensions() {
	if($tw.wiki.getTiddlerText("$:/config/DynaView/ViewportDimensions") === "yes") {
		var viewportWidth = window.innerWidth || document.documentElement.clientWidth,
			viewportHeight = window.innerHeight || document.documentElement.clientHeight;
		if($tw.wiki.getTiddlerText("$:/state/DynaView/ViewportDimensions/Width") !== viewportWidth.toString()) {
			$tw.wiki.setText("$:/state/DynaView/ViewportDimensions/Width",undefined,undefined,viewportWidth.toString(),undefined);
		}
		if($tw.wiki.getTiddlerText("$:/state/DynaView/ViewportDimensions/Height") !== viewportHeight.toString()) {
			$tw.wiki.setText("$:/state/DynaView/ViewportDimensions/Height",undefined,undefined,viewportHeight.toString(),undefined);
		}
	}
}

})();
