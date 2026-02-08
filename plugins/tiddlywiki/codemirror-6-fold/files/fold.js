/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/fold.js
type: application/javascript
module-type: codemirror6-plugin

Code folding plugin - adds fold gutter and folding APIs.
Supports folding TiddlyWiki5 syntax when lang-tiddlywiki is present:
- Headings fold to the next heading of equal or higher level
- Block elements (widgets, HTML blocks, code blocks, etc.) fold their contents
- Transclusion blocks, macro call blocks, and typed blocks are foldable

\*/

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

if(!$tw.browser) return;

exports.plugin = {
	name: "fold",
	description: "Code folding with TiddlyWiki syntax support",
	priority: 700,

	// Load if foldGutter option is enabled
	condition: function(context) {
		var wiki = context.options && context.options.widget && context.options.widget.wiki;
		// Check config tiddler directly since context.options may not have foldGutter set initially
		var foldGutterEnabled = wiki && wiki.getTiddlerText("$:/config/codemirror-6/fold/enabled") === "yes";
		// Only enable for main body editors (not inline text fields)
		var isBody = context.options && context.options.widget &&
			context.options.widget.editClass &&
			context.options.widget.editClass.indexOf("tc-edit-texteditor-body") !== -1;
		var result = foldGutterEnabled && isBody;
		return result;
	},

	init: function(cm6Core) {
		this._core = cm6Core;
	},

	registerCompartments: function() {
		var core = this._core;
		var Compartment = core.state.Compartment;

		return {
			foldGutter: new Compartment()
		};
	},

	getExtensions: function(context) {
		var core = this._core;
		var extensions = [];
		var engine = context.engine;
		var compartments = engine._compartments;

		// Get fold gutter configuration options
		var foldGutterConfig = this._createFoldGutterConfig();

		// Add code folding support (fold state, decorations)
		var codeFolding = (core.language || {}).codeFolding;
		if(codeFolding) {
			extensions.push(codeFolding());
		}

		// Fold gutter with custom markers for TiddlyWiki styling
		var foldGutter = (core.language || {}).foldGutter;
		if(compartments.foldGutter && foldGutter) {
			extensions.push(
				compartments.foldGutter.of(foldGutter(foldGutterConfig))
			);
		}

		// Fold keymap (Ctrl-Shift-[ to fold, Ctrl-Shift-] to unfold)
		var foldKeymap = (core.language || {}).foldKeymap;
		var keymap = core.view.keymap;
		if(foldKeymap && keymap) {
			extensions.push(keymap.of(foldKeymap));
		}

		// Note: Header folding (headerIndent) is automatically provided by the
		// lang-tiddlywiki plugin when TiddlyWiki content is being edited.
		// This allows headings to fold to the next heading of same/higher level.

		return extensions;
	},

	_createFoldGutterConfig: function() {
		// Custom fold markers for TiddlyWiki styling
		// These use CSS classes that can be styled via styles.tid
		return {
			markerDOM: function(open) {
				var marker = document.createElement("span");
				marker.className = open ? "cm-foldGutter-open" : "cm-foldGutter-closed";
				marker.textContent = open ? "▼" : "▶";
				marker.title = open ? "Fold code" : "Unfold code";
				return marker;
			}
		};
	},

	registerEvents: function(engine, _context) {
		var core = this._core;
		var foldGutter = (core.language || {}).foldGutter;
		var self = this;

		return {
			settingsChanged: function(settings) {
				if(engine._destroyed || !foldGutter) return;

				// Toggle fold gutter based on settings
				var showFoldGutter = settings.foldGutter !== false;
				if(showFoldGutter) {
					engine.reconfigure("foldGutter", foldGutter(self._createFoldGutterConfig()));
				} else {
					engine.reconfigure("foldGutter", []);
				}
			}
		};
	},

	extendAPI: function(_engine, _context) {
		var core = this._core;
		var foldCode = (core.language || {}).foldCode;
		var unfoldCode = (core.language || {}).unfoldCode;
		var foldAll = (core.language || {}).foldAll;
		var unfoldAll = (core.language || {}).unfoldAll;
		var foldGutter = (core.language || {}).foldGutter;
		var _foldEffect = (core.language || {}).foldEffect;
		var _unfoldEffect = (core.language || {}).unfoldEffect;
		var foldedRanges = (core.language || {}).foldedRanges;
		var foldable = (core.language || {}).foldable;
		var self = this;

		return {
			// ==== Fold API ====

			/**
			 * Fold the code block at the given position (or cursor position).
			 * Works with TiddlyWiki blocks like widgets, headings, code blocks.
			 * @param {number} [pos] - Position to fold at (defaults to cursor)
			 * @returns {boolean} True if folding occurred
			 */
			foldAt: function(pos) {
				if(this._destroyed || !foldCode) return false;
				// foldCode folds at cursor position
				if(pos !== undefined) {
					this.setCursor(pos);
				}
				return foldCode(this.view);
			},

			/**
			 * Unfold the code block at the given position (or cursor position).
			 * @param {number} [pos] - Position to unfold at (defaults to cursor)
			 * @returns {boolean} True if unfolding occurred
			 */
			unfoldAt: function(pos) {
				if(this._destroyed || !unfoldCode) return false;
				if(pos !== undefined) {
					this.setCursor(pos);
				}
				return unfoldCode(this.view);
			},

			/**
			 * Fold all foldable regions in the document.
			 * @returns {boolean} True if any folding occurred
			 */
			foldAll: function() {
				if(this._destroyed || !foldAll) return false;
				return foldAll(this.view);
			},

			/**
			 * Unfold all folded regions in the document.
			 * @returns {boolean} True if any unfolding occurred
			 */
			unfoldAll: function() {
				if(this._destroyed || !unfoldAll) return false;
				return unfoldAll(this.view);
			},

			/**
			 * Toggle the fold state at the given position (or cursor position).
			 * If folded, unfolds; if unfolded, folds.
			 * @param {number} [pos] - Position to toggle at (defaults to cursor)
			 * @returns {boolean} True if any fold/unfold occurred
			 */
			toggleFold: function(pos) {
				if(this._destroyed) return false;

				if(pos !== undefined) {
					this.setCursor(pos);
				}

				// Try to unfold first, if that fails, fold
				if(unfoldCode && unfoldCode(this.view)) {
					return true;
				}
				if(foldCode) {
					return foldCode(this.view);
				}
				return false;
			},

			// ==== Configuration ====

			/**
			 * Show or hide the fold gutter.
			 * @param {boolean} show - Whether to show the gutter
			 */
			setFoldGutter: function(show) {
				if(this._destroyed || !foldGutter) return;
				this.reconfigure("foldGutter", show ? foldGutter(self._createFoldGutterConfig()) : []);
			},

			// ==== Query API ====

			/**
			 * Check if the line at the given position is foldable.
			 * @param {number} pos - Position to check
			 * @returns {boolean} True if the line is foldable
			 */
			isFoldable: function(pos) {
				if(this._destroyed || !foldable) return false;
				var line = this.view.state.doc.lineAt(pos);
				return foldable(this.view.state, line.from, line.to) !== null;
			},

			/**
			 * Get all currently folded ranges.
			 * @returns {Array<{from: number, to: number}>} Array of folded ranges
			 */
			getFoldedRanges: function() {
				if(this._destroyed || !foldedRanges) return [];
				var ranges = [];
				var iter = foldedRanges(this.view.state).iter();
				while(iter.value) {
					ranges.push({
						from: iter.from,
						to: iter.to
					});
					iter.next();
				}
				return ranges;
			},

			/**
			 * Get the foldable range for a given position, if any.
			 * @param {number} pos - Position to check
			 * @returns {{from: number, to: number}|null} Foldable range or null
			 */
			getFoldableRange: function(pos) {
				if(this._destroyed || !foldable) return null;
				var line = this.view.state.doc.lineAt(pos);
				return foldable(this.view.state, line.from, line.to);
			}
		};
	}
};
