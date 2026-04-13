/*\
title: $:/plugins/tiddlywiki/prosemirror/find-replace/find-replace-plugin.js
type: application/javascript
module-type: library

ProseMirror Find & Replace plugin.

\*/

"use strict";

const Plugin = require("prosemirror-state").Plugin;
const PluginKey = require("prosemirror-state").PluginKey;
const Decoration = require("prosemirror-view").Decoration;
const DecorationSet = require("prosemirror-view").DecorationSet;
const TextSelection = require("prosemirror-state").TextSelection;

const FIND_REPLACE_KEY = new PluginKey("tw-find-replace");

function getSvgIcon(tiddlerTitle, size) {
	size = size || "1em";
	try {
		const htmlStr = $tw.wiki.renderTiddler("text/html", tiddlerTitle, {
			variables: { size: size }
		});
		if(!htmlStr) return null;
		const container = document.createElement("div");
		container.innerHTML = htmlStr;
		const svgEl = container.querySelector("svg");
		if(svgEl) return svgEl;
	} catch(e) { /* ignore */ }
	return null;
}

function findMatches(doc, searchTerm, caseSensitive) {
	if(!searchTerm) return [];
	const results = [];
	const search = caseSensitive ? searchTerm : searchTerm.toLowerCase();

	doc.descendants((node, pos) => {
		if(node.isText) {
			const text = caseSensitive ? node.text : node.text.toLowerCase();
			let idx = 0;
			while(idx < text.length) {
				const found = text.indexOf(search, idx);
				if(found < 0) break;
				results.push({ from: pos + found, to: pos + found + searchTerm.length });
				idx = found + 1;
			}
		}
	});
	return results;
}

function createDecorations(doc, matches, currentIndex) {
	const decorations = [];
	for(let i = 0; i < matches.length; i++) {
		const match = matches[i];
		const cls = i === currentIndex ? "tc-prosemirror-find-current" : "tc-prosemirror-find-match";
		decorations.push(Decoration.inline(match.from, match.to, { class: cls }));
	}
	return DecorationSet.create(doc, decorations);
}

function createFindReplacePlugin(wiki) {
	return new Plugin({
		key: FIND_REPLACE_KEY,
		state: {
			init: function() {
				return {
					active: false,
					searchTerm: "",
					replaceTerm: "",
					caseSensitive: false,
					matches: [],
					currentIndex: -1,
					decorations: DecorationSet.empty
				};
			},
			apply: function(tr, prev, oldState, newState) {
				const meta = tr.getMeta(FIND_REPLACE_KEY);
				if(meta) {
					// Recalculate matches if search changed
					if(meta.searchTerm !== undefined || meta.caseSensitive !== undefined) {
						const term = meta.searchTerm !== undefined ? meta.searchTerm : prev.searchTerm;
						const cs = meta.caseSensitive !== undefined ? meta.caseSensitive : prev.caseSensitive;
						const matches = findMatches(newState.doc, term, cs);
						let curIdx = matches.length > 0 ? 0 : -1;
						if(meta.currentIndex !== undefined) curIdx = meta.currentIndex;
						return {
							active: meta.active !== undefined ? meta.active : prev.active,
							searchTerm: term,
							replaceTerm: meta.replaceTerm !== undefined ? meta.replaceTerm : prev.replaceTerm,
							caseSensitive: cs,
							matches: matches,
							currentIndex: curIdx,
							decorations: createDecorations(newState.doc, matches, curIdx)
						};
					}
					// Just updating currentIndex or active state
					const state = { ...prev };
					if(meta.active !== undefined) state.active = meta.active;
					if(meta.currentIndex !== undefined) state.currentIndex = meta.currentIndex;
					if(meta.replaceTerm !== undefined) state.replaceTerm = meta.replaceTerm;
					state.decorations = createDecorations(newState.doc, state.matches, state.currentIndex);
					if(!state.active) state.decorations = DecorationSet.empty;
					return state;
				}
				// On doc change, remap decorations
				if(tr.docChanged && prev.active && prev.searchTerm) {
					const matches = findMatches(newState.doc, prev.searchTerm, prev.caseSensitive);
					let curIdx = Math.min(prev.currentIndex, matches.length - 1);
					if(curIdx < 0 && matches.length > 0) curIdx = 0;
					return {
						...prev,
						matches,
						currentIndex: curIdx,
						decorations: createDecorations(newState.doc, matches, curIdx)
					};
				}
				return prev;
			}
		},
		props: {
			decorations: (state) => {
				return FIND_REPLACE_KEY.getState(state).decorations;
			},
			handleKeyDown: function(view, event) {
				// Ctrl+F / Cmd+F to open find
				if((event.ctrlKey || event.metaKey) && event.key === "f") {
					event.preventDefault();
					const st = FIND_REPLACE_KEY.getState(view.state);
					view.dispatch(view.state.tr.setMeta(FIND_REPLACE_KEY, {
						active: true,
						searchTerm: st.searchTerm
					}));
					return true;
				}
				// Ctrl+H / Cmd+H to open find+replace
				if((event.ctrlKey || event.metaKey) && event.key === "h") {
					event.preventDefault();
					const st = FIND_REPLACE_KEY.getState(view.state);
					view.dispatch(view.state.tr.setMeta(FIND_REPLACE_KEY, {
						active: true,
						searchTerm: st.searchTerm
					}));
					return true;
				}
				// Escape to close
				if(event.key === "Escape") {
					const st = FIND_REPLACE_KEY.getState(view.state);
					if(st.active) {
						view.dispatch(view.state.tr.setMeta(FIND_REPLACE_KEY, { active: false }));
						view.focus();
						return true;
					}
				}
				return false;
			}
		},
		view: function(editorView) {
			return new FindReplaceView(editorView, wiki);
		}
	});
}

