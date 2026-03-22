/*\
title: $:/plugins/tiddlywiki/prosemirror/autocomplete/autocomplete-plugin.js
type: application/javascript
module-type: library

ProseMirror plugin for [[ {{ << autocompletion with configurable trigger aliases.

\*/

"use strict";

var Plugin = require("prosemirror-state").Plugin;
var PluginKey = require("prosemirror-state").PluginKey;
var Decoration = require("prosemirror-view").Decoration;
var DecorationSet = require("prosemirror-view").DecorationSet;

var AUTOCOMPLETE_KEY = new PluginKey("tw-autocomplete");

// Config tiddler paths for trigger aliases
var LINK_TRIGGERS_TITLE = "$:/config/prosemirror/autocomplete/link-triggers";
var TRANSCLUSION_TRIGGERS_TITLE = "$:/config/prosemirror/autocomplete/transclusion-triggers";
var MACRO_TRIGGERS_TITLE = "$:/config/prosemirror/autocomplete/macro-triggers";

/**
 * Parse trigger config from tiddler text.
 * Each line is an alias trigger string, e.g. "【【" or "[["
 * Returns array of trigger strings.
 */
function parseTriggerConfig(wiki, title, defaults) {
	var text = wiki.getTiddlerText(title, "");
	if(!text.trim()) return defaults;
	return text.split("\n").map(function(s) { return s.trim(); }).filter(function(s) { return s.length > 0; });
}

/**
 * Build the trigger map from config.
 * Returns array of { trigger: string, type: "link"|"transclusion"|"macro", closing: string }
 */
function buildTriggerMap(wiki) {
	var linkTriggers = parseTriggerConfig(wiki, LINK_TRIGGERS_TITLE, ["[["]);
	var transclusionTriggers = parseTriggerConfig(wiki, TRANSCLUSION_TRIGGERS_TITLE, ["{{"]);
	var macroTriggers = parseTriggerConfig(wiki, MACRO_TRIGGERS_TITLE, ["<<"]);

	var result = [];
	linkTriggers.forEach(function(t) {
		result.push({ trigger: t, type: "link", closing: "]]" });
	});
	transclusionTriggers.forEach(function(t) {
		result.push({ trigger: t, type: "transclusion", closing: "}}" });
	});
	macroTriggers.forEach(function(t) {
		result.push({ trigger: t, type: "macro", closing: ">>" });
	});

	// Sort by length descending so longer triggers match first
	result.sort(function(a, b) { return b.trigger.length - a.trigger.length; });
	return result;
}

/**
 * Get tiddler titles for completion suggestions.
 */
function getTiddlerCompletions(wiki, query) {
	var allTitles = wiki.getTiddlers({ sortField: "modified", reverse: true });
	if(!query) return allTitles.slice(0, 20);
	var lower = query.toLowerCase();
	var matched = [];
	for(var i = 0; i < allTitles.length && matched.length < 20; i++) {
		if(allTitles[i].toLowerCase().indexOf(lower) >= 0) {
			matched.push(allTitles[i]);
		}
	}
	return matched;
}

/**
 * Get macro/procedure names for completion.
 */
