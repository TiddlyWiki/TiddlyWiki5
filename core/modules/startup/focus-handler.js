/*\
title: $:/core/modules/startup/focus-handler.js
type: application/javascript
module-type: startup

Handles focus management and spacebar scrolling for sidebar layout

\*/

"use strict";

exports.name = "focus-handler";
exports.platforms = ["browser"];
exports.after = ["render"];
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
	
	// Helper: Check if focus is in an iframe
	function isFocusInIframe() {
		return document.activeElement && document.activeElement.tagName === "IFRAME";
	}
	
	// Helper: Check if there's an active text selection
	function hasTextSelection() {
		var selection = window.getSelection();
		return selection && selection.toString().length > 0;
	}
	
	// Helper: Save and restore selection while focusing
	function focusWithSelection(element) {
		var selection = window.getSelection();
		var ranges = [];
		
		// Save current selection ranges
		if(selection.rangeCount > 0) {
			for(var i = 0; i < selection.rangeCount; i++) {
				ranges.push(selection.getRangeAt(i).cloneRange());
			}
		}
		
		// Focus the element
		element.focus();
		
		// Restore selection if there was one
		if(ranges.length > 0) {
			selection.removeAllRanges();
			ranges.forEach(function(range) {
				selection.addRange(range);
			});
		}
	}
	
	// Wait for DOM to be fully ready
	function initialize() {
		var main = document.querySelector(mainSelector);
		
		// Make main focusable
		if(!main.hasAttribute("tabindex")) {
			main.setAttribute("tabindex", "-1");
		}
		
		// don't steal focus from the sidebar-search
		// main.focus();
		
		// Make secondary containers unfocusable
		var secondaryContainers = document.querySelectorAll(secondarySelector);
		secondaryContainers.forEach(function(element) {
			element.removeAttribute("tabindex");
		});
	}
	
	// Handle spacebar scrolling in secondary containers
	document.addEventListener("keydown", function(e) {
		if(e.key !== " ") return;
		
		// Allow spacebar if focus is in iframe (editor)
		if(isFocusInIframe()) return;
		
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
		
		// Allow tab if focus is in iframe (editor)
		if(isFocusInIframe()) return;
		
		// Don't trap if there's a text selection
		if(hasTextSelection()) return;
		
		var main = document.querySelector(mainSelector);
		if(!main) return;
		
		var focusableElements = main.querySelectorAll(
			'a[href], button, input, textarea, select, details, iframe, [tabindex]:not([tabindex="-1"])'
		);
		
		if(focusableElements.length === 0) {
			e.preventDefault();
			focusWithSelection(main);
			return;
		}
		
		var firstElement = focusableElements[0];
		var lastElement = focusableElements[focusableElements.length - 1];
		var activeElement = document.activeElement;
		
		// Only trap if we're in main
		var inMain = activeElement === main || main.contains(activeElement);
		if(!inMain) {
			e.preventDefault();
			focusWithSelection(main);
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
	
	// Pointerup-Handler: Focus main after text selection is complete
	document.addEventListener("pointerup", function(e) {
		var main = document.querySelector(mainSelector);
		if(!main) return;
		
		// Don't refocus if in iframe or input fields
		if(isFocusInIframe()) return;
		if(e.target.tagName === "INPUT" || 
		   e.target.tagName === "TEXTAREA" ||
		   e.target.isContentEditable) {
			return;
		}
		
		// Small delay to let selection complete
		setTimeout(function() {
			// If there's a text selection, focus main while preserving it
			if(hasTextSelection()) {
				focusWithSelection(main);
			}
		}, 10);
	}, true);
	
	// Click-Handler: Always refocus main after clicks (except in input fields)
	document.addEventListener("click", function(e) {
		var main = document.querySelector(mainSelector);
		if(!main) return;
		
		// Don't refocus if there's a text selection (handled by pointerup)
		if(hasTextSelection()) return;
		
		// Don't refocus if clicking in input fields or iframe
		if(e.target.tagName === "INPUT" || 
		   e.target.tagName === "TEXTAREA" ||
		   e.target.tagName === "IFRAME" ||
		   e.target.isContentEditable) {
			return;
		}
		
		setTimeout(function() {
			// Don't refocus if focus moved to iframe or text is selected
			if(isFocusInIframe() || hasTextSelection()) return;
			main.focus();
		}, 10);
	}, true);
	
	initialize();
};