class FindReplaceView {
	constructor(editorView, wiki) {
		this.view = editorView;
		this.wiki = wiki;
		this.panel = null;
		this.searchInput = null;
		this.replaceInput = null;
		this.countLabel = null;
		this.caseSensitiveBtn = null;
	}

	buildPanel() {
		const panel = document.createElement("div");
		panel.className = "tc-prosemirror-find-replace-panel";
		panel.style.display = "none";

		// Search row
		const searchRow = document.createElement("div");
		searchRow.className = "tc-prosemirror-find-replace-row";

		const searchInput = document.createElement("input");
		searchInput.type = "text";
		searchInput.className = "tc-prosemirror-find-input";
		searchInput.placeholder = this.wiki.getTiddlerText(
			"$:/plugins/tiddlywiki/prosemirror/language/FindReplace/SearchPlaceholder", "Find...");
		searchInput.addEventListener("input", () => {
			this.view.dispatch(this.view.state.tr.setMeta(FIND_REPLACE_KEY, {
				searchTerm: searchInput.value
			}));
		});
		searchInput.addEventListener("keydown", (e) => {
			if(e.key === "Enter") {
				e.preventDefault();
				if(e.shiftKey) { this.findPrev(); } else { this.findNext(); }
			}
			if(e.key === "Escape") {
				e.preventDefault();
				this.close();
			}
		});
		this.searchInput = searchInput;

		const countLabel = document.createElement("span");
		countLabel.className = "tc-prosemirror-find-count";
		this.countLabel = countLabel;

		const prevBtn = document.createElement("button");
		prevBtn.type = "button";
		prevBtn.className = "tc-prosemirror-find-btn";
		prevBtn.textContent = "▲";
		prevBtn.title = this.wiki.getTiddlerText(
			"$:/plugins/tiddlywiki/prosemirror/language/FindReplace/Previous", "Previous");
		prevBtn.addEventListener("click", (e) => { e.preventDefault(); this.findPrev(); });

		const nextBtn = document.createElement("button");
		nextBtn.type = "button";
		nextBtn.className = "tc-prosemirror-find-btn";
		nextBtn.textContent = "▼";
		nextBtn.title = this.wiki.getTiddlerText(
			"$:/plugins/tiddlywiki/prosemirror/language/FindReplace/Next", "Next");
		nextBtn.addEventListener("click", (e) => { e.preventDefault(); this.findNext(); });

		const caseSensitiveBtn = document.createElement("button");
		caseSensitiveBtn.type = "button";
		caseSensitiveBtn.className = "tc-prosemirror-find-btn tc-prosemirror-find-case-btn";
		caseSensitiveBtn.textContent = "Aa";
		caseSensitiveBtn.title = this.wiki.getTiddlerText(
			"$:/plugins/tiddlywiki/prosemirror/language/FindReplace/CaseSensitive", "Case sensitive");
		caseSensitiveBtn.addEventListener("click", (e) => {
			e.preventDefault();
			const st = FIND_REPLACE_KEY.getState(this.view.state);
			this.view.dispatch(this.view.state.tr.setMeta(FIND_REPLACE_KEY, {
				caseSensitive: !st.caseSensitive,
				searchTerm: st.searchTerm
			}));
			caseSensitiveBtn.classList.toggle("active", !st.caseSensitive);
		});
		this.caseSensitiveBtn = caseSensitiveBtn;

		const closeBtn = document.createElement("button");
		closeBtn.type = "button";
		closeBtn.className = "tc-prosemirror-find-btn tc-prosemirror-find-close-btn";
		const closeSvg = getSvgIcon("$:/core/images/close-button", "1em");
		if(closeSvg) {
			closeBtn.appendChild(document.importNode(closeSvg, true));
		} else {
			closeBtn.textContent = "\u00D7";
		}
		closeBtn.title = this.wiki.getTiddlerText(
			"$:/plugins/tiddlywiki/prosemirror/language/Buttons/Close", "Close");
		closeBtn.addEventListener("click", (e) => { e.preventDefault(); this.close(); });

		searchRow.appendChild(searchInput);
		searchRow.appendChild(countLabel);
		searchRow.appendChild(prevBtn);
		searchRow.appendChild(nextBtn);
		searchRow.appendChild(caseSensitiveBtn);
		searchRow.appendChild(closeBtn);

		// Replace row
		const replaceRow = document.createElement("div");
		replaceRow.className = "tc-prosemirror-find-replace-row";

		const replaceInput = document.createElement("input");
		replaceInput.type = "text";
		replaceInput.className = "tc-prosemirror-replace-input";
		replaceInput.placeholder = this.wiki.getTiddlerText(
			"$:/plugins/tiddlywiki/prosemirror/language/FindReplace/ReplacePlaceholder", "Replace...");
		replaceInput.addEventListener("keydown", (e) => {
			if(e.key === "Enter") { e.preventDefault(); this.replaceOne(); }
			if(e.key === "Escape") { e.preventDefault(); this.close(); }
		});
		this.replaceInput = replaceInput;

		const replaceBtn = document.createElement("button");
		replaceBtn.type = "button";
		replaceBtn.className = "tc-prosemirror-find-btn";
		replaceBtn.textContent = this.wiki.getTiddlerText(
			"$:/plugins/tiddlywiki/prosemirror/language/FindReplace/Replace", "Replace");
		replaceBtn.addEventListener("click", (e) => { e.preventDefault(); this.replaceOne(); });

		const replaceAllBtn = document.createElement("button");
		replaceAllBtn.type = "button";
		replaceAllBtn.className = "tc-prosemirror-find-btn";
		replaceAllBtn.textContent = this.wiki.getTiddlerText(
			"$:/plugins/tiddlywiki/prosemirror/language/FindReplace/ReplaceAll", "Replace All");
		replaceAllBtn.addEventListener("click", (e) => { e.preventDefault(); this.replaceAll(); });

		replaceRow.appendChild(replaceInput);
		replaceRow.appendChild(replaceBtn);
		replaceRow.appendChild(replaceAllBtn);

		panel.appendChild(searchRow);
		panel.appendChild(replaceRow);

		this.panel = panel;
		return panel;
	}

