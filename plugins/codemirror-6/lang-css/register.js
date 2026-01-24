/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/lang-css/register.js
type: application/javascript
module-type: startup

Register CSS language with CodeMirror 6 core for nested code blocks.

NAMING CONVENTION: The startup module name MUST follow the pattern "cm6-lang-*"
(e.g., "cm6-lang-css"). This allows the TiddlyWiki language module to
dynamically discover and depend on all language modules, ensuring they are
loaded before TiddlyWiki so nested code highlighting works in code blocks.

\*/
/*jslint node: true, browser: true */
"use strict";

exports.name = "cm6-lang-css";
exports.after = ["startup"];
exports.before = ["render"];
exports.synchronous = true;

// Cache for page CSS classes
var _classCache = {
	classes: null,
	timestamp: 0
};
var CACHE_TTL = 5000; // Refresh every 5 seconds

/**
 * Collect all CSS class names used in the current page
 */
function getPageClasses() {
	var now = Date.now();
	if(_classCache.classes && (now - _classCache.timestamp) < CACHE_TTL) {
		return _classCache.classes;
	}

	var classSet = {};
	try {
		// Get all elements with class attributes
		var elements = document.querySelectorAll("[class]");
		for(var i = 0; i < elements.length; i++) {
			var classList = elements[i].classList;
			for(var j = 0; j < classList.length; j++) {
				var className = classList[j];
				// Filter out empty or invalid class names
				if(className && className.length > 0 && /^[a-zA-Z_-]/.test(className)) {
					classSet[className] = true;
				}
			}
		}

		// Also scan stylesheets for class selectors
		try {
			var styleSheets = document.styleSheets;
			for(var s = 0; s < styleSheets.length; s++) {
				try {
					var rules = styleSheets[s].cssRules || styleSheets[s].rules;
					if(rules) {
						for(var r = 0; r < rules.length; r++) {
							var rule = rules[r];
							if(rule.selectorText) {
								// Extract class names from selectors
								var matches = rule.selectorText.match(/\.([a-zA-Z_-][a-zA-Z0-9_-]*)/g);
								if(matches) {
									for(var m = 0; m < matches.length; m++) {
										// Remove the leading dot
										classSet[matches[m].slice(1)] = true;
									}
								}
							}
						}
					}
				} catch (e) {
					// Cross-origin stylesheets may throw errors
				}
			}
		} catch (e) {
			// Ignore stylesheet access errors
		}
	} catch (e) {
		// Silently ignore errors
	}

	_classCache.classes = Object.keys(classSet).sort();
	_classCache.timestamp = now;
	return _classCache.classes;
}

/**
 * Create a completion source for CSS classes from the page
 */
function createPageClassCompletionSource(cssCompletionSource) {
	return function(context) {
		// First check if we're in a class selector context
		// Look for a dot followed by partial class name
		var line = context.state.doc.lineAt(context.pos);
		var textBefore = line.text.slice(0, context.pos - line.from);

		// Match class selector: dot followed by optional partial name
		// e.g., ".foo" or "." or ".tc-"
		var classMatch = textBefore.match(/\.([a-zA-Z_-][a-zA-Z0-9_-]*)?$/);

		if(classMatch) {
			var prefix = classMatch[1] || "";
			var from = context.pos - prefix.length;
			var pageClasses = getPageClasses();

			// Filter classes that match the prefix
			var matchingClasses = pageClasses.filter(function(cls) {
				return cls.toLowerCase().startsWith(prefix.toLowerCase());
			});

			if(matchingClasses.length > 0) {
				return {
					from: from,
					options: matchingClasses.map(function(cls) {
						return {
							label: cls,
							type: "class",
							detail: "page class"
						};
					}),
					validFor: /^[a-zA-Z_-][a-zA-Z0-9_-]*$/
				};
			}
		}

		// Fall back to standard CSS completions
		return cssCompletionSource(context);
	};
}

exports.startup = function() {
	var core, langCss;
	try {
		core = require("$:/plugins/tiddlywiki/codemirror-6/lib/core.js");
		langCss = require("$:/plugins/tiddlywiki/codemirror-6/plugins/lang-css/lang-css.js");
	} catch (e) {
		return;
	}

	if(!core || !core.registerLanguage || !langCss) {
		return;
	}

	var LanguageDescription = core.language.LanguageDescription;
	var LanguageSupport = core.language.LanguageSupport;

	var cssLanguage = langCss.cssLanguage;
	var cssCompletionSource = langCss.cssCompletionSource;

	// Create enhanced completion source that includes page classes
	var enhancedCssCompletionSource = createPageClassCompletionSource(cssCompletionSource);

	// Create completion extension for CSS with page class support
	var cssCompletionExt = cssLanguage.data.of({
		autocomplete: enhancedCssCompletionSource
	});
	cssCompletionExt._twExtId = "CSS-" + Date.now();

	// Create LanguageSupport without completions (they're added separately)
	var cssSupport = new LanguageSupport(cssLanguage);

	// Store for use by other modules
	core.cssSupport = cssSupport;
	core.cssCompletionExtension = cssCompletionExt;
	core.cssCompletionSource = enhancedCssCompletionSource;
	core.getPageClasses = getPageClasses; // Export for other modules
	// Export CSS properties and values from the wrapper module for style.* completion
	core.getCSSProperties = langCss.getCSSProperties;
	core.getCSSValues = langCss.getCSSValues;
	core.getCSSValuesForProperty = langCss.getCSSValuesForProperty;

	// Register for nested language completion in TiddlyWiki
	// Uses Language.isActiveAt() for detection
	core.registerNestedLanguageCompletion({
		name: "css",
		language: cssLanguage,
		source: enhancedCssCompletionSource
	});

	// Register CSS
	core.registerLanguage(LanguageDescription.of({
		name: "CSS",
		alias: ["css"],
		extensions: ["css"],
		support: cssSupport
	}));
};
