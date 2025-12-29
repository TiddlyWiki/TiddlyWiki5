/*\
title: $:/core/modules/startup/focus-handler.js
type: application/javascript
module-type: startup
Handles focus management and spacebar scrolling for sidebar layout
\*/
"use strict";

exports.name = "sidebar-focus";
exports.platforms = ["browser"];
exports.after = ["story"];
exports.synchronous = true;

exports.startup = function() {
	var mainSelector = ".tc-story-river";
	var sidebarSelector = ".tc-sidebar";
	
	// Wait for DOM to be fully ready
	function initialize() {
		var main = document.querySelector(mainSelector);
		var sidebar = document.querySelector(sidebarSelector);
		
		if(!main) {
			setTimeout(initialize, 100);
			return;
		}
		
		// Make containers focusable
		if(!main.hasAttribute("tabindex")) {
			main.setAttribute("tabindex", "-1");
		}
		main.focus();
		
		if(sidebar && !sidebar.hasAttribute("tabindex")) {
			sidebar.setAttribute("tabindex", "-1");
		}
	}
	
	// Handle spacebar scrolling
	document.addEventListener("keydown", function(e) {
		if(e.key !== " ") return;
		
		var target = e.target;
		var sidebar = document.querySelector(sidebarSelector);
		
		if(sidebar && (target === sidebar || sidebar.contains(target))) {
			// Allow spacebar in input fields
			if(target.tagName === "INPUT" || 
			   target.tagName === "TEXTAREA" || 
			   target.isContentEditable) {
				return;
			}
			e.preventDefault();
		}
	}, true);
	
	// Tab-Trapping: Keep tab navigation within main content
	document.addEventListener("keydown", function(e) {
		if(e.key !== "Tab") return;
		
		var main = document.querySelector(mainSelector);
		if(!main) return;
		
		var focusableElements = main.querySelectorAll(
			'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])'
		);
		
		if(focusableElements.length === 0) {
			e.preventDefault();
			main.focus();
			return;
		}
		
		var firstElement = focusableElements[0];
		var lastElement = focusableElements[focusableElements.length - 1];
		var activeElement = document.activeElement;
		
		// Only trap if we're in main
		var inMain = activeElement === main || main.contains(activeElement);
		if(!inMain) {
			// If focus is outside main, bring it back to main
			e.preventDefault();
			main.focus();
			return;
		}
		
		// Trap tab at boundaries
		if(e.shiftKey && activeElement === firstElement) {
			e.preventDefault();
			lastElement.focus();
		} else if(!e.shiftKey && activeElement === lastElement) {
			e.preventDefault();
			firstElement.focus();
		} else if(activeElement === main) {
			e.preventDefault();
			firstElement.focus();
		}
	});
	
	// Click-Handler: Always refocus main after clicks (except in input fields)
	document.addEventListener("click", function(e) {
		var main = document.querySelector(mainSelector);
		if(!main) return;
		
		// Don't refocus if clicking in input fields (allow editing in sidebar)
		if(e.target.tagName === "INPUT" || 
		   e.target.tagName === "TEXTAREA" ||
		   e.target.isContentEditable) {
			return;
		}
		
		// Small delay to allow link/button actions to complete first
		setTimeout(function() {
			main.focus();
		}, 10);
	}, true);
	
	initialize();
};