	update(view) {
		const state = FIND_REPLACE_KEY.getState(view.state);
		if(!this.panel) {
			const panel = this.buildPanel();
			const editorParent = view.dom.parentNode;
			if(editorParent) {
				editorParent.insertBefore(panel, view.dom);
			}
		}

		if(state.active) {
			const wasHidden = this.panel.style.display === "none";
			this.panel.style.display = "block";
			if(wasHidden) {
				this.searchInput.focus();
				this.searchInput.select();
			}
			if(state.matches.length > 0) {
				this.countLabel.textContent = (state.currentIndex + 1) + "/" + state.matches.length;
			} else if(state.searchTerm) {
				this.countLabel.textContent = "0/0";
			} else {
				this.countLabel.textContent = "";
			}
			if(state.currentIndex >= 0 && state.matches[state.currentIndex]) {
				const match = state.matches[state.currentIndex];
				try {
					const coords = view.coordsAtPos(match.from);
					if(coords) {
						const editorRect = view.dom.getBoundingClientRect();
						if(coords.top < editorRect.top || coords.bottom > editorRect.bottom) {
							view.dispatch(view.state.tr.setSelection(
								TextSelection.create(view.state.doc, match.from, match.to)
							));
							if(view.dom.scrollIntoView) view.dom.scrollIntoView({ block: "center" });
						}
					}
				} catch(e) { /* ignore scroll errors */ }
			}
		} else {
			if(this.panel) this.panel.style.display = "none";
		}
	}

