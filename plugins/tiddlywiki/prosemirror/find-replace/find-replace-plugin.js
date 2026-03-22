/*\
title: $:/plugins/tiddlywiki/prosemirror/find-replace/find-replace-plugin.js
type: application/javascript
module-type: library

ProseMirror Find & Replace plugin.

\*/

"use strict";

var Plugin = require("prosemirror-state").Plugin;
var PluginKey = require("prosemirror-state").PluginKey;
var Decoration = require("prosemirror-view").Decoration;
var DecorationSet = require("prosemirror-view").DecorationSet;
var TextSelection = require("prosemirror-state").TextSelection;

var FIND_REPLACE_KEY = new PluginKey("tw-find-replace");

/**
 * Get SVG icon from a TW image tiddler.
 * Uses TW's rendering pipeline so wikitext macros (<<size>> etc.) are resolved.
 * Returns a sanitized SVG DOM element or null.
 */
function getSvgIcon(tiddlerTitle, size) {
	size = size || "1em";
	try {
		var htmlStr = $tw.wiki.renderTiddler("text/html", tiddlerTitle, {
			variables: { size: size }
		});
		if(!htmlStr) return null;
		var container = document.createElement("div");
		container.innerHTML = htmlStr;
		var svgEl = container.querySelector("svg");
		if(svgEl) return svgEl;
	} catch(e) { /* ignore */ }
	return null;
}

/**
 * Find all occurrences of a search term in the document.
 * Returns array of { from, to } positions.
 */
function findMatches(doc, searchTerm, caseSensitive) {
	if(!searchTerm) return [];
	var results = [];
	var search = caseSensitive ? searchTerm : searchTerm.toLowerCase();

	doc.descendants(function(node, pos) {
		if(node.isText) {
			var text = caseSensitive ? node.text : node.text.toLowerCase();
			var idx = 0;
			while(idx < text.length) {
				var found = text.indexOf(search, idx);
				if(found < 0) break;
				results.push({ from: pos + found, to: pos + found + searchTerm.length });
				idx = found + 1;
			}
		}
	});
	return results;
}

/**
 * Create decorations for all search matches.
 */
