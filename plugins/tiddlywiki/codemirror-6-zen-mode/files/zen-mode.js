/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/zen-mode/modules/zen-mode.js
type: application/javascript
module-type: library

Zen Mode manager for CodeMirror 6 - distraction-free writing

\*/

/*jslint node: true, browser: true */
/*global $tw: false */

"use strict";

class ZenMode {
	constructor() {
		this.isActive = false;
		this.overlay = null;
		this.editorContainer = null;
		this.placeholder = null;
		this.originalParent = null;
		this.originalNextSibling = null;
		this.editorWrapper = null;
		this.engine = null;
		this.wiki = null;
		this.document = null;
		this.statsInterval = null;
		this.focusModeCleanup = null;
		this.typewriterCleanup = null;
	}

	init() {
		this.setupWikiListener();
	}

	/**
	 * Create the overlay DOM structure (called lazily on first use)
	 */
	createOverlay(doc) {
		if(this.overlay) return; // Already created

		this.document = doc;

		// Main overlay
		this.overlay = doc.createElement("div");
		this.overlay.className = "cm6-zen-overlay";
		this.overlay.setAttribute("data-cm6-theme",
			$tw.wiki.getTiddlerText("$:/config/codemirror-6/editor/theme", "vanilla"));

		// Close button
		var closeBtn = doc.createElement("button");
		closeBtn.className = "cm6-zen-close";
		closeBtn.setAttribute("title", "Exit Zen Mode (Escape)");
		closeBtn.innerHTML = "×";
		closeBtn.addEventListener("click", this.exit.bind(this));
		this.overlay.appendChild(closeBtn);

		// Editor container
		this.editorContainer = doc.createElement("div");
		this.editorContainer.className = "cm6-zen-editor-container";
		this.overlay.appendChild(this.editorContainer);

		// Stats bar
		this.statsBar = doc.createElement("div");
		this.statsBar.className = "cm6-zen-stats";
		this.overlay.appendChild(this.statsBar);

		// Click outside to exit (if enabled)
		this.overlay.addEventListener("click", function(e) {
			if(e.target === this.overlay &&
				$tw.wiki.getTiddlerText("$:/config/codemirror-6/zen-mode/exit-on-click", "no") === "yes") {
				this.exit();
			}
		}.bind(this));

		// Escape key handler
		this.overlay.addEventListener("keydown", function(e) {
			if(e.key === "Escape" && this.isActive) {
				e.preventDefault();
				e.stopPropagation();
				this.exit();
			}
		}.bind(this), true);

		// Append as last child of body
		doc.body.appendChild(this.overlay);
	}

	/**
	 * Enter Zen Mode - move editor DOM into overlay
	 */
	enter(editorWrapper, engine) {
		if(this.isActive) return;

		this.editorWrapper = editorWrapper;
		this.engine = engine;
		this.wiki = engine && engine.widget && engine.widget.wiki || $tw.wiki;

		// Get document from widget
		var doc = engine && engine.widget && engine.widget.document || document;

		// Create overlay lazily on first use
		this.createOverlay(doc);

		// Save current selection before moving the editor
		var view = engine && engine.view;
		var savedSelection = view ? view.state.selection : null;

		// Store original position
		this.originalParent = editorWrapper.parentNode;
		this.originalNextSibling = editorWrapper.nextSibling;

		// Create placeholder
		this.placeholder = doc.createElement("div");
		this.placeholder.className = "cm6-zen-placeholder";
		this.placeholder.style.display = "none";
		this.originalParent.insertBefore(this.placeholder, this.originalNextSibling);

		// Move editor into overlay
		this.editorContainer.appendChild(editorWrapper);

		// Apply settings
		this.applySettings();

		// Update theme on overlay
		this.updateTheme();

		// Show overlay
		this.overlay.classList.add("active");
		this.isActive = true;

		// Restore selection and focus after DOM settles
		if(view) {
			requestAnimationFrame(function() {
				// Double RAF ensures layout is complete
				requestAnimationFrame(function() {
					// Restore selection
					if(savedSelection) {
						view.dispatch({
							selection: savedSelection
						});
					}
					view.focus();
				});
			});
		}

		// Start stats updates
		this.startStatsUpdates();

		// Setup focus mode
		this.setupFocusMode();

		// Update state tiddler
		this.wiki.setText("$:/state/codemirror-6/zen-mode", "text", null, "yes");

		// Prevent body scroll
		this.document.body.style.overflow = "hidden";
	}

