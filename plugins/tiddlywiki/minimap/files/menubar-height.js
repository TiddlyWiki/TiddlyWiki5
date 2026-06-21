/*\
title: $:/plugins/BurningTreeC/minimap/menubar-height.js
type: application/javascript
module-type: startup

Publish the --tv-menubar-height CSS variable (used to offset the minimap below a
fixed menubar) if no other plugin already provides it. Mirrors the codemirror-6
editor's menubar-height tracker, and defers to it when that plugin is installed.

\*/
"use strict";

exports.name = "minimap-menubar-height-tracker";
exports.platforms = ["browser"];
exports.after = ["startup","cm6-menubar-height-tracker"];
exports.synchronous = true;

exports.startup = function() {
	// If the menubar height is already published (e.g. by the codemirror-6
	// plugin), leave it alone.
	var existing = window.getComputedStyle(document.documentElement).getPropertyValue("--tv-menubar-height");
	if(existing && existing.trim() !== "") {
		return;
	}

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
