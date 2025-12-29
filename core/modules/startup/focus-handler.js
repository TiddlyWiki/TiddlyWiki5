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
	var mainSelector = ".tc-primary-container";
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
	
	// Helper: Check if element is interactive
	function isInteractiveElement(element) {
		if(!element) return false;
		
		// Check explicit interactive class first (TiddlyWiki convention)
		if(element.classList && element.classList.contains("tc-interactive")) {
			return true;
		}
		
		var tag = element.tagName ? element.tagName.toUpperCase() : "";
		
		// Disabled elements are not interactive
		if(element.hasAttribute("disabled") || element.getAttribute("aria-disabled") === "true") {
			return false;
		}
		
		// Standard form and interactive elements
		var interactiveTags = [
			"INPUT", "TEXTAREA", "SELECT", "BUTTON", "OPTION", "OPTGROUP",
			"A", "AREA", 
			"AUDIO", "VIDEO", "TRACK",
			"DETAILS", "SUMMARY", "DIALOG", "MENU",
			"IFRAME", "EMBED", "OBJECT",
			"LABEL", "FIELDSET", "LEGEND",
			"OUTPUT", "PROGRESS", "METER",
			"KEYGEN", "DATALIST"
		];
		
		if(interactiveTags.indexOf(tag) !== -1) {
			// Links need href to be interactive
			if(tag === "A" && !element.hasAttribute("href")) {
				return false;
			}
			return true;
		}
		
		// Media elements with controls
		if((tag === "AUDIO" || tag === "VIDEO") && element.hasAttribute("controls")) {
			return true;
		}
		
		// ContentEditable
		if(element.isContentEditable || 
		   element.getAttribute("contenteditable") === "true" ||
		   element.getAttribute("contenteditable") === "") {
			return true;
		}
		
		// Tabindex (but not -1)
		if(element.hasAttribute("tabindex")) {
			var tabindex = parseInt(element.getAttribute("tabindex"), 10);
			if(!isNaN(tabindex) && tabindex >= 0) {
				return true;
			}
		}
		
		// Draggable
		if(element.hasAttribute("draggable") && element.getAttribute("draggable") === "true") {
			return true;
		}
		
		// ARIA roles - ALL interactive and widget roles
		var role = element.getAttribute("role");
		if(role) {
			var interactiveRoles = [
				// Widget roles
				"button", "checkbox", "gridcell", "link", "menuitem", 
				"menuitemcheckbox", "menuitemradio", "option", "radio", 
				"scrollbar", "searchbox", "slider", "spinbutton", "switch",
				"tab", "tabpanel", "textbox", "treeitem",
				
				// Composite widget roles
				"combobox", "grid", "listbox", "menu", "menubar", 
				"radiogroup", "tablist", "tree", "treegrid",
				
				// Document structure roles that can be interactive
				"application", "dialog", "alertdialog", "toolbar",
				
				// Landmark roles that might be focusable
				"navigation", "search", "banner", "complementary",
				"contentinfo", "form", "main", "region",
				
				// Live region roles (when focusable)
				"alert", "log", "marquee", "status", "timer"
			];
			
			// Check if role matches any interactive role
			// Role can contain multiple space-separated values
			var roles = role.split(/\s+/);
			for(var i = 0; i < roles.length; i++) {
				if(interactiveRoles.indexOf(roles[i]) !== -1) {
					return true;
				}
			}
		}
		
		// Elements with click handlers (onclick, etc.)
		if(element.onclick || 
		   element.hasAttribute("onclick") ||
		   element.hasAttribute("onmousedown") ||
		   element.hasAttribute("onmouseup") ||
		   element.hasAttribute("onkeydown") ||
		   element.hasAttribute("onkeyup") ||
		   element.hasAttribute("onkeypress")) {
			return true;
		}
		
		// SVG interactive elements
		if(element.namespaceURI === "http://www.w3.org/2000/svg") {
			var svgInteractiveTags = ["A", "USE"];
			if(svgInteractiveTags.indexOf(tag) !== -1) {
				return true;
			}
		}
		
		// MathML interactive elements (rare, but possible)
		if(element.namespaceURI === "http://www.w3.org/1998/Math/MathML") {
			if(element.hasAttribute("href")) {
				return true;
			}
		}
		
		// Custom elements (web components) that might be interactive
		// Check if element is a custom element (contains hyphen)
		if(tag && tag.indexOf("-") !== -1) {
			// If it has tabindex >= 0, it's interactive
			if(element.hasAttribute("tabindex")) {
				var ti = parseInt(element.getAttribute("tabindex"), 10);
				if(!isNaN(ti) && ti >= 0) {
					return true;
				}
			}
		}
		
		return false;
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
			// Allow spacebar in interactive elements
			if(isInteractiveElement(e.target)) {
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
		
		// Don't refocus if in iframe or interactive elements
		if(isFocusInIframe() || isInteractiveElement(e.target)) {
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
	
	// Click-Handler: Always refocus main after clicks (except in interactive elements)
	document.addEventListener("click", function(e) {
		var main = document.querySelector(mainSelector);
		if(!main) return;
		
		// Don't refocus if there's a text selection (handled by pointerup)
		if(hasTextSelection()) return;
		
		// Don't refocus if clicking in interactive elements
		if(isInteractiveElement(e.target)) {
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
