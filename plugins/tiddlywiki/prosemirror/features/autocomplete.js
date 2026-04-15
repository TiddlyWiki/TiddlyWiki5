/*\
title: $:/plugins/tiddlywiki/prosemirror/features/autocomplete.js
type: application/javascript
module-type: library

ProseMirror plugin for [[ {{ << autocompletion with configurable trigger aliases.

\*/

"use strict";

const Plugin = require("prosemirror-state").Plugin;
const PluginKey = require("prosemirror-state").PluginKey;
const Decoration = require("prosemirror-view").Decoration;
const DecorationSet = require("prosemirror-view").DecorationSet;

const AUTOCOMPLETE_KEY = new PluginKey("tw-autocomplete");

// Config tiddler paths for trigger aliases
const LINK_TRIGGERS_TITLE = "$:/config/prosemirror/autocomplete/link-triggers";
const TRANSCLUSION_TRIGGERS_TITLE = "$:/config/prosemirror/autocomplete/transclusion-triggers";
const MACRO_TRIGGERS_TITLE = "$:/config/prosemirror/autocomplete/macro-triggers";

function parseTriggerConfig(wiki, title, defaults) {
	const text = wiki.getTiddlerText(title, "");
	if(!text.trim()) return defaults;
	return text.split("\n").map((s) => { return s.trim(); }).filter((s) => { return s.length > 0; });
}

function buildTriggerMap(wiki) {
	const linkTriggers = parseTriggerConfig(wiki, LINK_TRIGGERS_TITLE, ["[["]);
	const transclusionTriggers = parseTriggerConfig(wiki, TRANSCLUSION_TRIGGERS_TITLE, ["{{"]);
	const macroTriggers = parseTriggerConfig(wiki, MACRO_TRIGGERS_TITLE, ["<<"]);

	const result = [];
	linkTriggers.forEach((t) => {
		result.push({ trigger: t, type: "link", closing: "]]" });
	});
	transclusionTriggers.forEach((t) => {
		result.push({ trigger: t, type: "transclusion", closing: "}}" });
	});
	macroTriggers.forEach((t) => {
		result.push({ trigger: t, type: "macro", closing: ">>" });
	});

	// Sort by length descending so longer triggers match first
	result.sort((a, b) => { return b.trigger.length - a.trigger.length; });
	return result;
}

function getTiddlerCompletions(wiki, query) {
	const allTitles = wiki.getTiddlers({ sortField: "modified", reverse: true });
	if(!query) return allTitles.slice(0, 20);
	const lower = query.toLowerCase();
	const matched = [];
	for(let i = 0; i < allTitles.length && matched.length < 20; i++) {
		if(allTitles[i].toLowerCase().indexOf(lower) >= 0) {
			matched.push(allTitles[i]);
		}
	}
	return matched;
}

