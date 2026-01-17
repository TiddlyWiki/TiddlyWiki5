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

	function updateMenubarHeight(menubar) {
		var computedStyle = window.getComputedStyle(menubar);
		var position = computedStyle.position;
		var isOverlapping = position === "fixed" || position === "sticky" || position === "absolute";
		if(isOverlapping) {
			var height = menubar.getBoundingClientRect().height;
			document.documentElement.style.setProperty("--tv-menubar-height", height + "px");
		} else {
			document.documentElement.style.setProperty("--tv-menubar-height", "0px");
		}
	}

	function setupMenubarTracking(menubar) {
		if(isTracking) return;
		isTracking = true;

		updateMenubarHeight(menubar);

		if(typeof ResizeObserver !== "undefined") {
			menubarObserver = new ResizeObserver(function() {
				updateMenubarHeight(menubar);
			});
			menubarObserver.observe(menubar);
		}

		window.addEventListener("resize", function() {
			updateMenubarHeight(menubar);
		});
	}

	function checkForMenubar() {
		var menubar = document.querySelector(".tc-menubar.tc-adjust-top-of-scroll");
		if(menubar) {
			setupMenubarTracking(menubar);
		} else {
			document.documentElement.style.setProperty("--tv-menubar-height", "0px");
		}
	}

	// Initial check
	checkForMenubar();

	// Re-check after wiki changes (DOM updates after refresh cycle)
	if(!isTracking) {
		$tw.wiki.addEventListener("change", function() {
			if(!isTracking) {
				$tw.utils.nextTick(checkForMenubar);
			}
		});
	}
};
