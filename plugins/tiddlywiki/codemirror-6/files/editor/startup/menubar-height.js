/*\
title: $:/plugins/tiddlywiki/codemirror-6/startup/menubar-height.js
type: application/javascript
module-type: startup

Startup module to track menubar height and set CSS variable for sticky positioning

\*/
"use strict";

exports.name = "cm6-menubar-height-tracker";
exports.platforms = ["browser"];
exports.after = ["startup"];
exports.synchronous = true;

exports.startup = function() {
	var menubarObserver = null;
	var isTracking = false;
	/*
	Last published value, so repeat writes are skipped.

	Writing a custom property on documentElement invalidates style for the whole
	document, and the next layout read then has to recompute it. Unguarded, that is one
	forced style-and-layout pass per wiki change -- and in a wiki with no menubar it
	never stops, because tracking never starts.
	*/
	var lastMenubarHeight = null;

	var raf = window.requestAnimationFrame ?
		window.requestAnimationFrame.bind(window) :
		function(cb) { return setTimeout(cb,16); };

	function publish(value) {
		if(value === lastMenubarHeight) {
			return;
		}
		lastMenubarHeight = value;
		document.documentElement.style.setProperty("--tv-menubar-height",value);
	}

	function updateMenubarHeight(menubar) {
		var computedStyle = window.getComputedStyle(menubar);
		var position = computedStyle.position;
		var isOverlapping = position === "fixed" || position === "sticky" || position === "absolute";
		publish(isOverlapping ? (menubar.getBoundingClientRect().height + "px") : "0px");
	}

	/*
	Batch the measure-and-write into an animation frame and coalesce bursts.

	Updating synchronously from the ResizeObserver callback writes during the observer's
	own delivery cycle, which re-triggers it -- the "ResizeObserver loop completed with
	undelivered notifications" warning -- and forces a layout on each pass.
	*/
	var updatePending = false;
	function scheduleUpdate(menubar) {
		if(updatePending) {
			return;
		}
		updatePending = true;
		raf(function() {
			updatePending = false;
			updateMenubarHeight(menubar);
		});
	}

	function setupMenubarTracking(menubar) {
		if(isTracking) return;
		isTracking = true;

		updateMenubarHeight(menubar);

		if(typeof ResizeObserver !== "undefined") {
			menubarObserver = new ResizeObserver(function() {
				scheduleUpdate(menubar);
			});
			menubarObserver.observe(menubar);
		}

		window.addEventListener("resize", function() {
			scheduleUpdate(menubar);
		});
	}

	function checkForMenubar() {
		var menubar = document.querySelector(".tc-menubar.tc-adjust-top-of-scroll");
		if(menubar) {
			setupMenubarTracking(menubar);
		} else {
			publish("0px");
		}
	}

	var checkPending = false;
	function scheduleCheck() {
		if(checkPending) {
			return;
		}
		checkPending = true;
		raf(function() {
			checkPending = false;
			checkForMenubar();
		});
	}

	/*
	Deferred rather than run inline.

	There is no menubar to measure until the page has rendered, and measuring here forces
	a style-and-layout pass during startup, before anything has been painted.
	*/
	scheduleCheck();

	// Re-check after wiki changes (DOM updates after refresh cycle)
	if(!isTracking) {
		$tw.wiki.addEventListener("change", function() {
			if(!isTracking) {
				scheduleCheck();
			}
		});
	}
};