function getMacroCompletions(wiki, query) {
	// Collect all tiddlers tagged with $:/tags/Macro or that define \define/\procedure
	var macroNames = [];
	var tiddlers = wiki.getTiddlersWithTag("$:/tags/Macro");
	tiddlers.forEach(function(title) {
		macroNames.push(title.replace(/^\$:\//, ""));
	});
	// Also add built-in variable names from wiki
	var globalDefs = wiki.getGlobalCache("prosemirror-macro-names", function() {
		var names = [];
		wiki.each(function(tiddler, title) {
			var text = tiddler.fields.text || "";
			var pattern = /^\\(?:define|procedure|function|widget)\s+([^\s(]+)/gm;
			var match;
			while((match = pattern.exec(text)) !== null) {
				if(names.indexOf(match[1]) < 0) names.push(match[1]);
			}
		});
		return names.sort();
	});
	macroNames = macroNames.concat(globalDefs);

	if(!query) return macroNames.slice(0, 20);
	var lower = query.toLowerCase();
	return macroNames.filter(function(n) {
		return n.toLowerCase().indexOf(lower) >= 0;
	}).slice(0, 20);
}

/**
 * Create the autocomplete ProseMirror plugin.
 */
function createAutocompletePlugin(wiki) {
	var triggerMap = buildTriggerMap(wiki);

	return new Plugin({
		key: AUTOCOMPLETE_KEY,
		state: {
			init: function() {
				return {
					active: false,
					type: null,       // "link", "transclusion", "macro"
					triggerPos: null,  // Position where trigger was typed
					triggerLen: 0,     // Length of the trigger string
					closing: null,     // Closing string to insert
					query: "",
					items: [],
					selectedIndex: 0
				};
			},
			apply: function(tr, prev, oldState, newState) {
				// On any doc change, re-check if we should be in autocomplete mode
				var meta = tr.getMeta(AUTOCOMPLETE_KEY);
				if(meta) return meta;

				if(!tr.docChanged) return prev;

				// Check text before cursor for trigger sequences
				var sel = newState.selection;
				if(!sel.empty) return { active: false };

				var $pos = sel.$from;
				var textBefore = "";
				// Get text from start of current text block to cursor
				if($pos.parent.isTextblock) {
					textBefore = $pos.parent.textBetween(0, $pos.parentOffset, null, "\ufffc");
				}

				// Check each trigger
				for(var i = 0; i < triggerMap.length; i++) {
					var trig = triggerMap[i];
					if(textBefore.endsWith(trig.trigger)) {
						// Trigger detected — start autocomplete
						var triggerStart = $pos.pos - trig.trigger.length;
						var items;
						if(trig.type === "macro") {
							items = getMacroCompletions(wiki, "");
						} else {
							items = getTiddlerCompletions(wiki, "");
						}
						return {
							active: true,
							type: trig.type,
							triggerPos: triggerStart,
							triggerLen: trig.trigger.length,
							closing: trig.closing,
							query: "",
							items: items,
							selectedIndex: 0
						};
					}
				}

				// If already active, update query
				if(prev.active) {
					var curPos = sel.$from.pos;
					var queryStart = prev.triggerPos + prev.triggerLen;
					if(curPos < queryStart) {
						return { active: false };
					}
					var queryText = "";
					try {
						queryText = newState.doc.textBetween(queryStart, curPos, "", "\ufffc");
					} catch(e) {
						return { active: false };
					}
					// Cancel if user typed a space+character after trigger (but allow spaces in queries)
					// Cancel if query gets too long
					if(queryText.length > 100) {
						return { active: false };
					}
					var items;
					if(prev.type === "macro") {
						items = getMacroCompletions(wiki, queryText);
					} else {
						items = getTiddlerCompletions(wiki, queryText);
					}
					return {
						active: true,
						type: prev.type,
						triggerPos: prev.triggerPos,
						triggerLen: prev.triggerLen,
						closing: prev.closing,
						query: queryText,
						items: items,
						selectedIndex: Math.min(prev.selectedIndex, Math.max(0, items.length - 1))
					};
				}

				return prev;
			}
		},
		props: {
			handleKeyDown: function(view, event) {
				var state = AUTOCOMPLETE_KEY.getState(view.state);
				if(!state || !state.active) return false;

				if(event.key === "ArrowDown") {
					event.preventDefault();
					var next = Math.min(state.selectedIndex + 1, state.items.length - 1);
					view.dispatch(view.state.tr.setMeta(AUTOCOMPLETE_KEY, Object.assign({}, state, { selectedIndex: next })));
					return true;
				}
				if(event.key === "ArrowUp") {
					event.preventDefault();
					var prev = Math.max(state.selectedIndex - 1, 0);
					view.dispatch(view.state.tr.setMeta(AUTOCOMPLETE_KEY, Object.assign({}, state, { selectedIndex: prev })));
					return true;
				}
				if(event.key === "Enter" || event.key === "Tab") {
					event.preventDefault();
					acceptCompletion(view, state);
					return true;
				}
				if(event.key === "Escape") {
					event.preventDefault();
					view.dispatch(view.state.tr.setMeta(AUTOCOMPLETE_KEY, { active: false }));
					return true;
				}
				return false;
			}
		},
		view: function(editorView) {
			return new AutocompleteView(editorView, wiki);
		}
	});
}

/**
 * Accept the selected completion item.
 */
function acceptCompletion(view, state) {
	if(!state.items.length) {
		view.dispatch(view.state.tr.setMeta(AUTOCOMPLETE_KEY, { active: false }));
		return;
	}
	var selected = state.items[state.selectedIndex];
	var from = state.triggerPos;
	var to = view.state.selection.from;

	var insertText;
	if(state.type === "link") {
		insertText = "[[" + selected + "]]";
	} else if(state.type === "transclusion") {
		insertText = "{{" + selected + "}}";
	} else if(state.type === "macro") {
		insertText = "<<" + selected + ">>";
	}

	var tr = view.state.tr.replaceWith(from, to,
		view.state.schema.text(insertText)
	);
	tr.setMeta(AUTOCOMPLETE_KEY, { active: false });
	view.dispatch(tr);
	view.focus();
}

/**
 * Autocomplete dropdown view (manages DOM).
 */
function AutocompleteView(editorView, wiki) {
	this.view = editorView;
	this.wiki = wiki;
	this.container = document.createElement("div");
	this.container.className = "tc-prosemirror-autocomplete";
	this.container.style.display = "none";
	this.container.style.position = "absolute";
	this.container.style.zIndex = "1100";
	document.body.appendChild(this.container);
}

AutocompleteView.prototype.update = function(view) {
	var state = AUTOCOMPLETE_KEY.getState(view.state);
	if(!state || !state.active || !state.items.length) {
		this.container.style.display = "none";
		return;
	}

	// Position dropdown below cursor
	var coords = view.coordsAtPos(view.state.selection.from);
	this.container.style.left = (coords.left + window.scrollX) + "px";
	this.container.style.top = (coords.bottom + 4 + window.scrollY) + "px";
	this.container.style.display = "block";

	// Render items
	var self = this;
	while(this.container.firstChild) this.container.removeChild(this.container.firstChild);

	for(var i = 0; i < state.items.length; i++) {
		(function(idx) {
			var item = document.createElement("div");
			item.className = "tc-prosemirror-autocomplete-item";
			if(idx === state.selectedIndex) {
				item.classList.add("tc-prosemirror-autocomplete-item-selected");
			}
			item.textContent = state.items[idx];
			item.addEventListener("mousedown", function(e) {
				e.preventDefault();
				var currentState = AUTOCOMPLETE_KEY.getState(view.state);
				if(currentState) {
					var updated = Object.assign({}, currentState, { selectedIndex: idx });
					acceptCompletion(view, updated);
				}
			});
			self.container.appendChild(item);
		})(i);
	}

	// Scroll selected item into view
	var selectedEl = this.container.children[state.selectedIndex];
	if(selectedEl) {
		selectedEl.scrollIntoView({ block: "nearest" });
	}
};

AutocompleteView.prototype.destroy = function() {
	if(this.container && this.container.parentNode) {
		this.container.parentNode.removeChild(this.container);
	}
};

exports.createAutocompletePlugin = createAutocompletePlugin;
exports.AUTOCOMPLETE_KEY = AUTOCOMPLETE_KEY;