	findNext() {
		const state = FIND_REPLACE_KEY.getState(this.view.state);
		if(state.matches.length === 0) return;
		const next = (state.currentIndex + 1) % state.matches.length;
		this.view.dispatch(this.view.state.tr.setMeta(FIND_REPLACE_KEY, { currentIndex: next }));
	}

	findPrev() {
		const state = FIND_REPLACE_KEY.getState(this.view.state);
		if(state.matches.length === 0) return;
		const prev = (state.currentIndex - 1 + state.matches.length) % state.matches.length;
		this.view.dispatch(this.view.state.tr.setMeta(FIND_REPLACE_KEY, { currentIndex: prev }));
	}

	replaceOne() {
		const state = FIND_REPLACE_KEY.getState(this.view.state);
		if(state.currentIndex < 0 || !state.matches[state.currentIndex]) return;
		const match = state.matches[state.currentIndex];
		const replaceTerm = this.replaceInput.value;
		let tr;
		if(replaceTerm) {
			tr = this.view.state.tr.replaceWith(match.from, match.to,
				this.view.state.schema.text(replaceTerm));
		} else {
			tr = this.view.state.tr.delete(match.from, match.to);
		}
		tr.setMeta(FIND_REPLACE_KEY, { searchTerm: state.searchTerm });
		this.view.dispatch(tr);
	}

	replaceAll() {
		const state = FIND_REPLACE_KEY.getState(this.view.state);
		if(state.matches.length === 0) return;
		const replaceTerm = this.replaceInput.value;
		const schema = this.view.state.schema;
		// Apply replacements from end to start to avoid position remapping issues
		let tr = this.view.state.tr;
		const sortedMatches = state.matches.slice().sort((a, b) => b.from - a.from);
		for(const m of sortedMatches) {
			const mappedFrom = tr.mapping.map(m.from);
			const mappedTo = tr.mapping.map(m.to);
			if(replaceTerm) {
				tr.replaceWith(mappedFrom, mappedTo, schema.text(replaceTerm));
			} else {
				tr.delete(mappedFrom, mappedTo);
			}
		}
		tr.setMeta(FIND_REPLACE_KEY, { searchTerm: state.searchTerm });
		this.view.dispatch(tr);
	}

	close() {
		this.view.dispatch(this.view.state.tr.setMeta(FIND_REPLACE_KEY, { active: false }));
		this.view.focus();
	}

	destroy() {
		if(this.panel && this.panel.parentNode) {
			this.panel.parentNode.removeChild(this.panel);
		}
	}
}

exports.createFindReplacePlugin = createFindReplacePlugin;
exports.FIND_REPLACE_KEY = FIND_REPLACE_KEY;
