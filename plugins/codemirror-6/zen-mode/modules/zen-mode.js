/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/zen-mode/modules/zen-mode.js
type: application/javascript
module-type: library

Zen Mode manager for CodeMirror 6 - distraction-free writing

\*/

/*jslint node: true, browser: true */
/*global $tw: false */

"use strict";

var ZenMode = function() {
	this.isActive = false;
	this.overlay = null;
	this.editorContainer = null;
	this.placeholder = null;
	this.originalParent = null;
	this.originalNextSibling = null;
	this.editorWrapper = null;
	this.engine = null;
	this.wiki = null;
	this.statsInterval = null;
	this.focusModeCleanup = null;
};

ZenMode.prototype.init = function() {
	this.createOverlay();
	this.setupGlobalKeyHandler();
	this.setupWikiListener();
};

/**
 * Create the overlay DOM structure
 */
ZenMode.prototype.createOverlay = function() {
	// Main overlay
	this.overlay = document.createElement("div");
	this.overlay.className = "cm6-zen-overlay";
	this.overlay.setAttribute("data-cm6-theme", 
		$tw.wiki.getTiddlerText("$:/config/codemirror-6/theme", "vanilla"));
    
	// Close button
	var closeBtn = document.createElement("button");
	closeBtn.className = "cm6-zen-close";
	closeBtn.setAttribute("title", "Exit Zen Mode (Escape)");
	closeBtn.innerHTML = "×";
	closeBtn.addEventListener("click", this.exit.bind(this));
	this.overlay.appendChild(closeBtn);
    
	// Editor container
	this.editorContainer = document.createElement("div");
	this.editorContainer.className = "cm6-zen-editor-container";
	this.overlay.appendChild(this.editorContainer);
    
	// Stats bar
	this.statsBar = document.createElement("div");
	this.statsBar.className = "cm6-zen-stats";
	this.overlay.appendChild(this.statsBar);
    
	// Click outside to exit (if enabled)
	this.overlay.addEventListener("click", function(e) {
		if(e.target === this.overlay && 
            $tw.wiki.getTiddlerText("$:/config/codemirror-6/zen-mode/exit-on-click", "no") === "yes") {
			this.exit();
		}
	}.bind(this));
    
	document.body.appendChild(this.overlay);
};

/**
 * Enter Zen Mode - move editor DOM into overlay
 */
ZenMode.prototype.enter = function(editorWrapper, engine) {
	if(this.isActive) return;

	this.editorWrapper = editorWrapper;
	this.engine = engine;
	this.wiki = engine && engine.widget && engine.widget.wiki || $tw.wiki;

	// Store original position
	this.originalParent = editorWrapper.parentNode;
	this.originalNextSibling = editorWrapper.nextSibling;

	// Create placeholder
	this.placeholder = document.createElement("div");
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
    
	// Focus editor
	if(engine && engine.view) {
		engine.view.focus();
	}
    
	// Start stats updates
	this.startStatsUpdates();
    
	// Setup focus mode
	this.setupFocusMode();
    
	// Update state tiddler
	this.wiki.setText("$:/state/codemirror-6/zen-mode", "text", null, "yes");

	// Prevent body scroll
	document.body.style.overflow = "hidden";
};

/**
 * Exit Zen Mode - return editor to original position
 */
ZenMode.prototype.exit = function() {
	if(!this.isActive) return;
    
	// Stop stats updates
	this.stopStatsUpdates();
    
	// Cleanup focus mode
	if(this.focusModeCleanup) {
		this.focusModeCleanup();
		this.focusModeCleanup = null;
	}
    
	// Hide overlay
	this.overlay.classList.remove("active");
    
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
        
	}.bind(this), 300);
    
	this.isActive = false;

	// Update state tiddler
	var wiki = this.wiki || $tw.wiki;
	wiki.setText("$:/state/codemirror-6/zen-mode", "text", null, "no");

	// Clear wiki reference
	this.wiki = null;

	// Restore body scroll
	document.body.style.overflow = "";
};

/**
 * Apply settings to editor container
 */
ZenMode.prototype.applySettings = function() {
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
    
	// Focus mode
	var focusMode = wiki.getTiddlerText("$:/config/codemirror-6/zen-mode/focus-mode", "none");
	this.editorContainer.classList.remove("focus-line", "focus-sentence", "focus-paragraph");
	if(focusMode !== "none") {
		this.editorContainer.classList.add("focus-" + focusMode);
	}
    
	// Stats visibility
	var showStats = wiki.getTiddlerText("$:/config/codemirror-6/zen-mode/show-stats", "yes");
	this.statsBar.style.display = showStats === "yes" ? "flex" : "none";
};

/**
 * Update overlay theme attribute
 */
ZenMode.prototype.updateTheme = function() {
	// Get current theme from engine's DOM or config
	var theme = "vanilla";
	if(this.editorWrapper) {
		var wiki = this.wiki || $tw.wiki;
		theme = this.editorWrapper.getAttribute("data-cm6-theme") ||
                wiki.getTiddlerText("$:/config/codemirror-6/theme", "vanilla");
	}
	this.overlay.setAttribute("data-cm6-theme", theme);
};

/**
 * Setup global Escape key handler
 */
ZenMode.prototype.setupGlobalKeyHandler = function() {
	document.addEventListener("keydown", function(e) {
		if(e.key === "Escape" && this.isActive) {
			e.preventDefault();
			e.stopPropagation();
			this.exit();
		}
	}.bind(this), true);
};

/**
 * Listen for wiki changes (settings, theme)
 */
