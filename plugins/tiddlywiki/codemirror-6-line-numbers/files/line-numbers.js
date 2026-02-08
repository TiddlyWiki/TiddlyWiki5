/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/line-numbers/line-numbers.js
type: application/javascript
module-type: codemirror6-plugin

Line numbers plugin - shows line numbers in the gutter and highlights active line

\*/
"use strict";

if(!$tw.browser) return;

exports.plugin = {
	name: "line-numbers",
	description: "Line numbers gutter and active line highlighting",
	priority: 800,

	condition: function(context) {
		// Never enable for input mode (single-line editors)
		if(context.isInputMode) {
			return false;
		}
		// Disabled by default in simple editors (textareas)
		if(context.isSimpleEditor) {
			return false;
		}
		return true;
	},

	init: function(cm6Core) {
		this._core = cm6Core;
	},

	registerCompartments: function() {
		var Compartment = this._core.state.Compartment;
		return {
			lineNumbers: new Compartment(),
			highlightActiveLine: new Compartment()
		};
	},

	getExtensions: function(context) {
		var core = this._core;
		var engine = context.engine;
		var compartments = engine._compartments;
		var extensions = [];

		var lineNumbers = (core.view || {}).lineNumbers;
		var highlightActiveLine = (core.view || {}).highlightActiveLine;
		var highlightActiveLineGutter = (core.view || {}).highlightActiveLineGutter;

		// Line numbers - default enabled
		if(compartments.lineNumbers && lineNumbers) {
			extensions.push(compartments.lineNumbers.of(lineNumbers()));
		}

		// Highlight active line - default enabled
		if(compartments.highlightActiveLine && highlightActiveLine) {
			var activeLineExts = [highlightActiveLine()];
			if(highlightActiveLineGutter) {
				activeLineExts.push(highlightActiveLineGutter());
			}
			extensions.push(compartments.highlightActiveLine.of(activeLineExts));
		}

		return extensions;
	},

	registerEvents: function(engine, _context) {
		var core = this._core;
		var lineNumbers = (core.view || {}).lineNumbers;
		var highlightActiveLine = (core.view || {}).highlightActiveLine;
		var highlightActiveLineGutter = (core.view || {}).highlightActiveLineGutter;

		return {
			settingsChanged: function(settings) {
				if(engine._destroyed) return;

				// Line numbers
				if(lineNumbers) {
					var showLineNumbers = settings.lineNumbers !== false;
					engine.reconfigure("lineNumbers", showLineNumbers ? lineNumbers() : []);
				}

				// Highlight active line
				if(highlightActiveLine) {
					var showActiveLine = settings.highlightActiveLine !== false;
					var activeLineExts = [];
					if(showActiveLine) {
						activeLineExts.push(highlightActiveLine());
						if(highlightActiveLineGutter) {
							activeLineExts.push(highlightActiveLineGutter());
						}
					}
					engine.reconfigure("highlightActiveLine", activeLineExts);
				}
			}
		};
	},

	extendAPI: function(_engine, _context) {
		var core = this._core;
		var lineNumbers = (core.view || {}).lineNumbers;
		var highlightActiveLine = (core.view || {}).highlightActiveLine;
		var highlightActiveLineGutter = (core.view || {}).highlightActiveLineGutter;

		return {
			setLineNumbers: function(show) {
				if(this._destroyed || !lineNumbers) return;
				this.reconfigure("lineNumbers", show ? lineNumbers() : []);
			},

			setHighlightActiveLine: function(show) {
				if(this._destroyed || !highlightActiveLine) return;
				var exts = [];
				if(show) {
					exts.push(highlightActiveLine());
					if(highlightActiveLineGutter) {
						exts.push(highlightActiveLineGutter());
					}
				}
				this.reconfigure("highlightActiveLine", exts);
			}
		};
	}
};
