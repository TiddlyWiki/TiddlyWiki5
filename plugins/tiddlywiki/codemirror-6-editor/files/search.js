/*\
title: $:/plugins/tiddlywiki/codemirror-6/search.js
type: application/javascript
module-type: codemirror6-plugin

Search and replace plugin for CodeMirror 6 (built-in)

\*/
"use strict";

if(!$tw.browser) return;

// Load the search library
var searchLib = require("$:/plugins/tiddlywiki/codemirror-6/lib/codemirror-search.js");

// ============================================================================
// Custom Goto Line Panel (with proper Escape handling)
// ============================================================================

/**
 * Create and manage a custom goto-line panel
 */
function createGotoLinePanel(view, editorWrapper) {
	// Check if panel already exists
	var existing = editorWrapper.querySelector(".cm-panel.cm-gotoLine");
	if(existing) {
		existing.querySelector("input").focus();
		existing.querySelector("input").select();
		return;
	}

	// Create panel
	var panel = document.createElement("div");
	panel.className = "cm-panel cm-gotoLine";

	var label = document.createElement("label");
	label.textContent = "Go to line: ";

	var input = document.createElement("input");
	input.type = "text";
	input.setAttribute("aria-label", "Line number");
	input.placeholder = "1:1";

	var goBtn = document.createElement("button");
	goBtn.className = "cm-button";
	goBtn.textContent = "Go";

	var closeBtn = document.createElement("button");
	closeBtn.name = "close";
	closeBtn.setAttribute("aria-label", "Close");
	closeBtn.textContent = "×";

	label.appendChild(input);
	panel.appendChild(label);
	panel.appendChild(goBtn);
	panel.appendChild(closeBtn);

	// Find or create bottom panels container
	var panelsBottom = editorWrapper.querySelector(".cm-panels-bottom");
	if(!panelsBottom) {
		panelsBottom = document.createElement("div");
		panelsBottom.className = "cm-panels cm-panels-bottom";
		var editor = editorWrapper.querySelector(".cm-editor");
		if(editor) {
			editor.appendChild(panelsBottom);
		} else {
			editorWrapper.appendChild(panelsBottom);
		}
	}
	panelsBottom.appendChild(panel);

	// Function to close the panel
	function closePanel() {
		if(panel.parentNode) {
			panel.parentNode.removeChild(panel);
		}
		view.focus();
	}

	// Function to go to line
	function gotoLine() {
		var value = input.value.trim();
		if(!value) {
			closePanel();
			return;
		}

		var match = /^(\d+)(?::(\d+))?$/.exec(value);
		if(!match) {
			closePanel();
			return;
		}

		var line = parseInt(match[1], 10);
		var column = match[2] ? parseInt(match[2], 10) : 1;

		var doc = view.state.doc;
		if(line < 1) line = 1;
		if(line > doc.lines) line = doc.lines;

		var lineInfo = doc.line(line);
		var pos = lineInfo.from + Math.min(column - 1, lineInfo.length);

		view.dispatch({
			selection: {
				anchor: pos
			},
			scrollIntoView: true
		});

		closePanel();
	}

	// Event handlers
	input.addEventListener("keydown", function(e) {
		if(e.key === "Escape") {
			e.preventDefault();
			e.stopPropagation();
			e.stopImmediatePropagation();
			closePanel();
		} else if(e.key === "Enter") {
			e.preventDefault();
			gotoLine();
		}
	}, true);

	goBtn.addEventListener("click", function(e) {
		e.preventDefault();
		gotoLine();
	});

	closeBtn.addEventListener("click", function(e) {
		e.preventDefault();
		e.stopPropagation();
		closePanel();
	});

	// Focus the input
	setTimeout(function() {
		input.focus();
	}, 0);

	return {
		close: closePanel,
		panel: panel
	};
}

