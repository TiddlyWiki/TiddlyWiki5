/*\
title: $:/plugins/tiddlywiki/codemirror-6/plugins/word-count.js
type: application/javascript
module-type: codemirror6-plugin

Word count plugin - displays live word, character, and line counts.

\*/
(function() {

	/*jslint node: true, browser: true */
	/*global $tw: false */
	"use strict";

	if(!$tw.browser) return;

	var CONFIG_TIDDLER = "$:/config/codemirror-6/wordCount";

	exports.plugin = {
		name: "word-count",
		description: "Live word, character, and line count display",
		priority: 50,

		condition: function(context) {
			var wiki = context.options && context.options.widget && context.options.widget.wiki;
			var enabled = wiki && wiki.getTiddlerText(CONFIG_TIDDLER) === "yes";
			var isBody = context.options && context.options.widget &&
				context.options.widget.editClass &&
				context.options.widget.editClass.indexOf("tc-edit-texteditor-body") !== -1;
			return enabled && isBody;
		},

		init: function(cm6Core) {
			this._core = cm6Core;
		},

		registerCompartments: function() {
			var core = this._core;
			var Compartment = core.state.Compartment;
			return {
				wordCount: new Compartment()
			};
		},

		getExtensions: function(context) {
			var core = this._core;
			var _EditorView = core.view.EditorView;
			var showPanel = core.view.showPanel;
			var extensions = [];

			if(!showPanel) return extensions;

			// Create panel that shows word count
			var wordCountPanel = showPanel.of(function(view) {
				var dom = document.createElement("div");
				dom.className = "cm-word-count-panel";

				function updateCounts() {
					var text = view.state.doc.toString();
					var lines = view.state.doc.lines;
					var chars = text.length;
					// Count words: split by whitespace, filter empty
					var words = text.trim() ? text.trim().split(/\s+/).length : 0;

					// Check if there's a selection
					var selection = view.state.selection.main;
					var selectedText = "";
					if(!selection.empty) {
						selectedText = view.state.sliceDoc(selection.from, selection.to);
						var selectedWords = selectedText.trim() ? selectedText.trim().split(/\s+/).length : 0;
						var selectedChars = selectedText.length;
						dom.textContent = selectedWords + " / " + words + " words | " +
							selectedChars + " / " + chars + " chars | " + lines + " lines";
					} else {
						dom.textContent = words + " words | " + chars + " chars | " + lines + " lines";
					}
				}

				updateCounts();

				return {
					dom: dom,
					update: function(update) {
						if(update.docChanged || update.selectionSet) {
							updateCounts();
						}
					}
				};
			});

			// Store plugin reference for registerEvents
			this._wordCountPanel = wordCountPanel;

			// Wrap in compartment if available
			var engine = context.engine;
			var compartments = engine && engine._compartments;
			if(compartments && compartments.wordCount) {
				extensions.push(compartments.wordCount.of(wordCountPanel));
			} else {
				extensions.push(wordCountPanel);
			}

			return extensions;
		},

		registerEvents: function(engine, _context) {
			var self = this;
			var core = this._core;

			return {
				settingsChanged: function(settings) {
					if(engine._destroyed) return;

					if(settings.wordCount !== undefined) {
						if(settings.wordCount) {
							// Create the panel if it doesn't exist (plugin started inactive)
							if(!self._wordCountPanel && core.view.showPanel) {
								self._wordCountPanel = core.view.showPanel.of(function(view) {
									var dom = document.createElement("div");
									dom.className = "cm-word-count-panel";

									function updateCounts() {
										var text = view.state.doc.toString();
										var lines = view.state.doc.lines;
										var chars = text.length;
										var words = text.trim() ? text.trim().split(/\s+/).length : 0;

										var selection = view.state.selection.main;
										if(!selection.empty) {
											var selectedText = view.state.sliceDoc(selection.from, selection.to);
											var selectedWords = selectedText.trim() ? selectedText.trim().split(/\s+/).length : 0;
											var selectedChars = selectedText.length;
											dom.textContent = selectedWords + " / " + words + " words | " +
												selectedChars + " / " + chars + " chars | " + lines + " lines";
										} else {
											dom.textContent = words + " words | " + chars + " chars | " + lines + " lines";
										}
									}

									updateCounts();

									return {
										dom: dom,
										update: function(update) {
											if(update.docChanged || update.selectionSet) {
												updateCounts();
											}
										}
									};
								});
							}
							if(self._wordCountPanel) {
								engine.reconfigure("wordCount", self._wordCountPanel);
							}
						} else {
							engine.reconfigure("wordCount", []);
						}
					}
				}
			};
		}
	};

})();
