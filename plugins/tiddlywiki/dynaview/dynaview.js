/*\
title: $:/plugins/tiddlywiki/dynaview/dynaview.js
type: application/javascript
module-type: startup

Zoom everything

\*/

"use strict";

// Export name and synchronous status
exports.name = "dynaview";
exports.platforms = ["browser"];
exports.before = ["story"];
exports.synchronous = true;

const STATE_OUT_OF_VIEW = "0";
const STATE_NEAR_VIEW = "1";
const STATE_IN_VIEW = "2";

let isWaitingForAnimationFrame = 0; // Bitmask:
const ANIM_FRAME_CAUSED_BY_LOAD = 1; // Animation frame was requested because of page load
const ANIM_FRAME_CAUSED_BY_SCROLL = 2; // Animation frame was requested because of page scroll
const ANIM_FRAME_CAUSED_BY_RESIZE = 4; // Animation frame was requested because of window resize

const LOCAL_STORAGE_KEY_PREFIX = "tw5-dynaview-scroll-position#";

let hasRestoredScrollPosition = false;

let localStorageHasFailed = false;

exports.startup = function() {
	let topmost = null; let lastScrollY;
	$tw.boot.disableStartupNavigation = true;
	window.addEventListener("load",onLoad,false);
	window.addEventListener("scroll",onScroll,false);
	window.addEventListener("resize",onResize,false);
	$tw.hooks.addHook("th-page-refreshing",() => {
		if(!hasRestoredScrollPosition) {
			topmost = restoreScrollPosition();
		} else if(shouldPreserveScrollPosition()) {
			topmost = findTopmostTiddler();
		}
		lastScrollY = window.scrollY;
	});
	$tw.hooks.addHook("th-page-refreshed",() => {
		if(lastScrollY === window.scrollY) { // Don't do scroll anchoring if the scroll position got changed
			if(shouldPreserveScrollPosition() || !hasRestoredScrollPosition) {
				scrollToTiddler(topmost);
				hasRestoredScrollPosition = true;
			}
		}
		updateAddressBar();
		saveScrollPosition();
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
		saveViewportDimensions();
	}
	setZoomClasses();
	updateAddressBar();
	saveScrollPosition();
	checkVisibility();
	isWaitingForAnimationFrame = 0;
}

function setZoomClasses() {
	const zoomFactor = document.body.scrollWidth / window.innerWidth;
	const {classList} = document.body;
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
	const elements = document.querySelectorAll(".tc-dynaview-track-tiddler-when-visible");
	$tw.utils.each(elements,(element) => {
		// Calculate whether the element is visible
		const elementRect = element.getBoundingClientRect();
		const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
		const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
		const viewportRect = {
			left: 0,
			right: viewportWidth,
			top: 0,
			bottom: viewportHeight
		};
		const title = element.getAttribute("data-dynaview-track-tiddler");
		if(title) {
			const currValue = $tw.wiki.getTiddlerText(title);
			let newValue = currValue;
			// Within viewport
			if(!(elementRect.left > viewportRect.right ||
				elementRect.right < viewportRect.left ||
				elementRect.top > viewportRect.bottom ||
				elementRect.bottom < viewportRect.top)) {
				newValue = STATE_IN_VIEW;
				// Near viewport
			} else if(!(elementRect.left > (viewportRect.right + viewportWidth) ||
				elementRect.right < (viewportRect.left - viewportWidth) ||
				elementRect.top > (viewportRect.bottom + viewportHeight) ||
				elementRect.bottom < (viewportRect.top - viewportHeight))) {
				newValue = STATE_NEAR_VIEW;
			} else {
				// Outside viewport
				if(currValue !== undefined) {
					newValue = STATE_OUT_OF_VIEW;
				}
			}
			if(newValue !== currValue) {
				$tw.wiki.addTiddler(new $tw.Tiddler({title,text: newValue}));
			}
		}
	});
}

function updateAddressBar() {
	if($tw.wiki.getTiddlerText("$:/config/DynaView/UpdateAddressBar") === "yes") {
		const top = findTopmostTiddler();
		if(top.element) {
			const hash = `#${encodeURIComponent(top.title)}:${encodeURIComponent("[list[$:/StoryList]]")}`;
			if(title && $tw.locationHash !== hash) {
				$tw.locationHash = hash;
				window.location.hash = hash;
			}
		}
	}
}

function saveScrollPosition() {
	if(!localStorageHasFailed) {
		if(hasRestoredScrollPosition && $tw.wiki.getTiddlerText("$:/config/DynaView/RestoreScrollPositionAtStartup") === "yes") {
			const top = findTopmostTiddler();
			if(top.element) {
				try {
					window.localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + window.location.pathname,JSON.stringify({
						title: top.title,
						offset: top.offset
					}));
				} catch(e) {
					localStorageHasFailed = true;
				}
			}
		}
	}
}