	/**
	 * Exit Zen Mode - return editor to original position
	 */
	exit() {
		if(!this.isActive) return;

		// Stop stats updates
		this.stopStatsUpdates();

		// Cleanup focus mode
		if(this.focusModeCleanup) {
			this.focusModeCleanup();
			this.focusModeCleanup = null;
		}

		// Cleanup typewriter mode
		if(this.typewriterCleanup) {
			this.typewriterCleanup();
			this.typewriterCleanup = null;
		}

		// Hide overlay
		this.overlay.classList.remove("active");

		// Save engine reference and selection before clearing (needed after transition)
		var engineToFocus = this.engine;
		var view = engineToFocus && engineToFocus.view;
		var savedSelection = view ? view.state.selection : null;

		// Move editor back after transition
		setTimeout(function() {
			if(this.editorWrapper && this.originalParent) {
				// Remove from overlay
				if(this.editorWrapper.parentNode === this.editorContainer) {
					this.editorContainer.removeChild(this.editorWrapper);
				}

				// Insert back to original position
				if(this.placeholder && this.placeholder.parentNode) {
					this.originalParent.insertBefore(this.editorWrapper, this.placeholder);
					this.placeholder.parentNode.removeChild(this.placeholder);
				} else {
					this.originalParent.appendChild(this.editorWrapper);
				}
			}

			// Clear classes from container
			this.editorContainer.className = "cm6-zen-editor-container";

			// Clear references
			this.editorWrapper = null;
			this.engine = null;
			this.originalParent = null;
			this.originalNextSibling = null;
			this.placeholder = null;

			// Restore selection and focus after editor is back in place
			if(view) {
				requestAnimationFrame(function() {
					requestAnimationFrame(function() {
						// Restore selection
						if(savedSelection) {
							view.dispatch({
								selection: savedSelection
							});
						}
						view.focus();
					});
				});
			}

		}.bind(this), 300);

		this.isActive = false;

		// Update state tiddler
		var wiki = this.wiki || $tw.wiki;
		wiki.setText("$:/state/codemirror-6/zen-mode", "text", null, "no");

		// Clear wiki reference
		this.wiki = null;

		// Restore body scroll
		if(this.document && this.document.body) {
			this.document.body.style.overflow = "";
		}
	}

	/**
	 * Apply settings to editor container
	 */
	applySettings() {
		var wiki = this.wiki || $tw.wiki;

		// CSS custom properties
		var maxWidth = wiki.getTiddlerText("$:/config/codemirror-6/zen-mode/max-width", "700px");
		var fontSize = wiki.getTiddlerText("$:/config/codemirror-6/zen-mode/font-size", "1.1em");
		var lineHeight = wiki.getTiddlerText("$:/config/codemirror-6/zen-mode/line-height", "1.8");

		this.overlay.style.setProperty("--zen-max-width", maxWidth);
		this.overlay.style.setProperty("--zen-font-size", fontSize);
		this.overlay.style.setProperty("--zen-line-height", lineHeight);

		// Typewriter mode
		var typewriter = wiki.getTiddlerText("$:/config/codemirror-6/zen-mode/typewriter", "no");
		this.editorContainer.classList.toggle("typewriter", typewriter === "yes");
		this.setupTypewriterMode(typewriter === "yes");

		// Focus mode
		var focusMode = wiki.getTiddlerText("$:/config/codemirror-6/zen-mode/focus-mode", "none");
		this.editorContainer.classList.remove("focus-line", "focus-sentence", "focus-paragraph");
		if(focusMode !== "none") {
			this.editorContainer.classList.add("focus-" + focusMode);
		}

		// Stats visibility
		var showStats = wiki.getTiddlerText("$:/config/codemirror-6/zen-mode/show-stats", "yes");
		this.statsBar.style.display = showStats === "yes" ? "flex" : "none";
	}

