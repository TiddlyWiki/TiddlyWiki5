/*\
title: $:/plugins/tiddlywiki/menubar/startup.js
type: application/javascript
module-type: startup

Startup module to track menubar height and set CSS variable for sticky positioning

\*/

"use strict";

exports.name = "menubar-height-tracker";
exports.platforms = ["browser"];
exports.after = ["startup"];
exports.synchronous = true;

var menubarObserver = null;

exports.startup = function () {
	var menubar = document.querySelector(".tc-menubar.tc-adjust-top-of-scroll");
	if(!menubar) {
		// No menubar found, set to 0
		document.documentElement.style.setProperty("--tv-menubar-height","0px");
		return;
	}

	// Function to update the CSS variable
	function updateMenubarHeight() {
		// Only account for menubar if it's fixed, sticky, or absolute (overlapping content)
		var computedStyle = window.getComputedStyle(menubar);
		var position = computedStyle.position;
		var isOverlapping = position === "fixed" || position === "sticky" || position === "absolute";

		if(isOverlapping) {
			var height = menubar.getBoundingClientRect().height;
			document.documentElement.style.setProperty("--tv-menubar-height", height + "px");
		} else {
			// Menubar is in normal flow, no offset needed
			document.documentElement.style.setProperty("--tv-menubar-height","0px");
		}
	}

	// Initial update
	updateMenubarHeight();

	// Set up ResizeObserver to track menubar size changes
	if(typeof ResizeObserver !== "undefined" && !menubarObserver) {
		menubarObserver = new ResizeObserver(function () {
			updateMenubarHeight();
		});
		menubarObserver.observe(menubar);
	}

	// Also update on window resize as fallback
	window.addEventListener("resize",updateMenubarHeight);
};