function restoreScrollPosition() {
	let json;
	if(!localStorageHasFailed) {
		try {
			json = JSON.parse(window.localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + window.location.pathname));
		} catch(e) {
			localStorageHasFailed = true;
		};
	}
	return json;
}

/*
tiddlerDetails: {title: <title of tiddler to scroll to>, offset: <offset in pixels from the top of the tiddler>}
*/
function scrollToTiddler(tiddlerDetails) {
	if(!$tw.pageScroller.isScrolling() && tiddlerDetails) {
		const elements = document.querySelectorAll(".tc-tiddler-frame[data-tiddler-title]");
		let topmostTiddlerElement = null;
		$tw.utils.each(elements,(element) => {
			if(element.getAttribute("data-tiddler-title") === tiddlerDetails.title) {
				topmostTiddlerElement = element;
			}
		});
		if(topmostTiddlerElement) {
			const rect = topmostTiddlerElement.getBoundingClientRect();
			const scrollY = Math.round(window.scrollY + rect.top + tiddlerDetails.offset);
			if(scrollY !== window.scrollY) {
				window.scrollTo(window.scrollX,scrollY);
			}
		}
	}
}

function shouldPreserveScrollPosition() {
	return $tw.wiki.getTiddlerText("$:/config/DynaView/PreserveScrollPosition") === "yes";
}

function findTopmostTiddler() {
	const elements = document.querySelectorAll(".tc-tiddler-frame[data-tiddler-title]");
	let topmostElement = null;
	let topmostElementTop = 1 * 1000 * 1000;
	$tw.utils.each(elements,(element) => {
		// Check if the element is visible
		const elementRect = element.getBoundingClientRect();
		if((elementRect.top < topmostElementTop) && (elementRect.bottom > 0)) {
			topmostElement = element;
			topmostElementTop = elementRect.top;
		}
	});
	return {
		element: topmostElement,
		offset: -topmostElementTop,
		title: topmostElement ? topmostElement.getAttribute("data-tiddler-title") : null
	};
}

let previousViewportWidth; let previousViewportHeight;

function saveViewportDimensions() {
	const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
	const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
	if(document.querySelector(".tc-dynaview-request-refresh-on-resize")) {
		if(previousViewportWidth !== viewportWidth || previousViewportHeight !== viewportHeight) {
			const count = parseInt($tw.wiki.getTiddlerText("$:/state/DynaView/ViewportDimensions/ResizeCount","0"),10) || 0;
			$tw.wiki.addTiddler(new $tw.Tiddler({title: "$:/state/DynaView/ViewportDimensions/ResizeCount",text: `${count + 1}`}));
			previousViewportWidth = viewportWidth;
			previousViewportHeight = viewportHeight;
		}
	}
	if($tw.wiki.getTiddlerText("$:/config/DynaView/ViewportDimensions") === "yes") {
		if($tw.wiki.getTiddlerText("$:/state/DynaView/ViewportDimensions/Width") !== viewportWidth.toString()) {
			$tw.wiki.setText("$:/state/DynaView/ViewportDimensions/Width",undefined,undefined,viewportWidth.toString(),undefined);
		}
		if($tw.wiki.getTiddlerText("$:/state/DynaView/ViewportDimensions/Height") !== viewportHeight.toString()) {
			$tw.wiki.setText("$:/state/DynaView/ViewportDimensions/Height",undefined,undefined,viewportHeight.toString(),undefined);
		}
	}
}