	/**
	 * Setup typewriter mode - keeps cursor vertically centered
	 */
	setupTypewriterMode(enabled) {
		// Cleanup previous
		if(this.typewriterCleanup) {
			this.typewriterCleanup();
			this.typewriterCleanup = null;
		}

		if(!enabled || !this.engine || !this.engine.view) return;

		var self = this;
		var view = this.engine.view;
		var lastCursorPos = -1;
		var lastScrollTime = 0;
		var pendingScroll = null;
		var THROTTLE_MS = 16; // ~60fps for smooth scrolling when holding keys

		// Function to scroll cursor to center
		var scrollCursorToCenter = function() {
			if(!self.isActive || !view || !view.dom) return;

			var cursorPos = view.state.selection.main.head;

			// Skip if cursor hasn't moved
			if(cursorPos === lastCursorPos) return;
			lastCursorPos = cursorPos;

			var coords = view.coordsAtPos(cursorPos);
			if(!coords) return;

			var scroller = view.scrollDOM;
			var scrollerRect = scroller.getBoundingClientRect();

			// Use the vertical center of the cursor line
			var cursorY = (coords.top + coords.bottom) / 2;

			// Calculate where cursor should be (center of visible scroller area)
			var targetY = scrollerRect.top + (scrollerRect.height / 2);

			// Calculate how much to scroll
			var scrollAdjust = cursorY - targetY;

			// Only scroll if significantly off-center (reduces jitter)
			if(Math.abs(scrollAdjust) > 5) {
				scroller.scrollTop += scrollAdjust;
			}
		};

		// Throttled scroll handler - executes immediately, then limits frequency
		var throttledScroll = function() {
			var now = Date.now();
			var timeSinceLastScroll = now - lastScrollTime;

			if(timeSinceLastScroll >= THROTTLE_MS) {
				// Enough time passed - scroll immediately
				lastScrollTime = now;
				requestAnimationFrame(scrollCursorToCenter);
			} else {
				// Too soon - schedule for later (but only one pending)
				if(!pendingScroll) {
					pendingScroll = setTimeout(function() {
						pendingScroll = null;
						lastScrollTime = Date.now();
						requestAnimationFrame(scrollCursorToCenter);
					}, THROTTLE_MS - timeSinceLastScroll);
				}
			}
		};

		// Listen to selection changes via the engine's event system
		if(this.engine.on) {
			this.engine.on("selectionChanged", throttledScroll);
			this.engine.on("docChanged", throttledScroll);
		}

		// Initial scroll to center
		setTimeout(function() {
			if(self.isActive && view && view.dom) {
				lastCursorPos = -1; // Force scroll
				scrollCursorToCenter();
			}
		}, 50);

		// Cleanup function
		this.typewriterCleanup = function() {
			if(pendingScroll) {
				clearTimeout(pendingScroll);
				pendingScroll = null;
			}
			if(self.engine && self.engine.off) {
				self.engine.off("selectionChanged", throttledScroll);
				self.engine.off("docChanged", throttledScroll);
			}
		};
	}

