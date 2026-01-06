/*\
title: $:/plugins/tiddlywiki/codemirror-6/search.js
type: application/javascript
module-type: codemirror6-plugin

Search and replace plugin for CodeMirror 6 (built-in)

\*/
(function() {
	"use strict";

	if(!$tw.browser) return;

	// Load the search library
	var searchLib = require("$:/plugins/tiddlywiki/codemirror-6/lib/codemirror-search.js");

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

			// Add search keymap (without Escape - we handle it separately)
			if(keymap && searchLib.searchKeymap) {
				var filteredKeymap = searchLib.searchKeymap.filter(function(binding) {
					return binding.key !== "Escape";
				});
				extensions.push(keymap.of(filteredKeymap));
			}

			// Store reference for Escape handler
			var searchLibRef = searchLib;

			// Use ViewPlugin to add capturing event listener for Escape
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

							// Check if goto line panel is open
							var gotoLinePanel = view.dom.querySelector(".cm-gotoLine");
							if(gotoLinePanel) {
								// Find and click the close button, or simulate escape on the input
								var closeBtn = gotoLinePanel.querySelector("button[name=close]");
								if(closeBtn) {
									closeBtn.click();
									event.preventDefault();
									event.stopPropagation();
									event.stopImmediatePropagation();
									return;
								}
							}
						}
					};

					// Add listener in capture phase to intercept before TiddlyWiki
					view.dom.addEventListener("keydown", handler, true);

					return {
						destroy: function() {
							view.dom.removeEventListener("keydown", handler, true);
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
					if(this._destroyed || !searchLib.gotoLine) return;
					searchLib.gotoLine(this.view);
				},

				isSearchOpen: function() {
					if(this._destroyed || !searchLib.searchPanelOpen) return false;
					return searchLib.searchPanelOpen(this.view.state);
				}
			};
		}
	};

})();