function getMacroCompletions(wiki, query) {
	// Collect all tiddlers tagged with $:/tags/Macro or that define \define/\procedure
	let macroNames = [];
	const tiddlers = wiki.getTiddlersWithTag("$:/tags/Macro");
	tiddlers.forEach((title) => {
		macroNames.push(title.replace(/^\$:\//, ""));
	});
	// Also add built-in variable names from wiki
	const globalDefs = wiki.getGlobalCache("prosemirror-macro-names", () => {
		const names = [];
		wiki.each((tiddler, title) => {
			const text = tiddler.fields.text || "";
			const pattern = /^\\(?:define|procedure|function|widget)\s+([^\s(]+)/gm;
			let match;
			while((match = pattern.exec(text)) !== null) {
				if(names.indexOf(match[1]) < 0) names.push(match[1]);
			}
		});
		return names.sort();
	});
	macroNames = macroNames.concat(globalDefs);

	if(!query) return macroNames.slice(0, 20);
	const lower = query.toLowerCase();
	return macroNames.filter((n) => {
		return n.toLowerCase().indexOf(lower) >= 0;
	}).slice(0, 20);
}

function createAutocompletePlugin(wiki) {
	const triggerMap = buildTriggerMap(wiki);

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
				const meta = tr.getMeta(AUTOCOMPLETE_KEY);
				if(meta) return meta;

				if(!tr.docChanged) return prev;

				// Check text before cursor for trigger sequences
				const sel = newState.selection;
				if(!sel.empty) return { active: false };

				const $pos = sel.$from;
				let textBefore = "";
				// Get text from start of current text block to cursor
				if($pos.parent.isTextblock) {
					textBefore = $pos.parent.textBetween(0, $pos.parentOffset, null, "\ufffc");
				}

				// Check each trigger
				for(let i = 0; i < triggerMap.length; i++) {
					const trig = triggerMap[i];
					if(textBefore.endsWith(trig.trigger)) {
						// Trigger detected — start autocomplete
						const triggerStart = $pos.pos - trig.trigger.length;
						let items;
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
					const curPos = sel.$from.pos;
					const queryStart = prev.triggerPos + prev.triggerLen;
					if(curPos < queryStart) {
						return { active: false };
					}
					let queryText = "";
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
					let items;
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
				const state = AUTOCOMPLETE_KEY.getState(view.state);
				if(!state || !state.active) return false;

				if(event.key === "ArrowDown") {
					event.preventDefault();
					const next = Math.min(state.selectedIndex + 1, state.items.length - 1);
					view.dispatch(view.state.tr.setMeta(AUTOCOMPLETE_KEY, { ...state, ...{ selectedIndex: next } }));
					return true;
				}
				if(event.key === "ArrowUp") {
					event.preventDefault();
					const prev = Math.max(state.selectedIndex - 1, 0);
					view.dispatch(view.state.tr.setMeta(AUTOCOMPLETE_KEY, { ...state, ...{ selectedIndex: prev } }));
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

function acceptCompletion(view, state) {
	if(!state.items.length) {
		view.dispatch(view.state.tr.setMeta(AUTOCOMPLETE_KEY, { active: false }));
		return;
	}
	const selected = state.items[state.selectedIndex];
	const from = state.triggerPos;
	const to = view.state.selection.from;

	let insertText;
	if(state.type === "link") {
		insertText = "[[" + selected + "]]";
	} else if(state.type === "transclusion") {
		insertText = "{{" + selected + "}}";
	} else if(state.type === "macro") {
		insertText = "<<" + selected + ">>";
	}

	const tr = view.state.tr.replaceWith(from, to,
		view.state.schema.text(insertText)
	);
	tr.setMeta(AUTOCOMPLETE_KEY, { active: false });
	view.dispatch(tr);
	view.focus();
}

class AutocompleteView {
	constructor(editorView, wiki) {
		this.view = editorView;
		this.wiki = wiki;
		this.container = document.createElement("div");
		this.container.className = "tc-prosemirror-autocomplete";
		this.container.style.display = "none";
		this.container.style.position = "absolute";
		this.container.style.zIndex = "1100";
		document.body.appendChild(this.container);
	}

	update(view) {
		const state = AUTOCOMPLETE_KEY.getState(view.state);
		if(!state || !state.active || !state.items.length) {
			this.container.style.display = "none";
			return;
		}

		const coords = view.coordsAtPos(view.state.selection.from);
		this.container.style.left = (coords.left + window.scrollX) + "px";
		this.container.style.top = (coords.bottom + 4 + window.scrollY) + "px";
		this.container.style.display = "block";

		while(this.container.firstChild) this.container.removeChild(this.container.firstChild);

		for(let idx = 0; idx < state.items.length; idx++) {
			const item = document.createElement("div");
			item.className = "tc-prosemirror-autocomplete-item";
			if(idx === state.selectedIndex) {
				item.classList.add("tc-prosemirror-autocomplete-item-selected");
			}
			item.textContent = state.items[idx];
			item.addEventListener("mousedown", (e) => {
				e.preventDefault();
				const currentState = AUTOCOMPLETE_KEY.getState(view.state);
				if(currentState) {
					acceptCompletion(view, { ...currentState, ...{ selectedIndex: idx } });
				}
			});
			this.container.appendChild(item);
		}

		const selectedEl = this.container.children[state.selectedIndex];
		if(selectedEl) selectedEl.scrollIntoView({ block: "nearest" });
	}

	destroy() {
		if(this.container && this.container.parentNode) {
			this.container.parentNode.removeChild(this.container);
		}
	}
}

exports.createAutocompletePlugin = createAutocompletePlugin;
exports.AUTOCOMPLETE_KEY = AUTOCOMPLETE_KEY;