	/**
	 * Update overlay theme attribute
	 */
	updateTheme() {
		// Get current theme from engine's domNode (where _applyTheme sets it)
		// This properly respects auto-match-palette settings
		var theme = "vanilla";

		// First try: engine.domNode has the resolved theme (includes auto-match-palette logic)
		if(this.engine && this.engine.domNode) {
			theme = this.engine.domNode.getAttribute("data-cm6-theme") || theme;
		}
		// Second try: editorWrapper might have it in some cases
		else if(this.editorWrapper) {
			theme = this.editorWrapper.getAttribute("data-cm6-theme") || theme;
		}

		// Final fallback: replicate auto-match-palette logic ourselves
		if(theme === "vanilla") {
			var wiki = this.wiki || $tw.wiki;
			var autoMatch = wiki.getTiddlerText(
				"$:/config/codemirror-6/editor/auto-match-palette",
				"yes"
			) === "yes";

			if(autoMatch) {
				var paletteName = wiki.getTiddlerText("$:/palette");
				var palette = wiki.getTiddler(paletteName);
				var isDark = palette && palette.fields["color-scheme"] === "dark";
				var themeKey = isDark ? "theme-dark" : "theme-light";
				theme = wiki.getTiddlerText("$:/config/codemirror-6/editor/" + themeKey, "vanilla");
			} else {
				theme = wiki.getTiddlerText("$:/config/codemirror-6/editor/theme", "vanilla");
			}
		}

		this.overlay.setAttribute("data-cm6-theme", theme);
	}

	/**
	 * Listen for wiki changes (settings, theme)
	 */
	setupWikiListener() {
		var self = this;
		var settingsTiddlers = [
			"$:/config/codemirror-6/zen-mode/max-width",
			"$:/config/codemirror-6/zen-mode/font-size",
			"$:/config/codemirror-6/zen-mode/line-height",
			"$:/config/codemirror-6/zen-mode/typewriter",
			"$:/config/codemirror-6/zen-mode/focus-mode",
			"$:/config/codemirror-6/zen-mode/show-stats",
			"$:/config/codemirror-6/editor/theme",
			"$:/config/codemirror-6/editor/theme-light",
			"$:/config/codemirror-6/editor/theme-dark",
			"$:/palette"
		];

		$tw.wiki.addEventListener("change", function(changes) {
			if(!self.isActive) return;

			for(var i = 0; i < settingsTiddlers.length; i++) {
				if(changes[settingsTiddlers[i]]) {
					self.applySettings();
					self.updateTheme();
					self.setupFocusMode();
					break;
				}
			}
		});
	}

	/**
	 * Start periodic stats updates
	 */
	startStatsUpdates() {
		this.updateStats();
		this.statsInterval = setInterval(this.updateStats.bind(this), 1000);
	}

	/**
	 * Stop stats updates
	 */
	stopStatsUpdates() {
		if(this.statsInterval) {
			clearInterval(this.statsInterval);
			this.statsInterval = null;
		}
	}

	/**
	 * Update word count, character count, reading time
	 */
	updateStats() {
		if(!this.engine || !this.engine.view) return;

		var text = this.engine.view.state.doc.toString();
		var words = text.trim() ? text.trim().split(/\s+/).length : 0;
		var chars = text.length;
		var readingTime = Math.max(1, Math.round(words / 200));

		this.statsBar.innerHTML =
			"<span>" + words.toLocaleString() + " words</span>" +
			"<span>" + chars.toLocaleString() + " chars</span>" +
			"<span>" + readingTime + " min read</span>";
	}

	/**
	 * Setup focus mode (line, sentence, or paragraph highlighting)
	 */
	setupFocusMode() {
		// Cleanup previous
		if(this.focusModeCleanup) {
			this.focusModeCleanup();
			this.focusModeCleanup = null;
		}

		var wiki = this.wiki || $tw.wiki;
		var focusMode = wiki.getTiddlerText("$:/config/codemirror-6/zen-mode/focus-mode", "none");

		if(focusMode === "none" || !this.engine || !this.engine.view) return;

		var self = this;
		var _view = this.engine.view;

		if(focusMode === "sentence" || focusMode === "paragraph") {
			// Track last highlighted range to avoid unnecessary updates
			var lastStart = -1;
			var lastEnd = -1;

			// Create update listener for sentence/paragraph focus
			var updateFocus = function() {
				var range = self.getFocusRange(focusMode);
				if(range && (range.start !== lastStart || range.end !== lastEnd)) {
					lastStart = range.start;
					lastEnd = range.end;
					self.updateFocusHighlight(focusMode, range);
				}
			};

			// Initial update
			updateFocus();

			// Listen to selection changes via polling (simpler than CM6 extension)
			var pollInterval = setInterval(updateFocus, 100);

			this.focusModeCleanup = function() {
				clearInterval(pollInterval);
				self.clearFocusHighlight();
			};
		}
	}

