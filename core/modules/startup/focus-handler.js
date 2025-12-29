/*\
title: $:/plugins/custom/sidebar-focus/startup.js
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
	var secondarySelector = ".tc-secondary-container";
	
	// Helper: Check if element is in any secondary container
	function isInSecondary(element) {
		var containers = document.querySelectorAll(secondarySelector);
		return Array.from(containers).some(function(container) {
			return container === element || container.contains(element);
		});
	}
	
	// Wait for DOM to be fully ready
	function initialize() {
		var main = document.querySelector(mainSelector);
		
		if(!main) {
			setTimeout(initialize, 100);
			return;
		}
		
		// Make main focusable
		if(!main.hasAttribute("tabindex")) {
			main.setAttribute("tabindex", "-1");
		}
		main.focus();
		
		// Make secondary containers unfocusable
		var secondaryContainers = document.querySelectorAll(secondarySelector);
		secondaryContainers.forEach(function(element) {
			element.removeAttribute("tabindex");
		});
	}
	
	// Handle spacebar scrolling in secondary containers
	document.addEventListener("keydown", function(e) {
		if(e.key !== " ") return;
		
		if(isInSecondary(e.target)) {
			// Allow spacebar in input fields
			if(e.target.tagName === "INPUT" || 
			   e.target.tagName === "TEXTAREA" || 
			   e.target.isContentEditable) {
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
		
		// Don't refocus if clicking in input fields
		if(e.target.tagName === "INPUT" || 
		   e.target.tagName === "TEXTAREA" ||
		   e.target.isContentEditable) {
			return;
		}
		
		setTimeout(function() {
			main.focus();
		}, 10);
	}, true);
	
	initialize();
};
