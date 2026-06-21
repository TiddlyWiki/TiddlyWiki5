/*\
title: $:/plugins/BurningTreeC/minimap/page-scrollbar.js
type: application/javascript
module-type: startup

Keeps two pieces of always-on, widget-independent state on <html>:

1. The tc-minimap-overlay-scrollbar class, toggled on when the page is scrolled by
   an overlay scrollbar (the page overflows but reserves no scrollbar gutter). The
   minimap's edge grip is widened in that case so it stays grabbable to the left of
   the scrollbar that paints on top of it. A classic scrollbar reserves a gutter,
   so a fixed `right: 0` element already clears it and no adjustment is needed.

2. The --tv-minimap-scrollbar-width custom property: the width of the vertical
   scrollbar of the container the minimap sits within (the sidebar scrollable). The
   grip handle's placement reads this, so it must be present and accurate AT ALL
   TIMES - including while the minimap is hidden and the widget is therefore not
   mounted to publish it itself. Hence it is measured here, independent of the
   widget's lifecycle. While the widget is mounted it republishes the same value on
   its own observers; the two always agree because they measure the same element.

\*/
"use strict";

// The container the story-river minimap is placed within. Its scrollbar width is
// what the grip clears. Kept in sync with the widget's resolved hostScroller.
var HOST_SELECTOR = ".tc-sidebar-scrollable";
var SCROLLBAR_VAR = "--tv-minimap-scrollbar-width";

exports.name = "minimap-page-scrollbar-tracker";
exports.platforms = ["browser"];
exports.after = ["startup"];
exports.synchronous = true;

exports.startup = function() {
	var root = document.documentElement;
	if(!root || !root.style) {
		return;
	}

	function update() {
		var win = document.defaultView || window,
			// innerWidth includes the scrollbar; documentElement.clientWidth excludes
			// a classic (space-reserving) scrollbar. So a difference means a classic
			// gutter is reserved; zero means an overlay scrollbar or none.
			gutter = Math.max(0, win.innerWidth - root.clientWidth),
			// An overlay scrollbar is present only when the page actually overflows
			// AND no classic gutter is reserved. A reserved gutter or a
			// non-overflowing page must NOT count - otherwise the grip would widen
			// when there's no scrollbar painting over it at all.
			hasOverlay = gutter === 0 && root.scrollHeight > root.clientHeight;
		root.classList.toggle("tc-minimap-overlay-scrollbar",hasOverlay);
		// Publish the host container's scrollbar width. offsetWidth - clientWidth is
		// the vertical scrollbar's footprint (0 with no/overlay scrollbar, or when
		// the host is absent/hidden). Always set it so the variable is never missing.
		var host = document.querySelector(HOST_SELECTOR),
			scrollbarWidth = host ? Math.max(0, host.offsetWidth - host.clientWidth) : 0;
		root.style.setProperty(SCROLLBAR_VAR,scrollbarWidth + "px");
	}

	update();

	window.addEventListener("resize", update);

	// The scrollbar appears/disappears as page/sidebar content grows/shrinks, which
	// changes client width without a window resize.
	if(typeof ResizeObserver !== "undefined") {
		var ro = new ResizeObserver(update);
		ro.observe(root);
		if(document.body) {
			ro.observe(document.body);
		}
		var host = document.querySelector(HOST_SELECTOR);
		if(host) {
			ro.observe(host);
		}
	}

	// Re-check after wiki changes (DOM updates land after the refresh cycle).
	$tw.wiki.addEventListener("change", function() {
		$tw.utils.nextTick(update);
	});
};