ZenMode.prototype.setupWikiListener = function() {
	var self = this;
	var settingsTiddlers = [
		"$:/config/codemirror-6/zen-mode/max-width",
		"$:/config/codemirror-6/zen-mode/font-size",
		"$:/config/codemirror-6/zen-mode/line-height",
		"$:/config/codemirror-6/zen-mode/typewriter",
		"$:/config/codemirror-6/zen-mode/focus-mode",
		"$:/config/codemirror-6/zen-mode/show-stats",
		"$:/config/codemirror-6/theme",
		"$:/config/codemirror-6/theme-light",
		"$:/config/codemirror-6/theme-dark",
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
};

/**
 * Start periodic stats updates
 */
ZenMode.prototype.startStatsUpdates = function() {
	this.updateStats();
	this.statsInterval = setInterval(this.updateStats.bind(this), 1000);
};

/**
 * Stop stats updates
 */
ZenMode.prototype.stopStatsUpdates = function() {
	if(this.statsInterval) {
		clearInterval(this.statsInterval);
		this.statsInterval = null;
	}
};

/**
 * Update word count, character count, reading time
 */
ZenMode.prototype.updateStats = function() {
	if(!this.engine || !this.engine.view) return;
    
	var text = this.engine.view.state.doc.toString();
	var words = text.trim() ? text.trim().split(/\s+/).length : 0;
	var chars = text.length;
	var readingTime = Math.max(1, Math.round(words / 200));
    
	this.statsBar.innerHTML = 
		"<span>" + words.toLocaleString() + " words</span>" +
        "<span>" + chars.toLocaleString() + " chars</span>" +
        "<span>" + readingTime + " min read</span>";
};

/**
 * Setup focus mode (line, sentence, or paragraph highlighting)
 */
ZenMode.prototype.setupFocusMode = function() {
	// Cleanup previous
	if(this.focusModeCleanup) {
		this.focusModeCleanup();
		this.focusModeCleanup = null;
	}
    
	var wiki = this.wiki || $tw.wiki;
	var focusMode = wiki.getTiddlerText("$:/config/codemirror-6/zen-mode/focus-mode", "none");

	if(focusMode === "none" || !this.engine || !this.engine.view) return;
    
	var self = this;
	var view = this.engine.view;
    
	if(focusMode === "sentence" || focusMode === "paragraph") {
		// Create update listener for sentence/paragraph focus
		var updateFocus = function() {
			self.updateFocusHighlight(focusMode);
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
};

/**
 * Update sentence or paragraph highlighting
 */
ZenMode.prototype.updateFocusHighlight = function(mode) {
	if(!this.engine || !this.engine.view) return;
    
	var view = this.engine.view;
	var state = view.state;
	var cursorPos = state.selection.main.head;
	var doc = state.doc;
    
	// Clear previous highlights
	this.clearFocusHighlight();
    
	if(mode === "paragraph") {
		// Find paragraph boundaries (empty lines)
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
        
		// Highlight paragraph lines
		for(var i = startLine; i <= endLine; i++) {
			var line = doc.line(i);
			var lineDOM = view.domAtPos(line.from).node;
			if(lineDOM) {
				var lineEl = lineDOM.closest ? lineDOM.closest(".cm-line") : 
					lineDOM.parentElement && lineDOM.parentElement.closest(".cm-line");
				if(lineEl) {
					lineEl.classList.add("cm6-active-paragraph");
				}
			}
		}
	} else if(mode === "sentence") {
		// Find sentence boundaries
		var text = doc.toString();
		var sentenceEnd = /[.!?]+[\s\n]+|[.!?]+$/g;
		var sentences = [];
		var lastEnd = 0;
		var match;
        
		while((match = sentenceEnd.exec(text)) !== null) {
			sentences.push({ start: lastEnd, end: match.index + match[0].length });
			lastEnd = match.index + match[0].length;
		}
        
		// Add remaining text as last sentence
		if(lastEnd < text.length) {
			sentences.push({ start: lastEnd, end: text.length });
		}
        
		// Find which sentence contains cursor
		var currentSentence = null;
		for(var i = 0; i < sentences.length; i++) {
			if(cursorPos >= sentences[i].start && cursorPos <= sentences[i].end) {
				currentSentence = sentences[i];
				break;
			}
		}
        
		if(currentSentence) {
			// Find all lines that contain part of this sentence
			var startLineNum = doc.lineAt(currentSentence.start).number;
			var endLineNum = doc.lineAt(Math.max(0, currentSentence.end - 1)).number;
            
			for(var i = startLineNum; i <= endLineNum; i++) {
				var line = doc.line(i);
				var lineDOM = view.domAtPos(line.from).node;
				if(lineDOM) {
					var lineEl = lineDOM.closest ? lineDOM.closest(".cm-line") : 
						lineDOM.parentElement && lineDOM.parentElement.closest(".cm-line");
					if(lineEl) {
						lineEl.classList.add("cm6-active-sentence");
					}
				}
			}
		}
	}
};

/**
 * Clear focus highlight classes
 */
ZenMode.prototype.clearFocusHighlight = function() {
	var highlighted = this.editorContainer.querySelectorAll(".cm6-active-paragraph, .cm6-active-sentence");
	for(var i = 0; i < highlighted.length; i++) {
		highlighted[i].classList.remove("cm6-active-paragraph", "cm6-active-sentence");
	}
};

/**
 * Toggle Zen Mode
 */
ZenMode.prototype.toggle = function(editorWrapper, engine) {
	if(this.isActive) {
		this.exit();
	} else {
		this.enter(editorWrapper, engine);
	}
};

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