function createDecorations(doc, matches, currentIndex) {
	var decorations = [];
	for(var i = 0; i < matches.length; i++) {
		var match = matches[i];
		var cls = i === currentIndex ? "tc-prosemirror-find-current" : "tc-prosemirror-find-match";
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
				var meta = tr.getMeta(FIND_REPLACE_KEY);
				if(meta) {
					// Recalculate matches if search changed
					if(meta.searchTerm !== undefined || meta.caseSensitive !== undefined) {
						var term = meta.searchTerm !== undefined ? meta.searchTerm : prev.searchTerm;
						var cs = meta.caseSensitive !== undefined ? meta.caseSensitive : prev.caseSensitive;
						var matches = findMatches(newState.doc, term, cs);
						var curIdx = matches.length > 0 ? 0 : -1;
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
					var state = Object.assign({}, prev);
					if(meta.active !== undefined) state.active = meta.active;
					if(meta.currentIndex !== undefined) state.currentIndex = meta.currentIndex;
					if(meta.replaceTerm !== undefined) state.replaceTerm = meta.replaceTerm;
					state.decorations = createDecorations(newState.doc, state.matches, state.currentIndex);
					if(!state.active) state.decorations = DecorationSet.empty;
					return state;
				}
				// On doc change, remap decorations
				if(tr.docChanged && prev.active && prev.searchTerm) {
					var matches = findMatches(newState.doc, prev.searchTerm, prev.caseSensitive);
					var curIdx = Math.min(prev.currentIndex, matches.length - 1);
					if(curIdx < 0 && matches.length > 0) curIdx = 0;
					return Object.assign({}, prev, {
						matches: matches,
						currentIndex: curIdx,
						decorations: createDecorations(newState.doc, matches, curIdx)
					});
				}
				return prev;
			}
		},
		props: {
			decorations: function(state) {
				return FIND_REPLACE_KEY.getState(state).decorations;
			},
			handleKeyDown: function(view, event) {
				// Ctrl+F / Cmd+F to open find
				if((event.ctrlKey || event.metaKey) && event.key === "f") {
					event.preventDefault();
					var st = FIND_REPLACE_KEY.getState(view.state);
					view.dispatch(view.state.tr.setMeta(FIND_REPLACE_KEY, {
						active: true,
						searchTerm: st.searchTerm
					}));
					return true;
				}
				// Ctrl+H / Cmd+H to open find+replace
				if((event.ctrlKey || event.metaKey) && event.key === "h") {
					event.preventDefault();
					var st = FIND_REPLACE_KEY.getState(view.state);
					view.dispatch(view.state.tr.setMeta(FIND_REPLACE_KEY, {
						active: true,
						searchTerm: st.searchTerm
					}));
					return true;
				}
				// Escape to close
				if(event.key === "Escape") {
					var st = FIND_REPLACE_KEY.getState(view.state);
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

/**
 * Find & Replace UI panel.
 */
function FindReplaceView(editorView, wiki) {
	this.view = editorView;
	this.wiki = wiki;
	this.panel = null;
	this.searchInput = null;
	this.replaceInput = null;
}

FindReplaceView.prototype.buildPanel = function() {
	var self = this;
	var panel = document.createElement("div");
	panel.className = "tc-prosemirror-find-replace-panel";
	panel.style.display = "none";

	// Search row
	var searchRow = document.createElement("div");
	searchRow.className = "tc-prosemirror-find-replace-row";

	var searchInput = document.createElement("input");
	searchInput.type = "text";
	searchInput.className = "tc-prosemirror-find-input";
	searchInput.placeholder = this.wiki.getTiddlerText(
		"$:/plugins/tiddlywiki/prosemirror/language/FindReplace/SearchPlaceholder", "Find...");
	searchInput.addEventListener("input", function() {
		self.view.dispatch(self.view.state.tr.setMeta(FIND_REPLACE_KEY, {
			searchTerm: searchInput.value
		}));
	});
	searchInput.addEventListener("keydown", function(e) {
		if(e.key === "Enter") {
			e.preventDefault();
			if(e.shiftKey) { self.findPrev(); } else { self.findNext(); }
		}
		if(e.key === "Escape") {
			e.preventDefault();
			self.close();
		}
	});
	this.searchInput = searchInput;

	var countLabel = document.createElement("span");
	countLabel.className = "tc-prosemirror-find-count";
	this.countLabel = countLabel;

	var prevBtn = document.createElement("button");
	prevBtn.type = "button";
	prevBtn.className = "tc-prosemirror-find-btn";
	prevBtn.textContent = "▲";
	prevBtn.title = this.wiki.getTiddlerText(
		"$:/plugins/tiddlywiki/prosemirror/language/FindReplace/Previous", "Previous");
	prevBtn.addEventListener("click", function(e) { e.preventDefault(); self.findPrev(); });

	var nextBtn = document.createElement("button");
	nextBtn.type = "button";
	nextBtn.className = "tc-prosemirror-find-btn";
	nextBtn.textContent = "▼";
	nextBtn.title = this.wiki.getTiddlerText(
		"$:/plugins/tiddlywiki/prosemirror/language/FindReplace/Next", "Next");
	nextBtn.addEventListener("click", function(e) { e.preventDefault(); self.findNext(); });

	var caseSensitiveBtn = document.createElement("button");
	caseSensitiveBtn.type = "button";
	caseSensitiveBtn.className = "tc-prosemirror-find-btn tc-prosemirror-find-case-btn";
	caseSensitiveBtn.textContent = "Aa";
	caseSensitiveBtn.title = this.wiki.getTiddlerText(
		"$:/plugins/tiddlywiki/prosemirror/language/FindReplace/CaseSensitive", "Case sensitive");
	caseSensitiveBtn.addEventListener("click", function(e) {
		e.preventDefault();
		var st = FIND_REPLACE_KEY.getState(self.view.state);
		self.view.dispatch(self.view.state.tr.setMeta(FIND_REPLACE_KEY, {
			caseSensitive: !st.caseSensitive,
			searchTerm: st.searchTerm
		}));
		caseSensitiveBtn.classList.toggle("active", !st.caseSensitive);
	});
	this.caseSensitiveBtn = caseSensitiveBtn;

	var closeBtn = document.createElement("button");
	closeBtn.type = "button";
	closeBtn.className = "tc-prosemirror-find-btn tc-prosemirror-find-close-btn";
	var closeSvg = getSvgIcon("$:/core/images/close-button", "1em");
	if(closeSvg) {
		closeBtn.appendChild(document.importNode(closeSvg, true));
	} else {
		closeBtn.textContent = "\u00D7";
	}
	closeBtn.title = this.wiki.getTiddlerText(
		"$:/plugins/tiddlywiki/prosemirror/language/Buttons/Close", "Close");
	closeBtn.addEventListener("click", function(e) { e.preventDefault(); self.close(); });

	searchRow.appendChild(searchInput);
	searchRow.appendChild(countLabel);
	searchRow.appendChild(prevBtn);
	searchRow.appendChild(nextBtn);
	searchRow.appendChild(caseSensitiveBtn);
	searchRow.appendChild(closeBtn);

	// Replace row
	var replaceRow = document.createElement("div");
	replaceRow.className = "tc-prosemirror-find-replace-row";

	var replaceInput = document.createElement("input");
	replaceInput.type = "text";
	replaceInput.className = "tc-prosemirror-replace-input";
	replaceInput.placeholder = this.wiki.getTiddlerText(
		"$:/plugins/tiddlywiki/prosemirror/language/FindReplace/ReplacePlaceholder", "Replace...");
	replaceInput.addEventListener("keydown", function(e) {
		if(e.key === "Enter") {
			e.preventDefault();
			self.replaceOne();
		}
		if(e.key === "Escape") {
			e.preventDefault();
			self.close();
		}
	});
	this.replaceInput = replaceInput;

	var replaceBtn = document.createElement("button");
	replaceBtn.type = "button";
	replaceBtn.className = "tc-prosemirror-find-btn";
	replaceBtn.textContent = this.wiki.getTiddlerText(
		"$:/plugins/tiddlywiki/prosemirror/language/FindReplace/Replace", "Replace");
	replaceBtn.addEventListener("click", function(e) { e.preventDefault(); self.replaceOne(); });

	var replaceAllBtn = document.createElement("button");
	replaceAllBtn.type = "button";
	replaceAllBtn.className = "tc-prosemirror-find-btn";
	replaceAllBtn.textContent = this.wiki.getTiddlerText(
		"$:/plugins/tiddlywiki/prosemirror/language/FindReplace/ReplaceAll", "Replace All");
	replaceAllBtn.addEventListener("click", function(e) { e.preventDefault(); self.replaceAll(); });

	replaceRow.appendChild(replaceInput);
	replaceRow.appendChild(replaceBtn);
	replaceRow.appendChild(replaceAllBtn);

	panel.appendChild(searchRow);
	panel.appendChild(replaceRow);

	this.panel = panel;
	return panel;
};

FindReplaceView.prototype.update = function(view) {
	var state = FIND_REPLACE_KEY.getState(view.state);
	if(!this.panel) {
		var panel = this.buildPanel();
		// Insert panel before the ProseMirror editor DOM
		var editorParent = view.dom.parentNode;
		if(editorParent) {
			editorParent.insertBefore(panel, view.dom);
		}
	}

	if(state.active) {
		var wasHidden = this.panel.style.display === "none";
		this.panel.style.display = "block";
		// Focus search input only when first opened (not on every update)
		if(wasHidden) {
			this.searchInput.focus();
			this.searchInput.select();
		}
		// Update count label
		if(state.matches.length > 0) {
			this.countLabel.textContent = (state.currentIndex + 1) + "/" + state.matches.length;
		} else if(state.searchTerm) {
			this.countLabel.textContent = "0/0";
		} else {
			this.countLabel.textContent = "";
		}
		// Scroll to current match
		if(state.currentIndex >= 0 && state.matches[state.currentIndex]) {
			var match = state.matches[state.currentIndex];
			try {
				var coords = view.coordsAtPos(match.from);
				if(coords) {
					var editorRect = view.dom.getBoundingClientRect();
					if(coords.top < editorRect.top || coords.bottom > editorRect.bottom) {
						view.dispatch(view.state.tr.setSelection(
							TextSelection.create(view.state.doc, match.from, match.to)
						));
						view.dom.scrollIntoView && view.dom.scrollIntoView({ block: "center" });
					}
				}
			} catch(e) { /* ignore scroll errors */ }
		}
	} else {
		if(this.panel) this.panel.style.display = "none";
	}
};

FindReplaceView.prototype.findNext = function() {
	var state = FIND_REPLACE_KEY.getState(this.view.state);
	if(state.matches.length === 0) return;
	var next = (state.currentIndex + 1) % state.matches.length;
	this.view.dispatch(this.view.state.tr.setMeta(FIND_REPLACE_KEY, { currentIndex: next }));
};

FindReplaceView.prototype.findPrev = function() {
	var state = FIND_REPLACE_KEY.getState(this.view.state);
	if(state.matches.length === 0) return;
	var prev = (state.currentIndex - 1 + state.matches.length) % state.matches.length;
	this.view.dispatch(this.view.state.tr.setMeta(FIND_REPLACE_KEY, { currentIndex: prev }));
};

FindReplaceView.prototype.replaceOne = function() {
	var state = FIND_REPLACE_KEY.getState(this.view.state);
	if(state.currentIndex < 0 || !state.matches[state.currentIndex]) return;
	var match = state.matches[state.currentIndex];
	var replaceTerm = this.replaceInput.value;
	var tr;
	if(replaceTerm) {
		tr = this.view.state.tr.replaceWith(match.from, match.to,
			this.view.state.schema.text(replaceTerm));
	} else {
		tr = this.view.state.tr.delete(match.from, match.to);
	}
	tr.setMeta(FIND_REPLACE_KEY, { searchTerm: state.searchTerm });
	this.view.dispatch(tr);
};

FindReplaceView.prototype.replaceAll = function() {
	var state = FIND_REPLACE_KEY.getState(this.view.state);
	if(state.matches.length === 0) return;
	var replaceTerm = this.replaceInput.value;
	var schema = this.view.state.schema;
	// Apply replacements from end to start to avoid position remapping issues
	var tr = this.view.state.tr;
	var sortedMatches = state.matches.slice().sort(function(a, b) { return b.from - a.from; });
	for(var i = 0; i < sortedMatches.length; i++) {
		var mappedFrom = tr.mapping.map(sortedMatches[i].from);
		var mappedTo = tr.mapping.map(sortedMatches[i].to);
		if(replaceTerm) {
			tr.replaceWith(mappedFrom, mappedTo, schema.text(replaceTerm));
		} else {
			tr.delete(mappedFrom, mappedTo);
		}
	}
	tr.setMeta(FIND_REPLACE_KEY, { searchTerm: state.searchTerm });
	this.view.dispatch(tr);
};

FindReplaceView.prototype.close = function() {
	this.view.dispatch(this.view.state.tr.setMeta(FIND_REPLACE_KEY, { active: false }));
	this.view.focus();
};

FindReplaceView.prototype.destroy = function() {
	if(this.panel && this.panel.parentNode) {
		this.panel.parentNode.removeChild(this.panel);
	}
};

exports.createFindReplacePlugin = createFindReplacePlugin;
exports.FIND_REPLACE_KEY = FIND_REPLACE_KEY;