exports.plugin = {
	name: "search",
	description: "Search and replace functionality",
	priority: 700,

	init: function(cm6Core) {
		this._core = cm6Core;
	},

	getExtensions: function(_context) {
		var core = this._core;
		var extensions = [];
		var keymap = core.view.keymap;
		var _Prec = core.state.Prec;

		// Add search extension
		if(searchLib.search) {
			extensions.push(searchLib.search({
				top: true
			}));
		}

		// Add highlight selection matches
		if(searchLib.highlightSelectionMatches) {
			extensions.push(searchLib.highlightSelectionMatches());
		}

		// Add search keymap (without Escape and gotoLine - we handle them separately)
		if(keymap && searchLib.searchKeymap) {
			var filteredKeymap = searchLib.searchKeymap.filter(function(binding) {
				// Filter out Escape (we handle it in capture phase) and gotoLine bindings (we use our custom panel)
				var key = binding.key;
				if(key === "Escape") return false;
				if(key === "Mod-g" || key === "Ctrl-Alt-g" || key === "Alt-g") return false;
				return true;
			});
			extensions.push(keymap.of(filteredKeymap));
		}

		// Add our custom gotoLine keymap binding with high precedence (Mod-g and Ctrl-Alt-g)
		var Prec = core.state.Prec;
		if(keymap && Prec) {
			var gotoLineCommand = function(view) {
				// Find the editor wrapper (domNode) from the view
				var editorWrapper = view.dom.closest(".tc-editor-codemirror6");
				if(editorWrapper) {
					createGotoLinePanel(view, editorWrapper);
					return true;
				}
				return false;
			};
			extensions.push(Prec.highest(keymap.of([{
					key: "Mod-g",
					run: gotoLineCommand
				},
				{
					key: "Ctrl-Alt-g",
					run: gotoLineCommand
				}
			])));
		}

		// Store reference for Escape handler
		var searchLibRef = searchLib;

		// Use ViewPlugin to add capturing event listener for Escape and manage panel positioning
		var ViewPlugin = core.view.ViewPlugin;
		if(ViewPlugin) {
			extensions.push(ViewPlugin.define(function(view) {
				var handler = function(event) {
					if(event.key === "Escape") {
						// Check if search panel is open
						var searchClosed = searchLibRef.closeSearchPanel(view);
						if(searchClosed) {
							event.preventDefault();
							event.stopPropagation();
							event.stopImmediatePropagation();
							return;
						}
					}
					// When search is opened (Ctrl+F / Cmd+F), update panel position after it's created
					if(event.key === "f" && (event.ctrlKey || event.metaKey)) {
						setTimeout(updatePanelTopOffset, 0);
					}
				};

				// Add listener in capture phase to intercept before TiddlyWiki
				view.dom.addEventListener("keydown", handler, true);

				// --- Calculate and set the top offset for sticky panel positioning ---
				// The search panel should stick below the tiddler title when sticky titles are enabled

				var editorWrapper = view.dom.closest(".tc-editor-codemirror6");
				var STICKY_TITLES_CONFIG = "$:/themes/tiddlywiki/vanilla/options/stickytitles";

				function isStickyTitlesEnabled() {
					return $tw.wiki.getTiddlerText(STICKY_TITLES_CONFIG, "no") === "yes";
				}

				function updatePanelTopOffset() {
					if(!editorWrapper) return;

					// Get title bar height only when sticky titles are enabled
					// Note: Menubar height is handled via CSS calc() with --tv-menubar-height
					// We only need the title bar's actual height, not its top offset (which includes menubar)
					var titleHeight = 0;
					if(isStickyTitlesEnabled()) {
						var tiddlerFrame = editorWrapper.closest(".tc-tiddler-frame");
						if(tiddlerFrame) {
							var titleBar = tiddlerFrame.querySelector(".tc-tiddler-title");
							if(titleBar) {
								titleHeight = titleBar.offsetHeight;
							}
						}
					}

					// Set --cm-panels-top-offset for sticky title height (CSS handles menubar via --tv-menubar-height)
					var panelsTop = view.dom.querySelector(".cm-panels-top");

					// Always remove inline top style (CodeMirror sets top:0px) so our CSS calc() works
					if(panelsTop) {
						panelsTop.style.removeProperty("top");
					}

					if(titleHeight === 0) {
						// No sticky title offset needed - remove CSS variable, let CSS defaults handle it
						editorWrapper.style.removeProperty("--cm-panels-top-offset");
						view.dom.style.removeProperty("--cm-panels-top-offset");
						if(panelsTop) {
							panelsTop.style.removeProperty("--cm-panels-top-offset");
						}
						return;
					}

					var topOffset = titleHeight;

					// Set CSS variable for title offset (menubar offset handled in CSS)
					editorWrapper.style.setProperty("--cm-panels-top-offset", topOffset + "px");
					view.dom.style.setProperty("--cm-panels-top-offset", topOffset + "px");

					if(panelsTop) {
						panelsTop.style.setProperty("--cm-panels-top-offset", topOffset + "px");
					}
				}

				// Set initial value after a short delay to ensure DOM is ready
				setTimeout(updatePanelTopOffset, 0);

				// Update on window resize (title height might change)
				var resizeHandler = function() {
					updatePanelTopOffset();
				};
				window.addEventListener("resize", resizeHandler);

				// Also update on scroll
				var scrollHandler = function() {
					updatePanelTopOffset();
				};
				window.addEventListener("scroll", scrollHandler, {
					passive: true
				});

				// Listen for changes to sticky titles config
				var wikiChangeHandler = function(changes) {
					if(changes[STICKY_TITLES_CONFIG]) {
						updatePanelTopOffset();
					}
				};
				$tw.wiki.addEventListener("change", wikiChangeHandler);

				return {
					destroy: function() {
						view.dom.removeEventListener("keydown", handler, true);
						window.removeEventListener("resize", resizeHandler);
						window.removeEventListener("scroll", scrollHandler);
						$tw.wiki.removeEventListener("change", wikiChangeHandler);
					}
				};
			}));
		}

		return extensions;
	},

	extendAPI: function(_engine, _context) {
		return {
			openSearch: function() {
				if(this._destroyed || !searchLib.openSearchPanel) return;
				searchLib.openSearchPanel(this.view);
			},

			closeSearch: function() {
				if(this._destroyed || !searchLib.closeSearchPanel) return;
				searchLib.closeSearchPanel(this.view);
			},

			findNext: function() {
				if(this._destroyed || !searchLib.findNext) return;
				searchLib.findNext(this.view);
			},

			findPrevious: function() {
				if(this._destroyed || !searchLib.findPrevious) return;
				searchLib.findPrevious(this.view);
			},

			replaceNext: function() {
				if(this._destroyed || !searchLib.replaceNext) return;
				searchLib.replaceNext(this.view);
			},

			replaceAll: function() {
				if(this._destroyed || !searchLib.replaceAll) return;
				searchLib.replaceAll(this.view);
			},

			selectNextOccurrence: function() {
				if(this._destroyed || !searchLib.selectNextOccurrence) return;
				searchLib.selectNextOccurrence(this.view);
			},

			selectAllOccurrences: function() {
				if(this._destroyed || !searchLib.selectMatches) return;
				searchLib.selectMatches(this.view);
			},

			gotoLine: function() {
				if(this._destroyed) return;
				createGotoLinePanel(this.view, this.domNode);
			},

			closeGotoLine: function() {
				if(this._destroyed) return;
				var gotoLinePanel = this.domNode.querySelector(".cm-panel.cm-gotoLine");
				if(gotoLinePanel) {
					var closeBtn = gotoLinePanel.querySelector("button[name=close]");
					if(closeBtn) closeBtn.click();
				}
			},

			isSearchOpen: function() {
				if(this._destroyed || !searchLib.searchPanelOpen) return false;
				return searchLib.searchPanelOpen(this.view.state);
			},

			toggleSearch: function() {
				if(this._destroyed) return;
				if(searchLib.searchPanelOpen && searchLib.searchPanelOpen(this.view.state)) {
					if(searchLib.closeSearchPanel) searchLib.closeSearchPanel(this.view);
				} else {
					if(searchLib.openSearchPanel) searchLib.openSearchPanel(this.view);
				}
			},

			isGotoLineOpen: function() {
				if(this._destroyed) return false;
				return !!this.domNode.querySelector(".cm-panel.cm-gotoLine");
			},

			toggleGotoLine: function() {
				if(this._destroyed) return;
				var gotoLinePanel = this.domNode.querySelector(".cm-panel.cm-gotoLine");
				if(gotoLinePanel) {
					var closeBtn = gotoLinePanel.querySelector("button[name=close]");
					if(closeBtn) closeBtn.click();
				} else {
					createGotoLinePanel(this.view, this.domNode);
				}
			}
		};
	}
};
