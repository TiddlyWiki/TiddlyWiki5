/*\
title: $:/core/modules/startup/focus-handler.js
type: application/javascript
module-type: startup

Handles focus management, spacebar scrolling, and keyboard navigation for sidebar layout

\*/

"use strict";

exports.name = "focus-handler";
exports.platforms = ["browser"];
exports.after = ["render"];
exports.synchronous = true;

exports.startup = function() {
	var mainSelector = ".tc-primary-container";
	var secondarySelector = ".tc-secondary-container";
	var scrollContainerSelector = ".tc-story-river";
	
	// Flag to skip refocus after tm-focus-selector
	var skipRefocus = false;
	var skipRefocusTimeout = null;
	
	// Listen for tm-focus-selector message
	$tw.rootWidget.addEventListener("tm-focus-selector", function(event) {
		skipRefocus = true;
		if(skipRefocusTimeout) {
			clearTimeout(skipRefocusTimeout);
		}
		// Reset flag after delay to allow click/pointerup events to complete
		skipRefocusTimeout = setTimeout(function() {
			skipRefocus = false;
			skipRefocusTimeout = null;
		}, 100);
	});
	
	// Helper: Get the scroll container
	function getScrollContainer() {
		return document.querySelector(scrollContainerSelector) || 
		       document.querySelector(mainSelector);
	}
	
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
		if(!element) {
			return false;
		}
		
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
		
		// ARIA roles - interactive and widget roles
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
			// Role can contain multiple space-separated values
			var roles = role.split(/\s+/);
			for(var i = 0; i < roles.length; i++) {
				if(interactiveRoles.indexOf(roles[i]) !== -1) {
					return true;
				}
			}
		}
		
		// Elements with click handlers
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
		
		// MathML interactive elements
		if(element.namespaceURI === "http://www.w3.org/1998/Math/MathML") {
			if(element.hasAttribute("href")) {
				return true;
			}
		}
		
		// Custom elements (web components) with tabindex >= 0
		if(tag && tag.indexOf("-") !== -1) {
			if(element.hasAttribute("tabindex")) {
				var ti = parseInt(element.getAttribute("tabindex"), 10);
				if(!isNaN(ti) && ti >= 0) {
					return true;
				}
			}
		}
		
		return false;
	}
	
	// Helper: Check if element is a text input that uses arrow keys
	function isTextInput(element) {
		if(!element) {
			return false;
		}
		var tag = element.tagName ? element.tagName.toUpperCase() : "";
		if(tag === "TEXTAREA") {
			return true;
		}
		if(tag === "INPUT") {
			var type = (element.getAttribute("type") || "text").toLowerCase();
			var textTypes = ["text", "search", "url", "tel", "email", "password", "number"];
			return textTypes.indexOf(type) !== -1;
		}
		if(element.isContentEditable || 
		   element.getAttribute("contenteditable") === "true" ||
		   element.getAttribute("contenteditable") === "") {
			return true;
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
	
	// Helper: Scroll the container
	function scrollContainer(container, options) {
		if(!container) {
			return;
		}
		if(options.top !== undefined && options.left !== undefined) {
			container.scrollTo({
				top: options.top,
				left: options.left,
				behavior: options.behavior || "auto"
			});
		} else {
			container.scrollBy({
				top: options.deltaY || 0,
				left: options.deltaX || 0,
				behavior: options.behavior || "auto"
			});
		}
	}
	
	// Initialize DOM elements
	function initialize() {
		var main = document.querySelector(mainSelector);
		if(!main) {
			return;
		}
		
		// Make main focusable
		if(!main.hasAttribute("tabindex")) {
			main.setAttribute("tabindex", "-1");
		}
		
		// Make secondary containers unfocusable
		var secondaryContainers = document.querySelectorAll(secondarySelector);
		secondaryContainers.forEach(function(element) {
			element.removeAttribute("tabindex");
		});
	}
	
	// Handle spacebar scrolling in secondary containers
	document.addEventListener("keydown", function(e) {
		if(e.key !== " ") {
			return;
		}
		
		// Allow spacebar if focus is in iframe
		if(isFocusInIframe()) {
			return;
		}
		
		if(isInSecondary(e.target)) {
			// Allow spacebar in interactive elements
			if(isInteractiveElement(e.target)) {
				return;
			}
			e.preventDefault();
		}
	}, true);
	
	// Handle scroll keys (Home, End, PageUp, PageDown, ArrowUp, ArrowDown)
	document.addEventListener("keydown", function(e) {
		var scrollKeys = ["Home", "End", "PageUp", "PageDown", "ArrowUp", "ArrowDown"];
		if(scrollKeys.indexOf(e.key) === -1) {
			return;
		}
		
		// Allow if focus is in iframe
		if(isFocusInIframe()) {
			return;
		}
		
		// Allow arrow keys in text inputs (for cursor movement)
		if((e.key === "ArrowUp" || e.key === "ArrowDown") && isTextInput(e.target)) {
			return;
		}
		
		// Allow in interactive elements that use these keys (select, listbox, etc.)
		var role = e.target.getAttribute && e.target.getAttribute("role");
		var interactiveScrollRoles = ["listbox", "menu", "menubar", "tree", "treegrid", "grid", "tablist"];
		if(role && interactiveScrollRoles.indexOf(role) !== -1) {
			return;
		}
		
		// Allow native behavior if target is a select element
		if(e.target.tagName && e.target.tagName.toUpperCase() === "SELECT") {
			return;
		}
		
		var container = getScrollContainer();
		if(!container) {
			return;
		}
		
		var main = document.querySelector(mainSelector);
		var inMain = main && (e.target === main || main.contains(e.target));
		var inSecondary = isInSecondary(e.target);
		
		// Calculate scroll amounts
		var lineHeight = 40;
		var pageHeight = container.clientHeight * 0.9;
		
		// If in secondary container, redirect scroll to main container
		if(inSecondary) {
			e.preventDefault();
			
			switch(e.key) {
				case "ArrowUp":
					scrollContainer(container, { deltaY: -lineHeight, behavior: "auto" });
					break;
				case "ArrowDown":
					scrollContainer(container, { deltaY: lineHeight, behavior: "auto" });
					break;
				case "PageUp":
					scrollContainer(container, { deltaY: -pageHeight, behavior: "auto" });
					break;
				case "PageDown":
					scrollContainer(container, { deltaY: pageHeight, behavior: "auto" });
					break;
				case "Home":
					scrollContainer(container, { top: 0, left: container.scrollLeft, behavior: "auto" });
					break;
				case "End":
					scrollContainer(container, { top: container.scrollHeight, left: container.scrollLeft, behavior: "auto" });
					break;
			}
			return;
		}
		
		// If in main container (non-interactive), ensure scroll works
		if(inMain && !isInteractiveElement(e.target)) {
			e.preventDefault();
			
			switch(e.key) {
				case "ArrowUp":
					scrollContainer(container, { deltaY: -lineHeight, behavior: "auto" });
					break;
				case "ArrowDown":
					scrollContainer(container, { deltaY: lineHeight, behavior: "auto" });
					break;
				case "PageUp":
					scrollContainer(container, { deltaY: -pageHeight, behavior: "auto" });
					break;
				case "PageDown":
					scrollContainer(container, { deltaY: pageHeight, behavior: "auto" });
					break;
				case "Home":
					scrollContainer(container, { top: 0, left: container.scrollLeft, behavior: "auto" });
					break;
				case "End":
					scrollContainer(container, { top: container.scrollHeight, left: container.scrollLeft, behavior: "auto" });
					break;
			}
		}
	}, true);
	
	// Tab-Trapping: Keep tab navigation within main content
	document.addEventListener("keydown", function(e) {
		if(e.key !== "Tab") {
			return;
		}
		
		// Allow tab if focus is in iframe
		if(isFocusInIframe()) {
			return;
		}
		
		// Don't trap if there's a text selection
		if(hasTextSelection()) {
			return;
		}
		
		var main = document.querySelector(mainSelector);
		if(!main) {
			return;
		}
		
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
		if(skipRefocus) {
			return;
		}
		
		var main = document.querySelector(mainSelector);
		if(!main) {
			return;
		}
		
		if(isFocusInIframe() || isInteractiveElement(e.target)) {
			return;
		}
		
		$tw.utils.nextTick(function() {
			if(skipRefocus) {
				return;
			}
			if(hasTextSelection()) {
				focusWithSelection(main);
			}
		});
	}, true);
	
	// Click-Handler: Refocus main after clicks (except in interactive elements)
	document.addEventListener("click", function(e) {
		if(skipRefocus) {
			return;
		}
		
		var main = document.querySelector(mainSelector);
		if(!main) {
			return;
		}
		
		// Don't refocus if there's a text selection (handled by pointerup)
		if(hasTextSelection()) {
			return;
		}
		
		if(isInteractiveElement(e.target)) {
			return;
		}
		
		$tw.utils.nextTick(function() {
			if(skipRefocus) {
				return;
			}
			if(isFocusInIframe() || hasTextSelection()) {
				return;
			}
			main.focus();
		});
	}, true);
	
	initialize();
};