	/**
	 * Get the focus range (start/end line numbers) for the current cursor position
	 */
	getFocusRange(mode) {
		if(!this.engine || !this.engine.view) return null;

		var view = this.engine.view;
		var state = view.state;
		var cursorPos = state.selection.main.head;
		var doc = state.doc;

		if(mode === "paragraph") {
			var cursorLine = doc.lineAt(cursorPos);
			var startLine = cursorLine.number;
			var endLine = cursorLine.number;

			// Find start of paragraph
			while(startLine > 1) {
				var prevLine = doc.line(startLine - 1);
				if(prevLine.text.trim() === "") break;
				startLine--;
			}

			// Find end of paragraph
			while(endLine < doc.lines) {
				var nextLine = doc.line(endLine + 1);
				if(nextLine.text.trim() === "") break;
				endLine++;
			}

			return {
				start: startLine,
				end: endLine
			};

		} else if(mode === "sentence") {
			var text = doc.toString();
			var sentenceEnd = /[.!?]+[\s\n]+|[.!?]+$/g;
			var sentences = [];
			var lastEnd = 0;
			var match;

			while((match = sentenceEnd.exec(text)) !== null) {
				sentences.push({
					start: lastEnd,
					end: match.index + match[0].length
				});
				lastEnd = match.index + match[0].length;
			}

			if(lastEnd < text.length) {
				sentences.push({
					start: lastEnd,
					end: text.length
				});
			}

			for(var i = 0; i < sentences.length; i++) {
				if(cursorPos >= sentences[i].start && cursorPos <= sentences[i].end) {
					var startLineNum = doc.lineAt(sentences[i].start).number;
					var endLineNum = doc.lineAt(Math.max(0, sentences[i].end - 1)).number;
					return {
						start: startLineNum,
						end: endLineNum
					};
				}
			}
		}

		return null;
	}

	/**
	 * Update sentence or paragraph highlighting
	 */
	updateFocusHighlight(mode, range) {
		if(!this.engine || !this.engine.view || !range) return;

		var view = this.engine.view;
		var doc = view.state.doc;
		var className = mode === "paragraph" ? "cm6-active-paragraph" : "cm6-active-sentence";

		// Clear previous highlights
		this.clearFocusHighlight();

		// Highlight lines in range
		for(var i = range.start; i <= range.end; i++) {
			var line = doc.line(i);
			var lineDOM = view.domAtPos(line.from).node;
			if(lineDOM) {
				var lineEl = lineDOM.closest ? lineDOM.closest(".cm-line") :
					lineDOM.parentElement && lineDOM.parentElement.closest(".cm-line");
				if(lineEl) {
					lineEl.classList.add(className);
				}
			}
		}
	}

	/**
	 * Clear focus highlight classes
	 */
	clearFocusHighlight() {
		var highlighted = this.editorContainer.querySelectorAll(".cm6-active-paragraph, .cm6-active-sentence");
		for(var i = 0; i < highlighted.length; i++) {
			highlighted[i].classList.remove("cm6-active-paragraph", "cm6-active-sentence");
		}
	}

	/**
	 * Toggle Zen Mode
	 */
	toggle(editorWrapper, engine) {
		if(this.isActive) {
			this.exit();
		} else {
			this.enter(editorWrapper, engine);
		}
	}
}

// Singleton instance
var zenModeInstance = null;

exports.getZenMode = function() {
	if(!zenModeInstance) {
		zenModeInstance = new ZenMode();
		zenModeInstance.init();
	}
	return zenModeInstance;
};

exports.ZenMode = ZenMode;
