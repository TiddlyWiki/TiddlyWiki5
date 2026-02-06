/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/edit-text/focus-selector-hook.js
type: application/javascript
module-type: startup

Hook to enhance tm-focus-selector to support CodeMirror inputs.
When a selector targets 'input' elements, also try CodeMirror's .cm-content

\*/
/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "codemirror-focus-selector-hook";
exports.platforms = ["browser"];
exports.after = ["startup"];
exports.synchronous = true;

exports.startup = function() {
	// Store the original handler
	var originalHandler = $tw.rootWidget.dispatchEvent;

	$tw.rootWidget.dispatchEvent = function(event) {
		// Intercept tm-focus-selector messages
		if(event.type === "tm-focus-selector" && event.param) {
			var selector = event.param;
			var element = null;

			// First try the original selector
			try {
				element = document.querySelector(selector);
			} catch (e) {
				// Invalid selector, let original handler deal with it
				return originalHandler.call(this, event);
			}

			// If found and it's a native input, use it
			if(element && element.tagName === "INPUT") {
				element.focus();
				return true;
			}

			// If not found or not an input, try CodeMirror equivalent
			// Replace 'input' with '.cm-content' in the selector
			if(selector.indexOf("input") !== -1) {
				var cmSelector = selector.replace(/\binput\b/g, ".cm-content");
				try {
					var cmElement = document.querySelector(cmSelector);
					if(cmElement) {
						// Focus the CodeMirror content element
						cmElement.focus();
						return true;
					}
				} catch (e) {
					// Invalid selector, continue to original handler
				}
			}

			// If we found the original element (not an input), focus it
			if(element) {
				element.focus();
				return true;
			}
		}

		// Fall back to original handler for all other cases
		return originalHandler.call(this, event);
	};
};
