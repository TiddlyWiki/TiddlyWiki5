/*\
title: $:/plugins/tiddlywiki/prosemirror/bubble-menu.js
type: application/javascript
module-type: library

Floating toolbar that appears above text selection for inline formatting.

\*/

"use strict";

const toggleMark = require("prosemirror-commands").toggleMark;

/**
 * BubbleMenu — appears when there is a non-empty text selection.
 * Provides quick access to inline formatting (bold, italic, etc.)
 */
function BubbleMenu(view, schema) {
	this.view = view;
	this.schema = schema;
	this._destroyed = false;

	// Build the toolbar DOM
	this.el = document.createElement("div");
	this.el.className = "tc-prosemirror-bubble-menu";
	this.el.setAttribute("role", "toolbar");
	this.el.setAttribute("aria-label", "Formatting");
	this.el.style.display = "none";
	document.body.appendChild(this.el);

	this._buttons = [];
	this._buildButtons();

	// Prevent mousedown from stealing focus from the editor
	this.el.addEventListener("mousedown", function(e) {
		e.preventDefault();
	});
}

BubbleMenu.prototype._buildButtons = function() {
	const self = this;
	const schema = this.schema;
	const items = [];

	if(schema.marks.strong) {
		items.push({ mark: "strong", icon: "$:/core/images/bold", title: "Bold", cmd: toggleMark(schema.marks.strong) });
	}
	if(schema.marks.em) {
		items.push({ mark: "em", icon: "$:/core/images/italic", title: "Italic", cmd: toggleMark(schema.marks.em) });
	}
	if(schema.marks.underline) {
		items.push({ mark: "underline", icon: "$:/core/images/underline", title: "Underline", cmd: toggleMark(schema.marks.underline) });
	}
	if(schema.marks.strike) {
		items.push({ mark: "strike", icon: "$:/core/images/strikethrough", title: "Strikethrough", cmd: toggleMark(schema.marks.strike) });
	}
	if(schema.marks.code) {
		items.push({ mark: "code", icon: "$:/core/images/mono-line", title: "Code", cmd: toggleMark(schema.marks.code) });
	}
	if(schema.marks.link) {
		items.push({ mark: "link", icon: "$:/core/images/link", title: "Link", cmd: null, isLink: true });
	}

	for(let i = 0; i < items.length; i++) {
		const item = items[i];
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = "tc-prosemirror-bubble-btn";
		btn.title = item.title;
		btn.setAttribute("data-mark", item.mark);

		// Render icon from tiddler (SVG)
		const svgEl = this._renderSvgIcon(item.icon, "16px");
		if(svgEl) {
			btn.appendChild(svgEl);
		} else {
			btn.textContent = item.title.charAt(0);
		}

		btn.addEventListener("click", function(e) {
			e.preventDefault();
			e.stopPropagation();
			if(item.isLink) {
				self._toggleLink();
			} else if(item.cmd) {
				item.cmd(self.view.state, self.view.dispatch);
				self.view.focus();
				self.update(self.view);
			}
		});

		this.el.appendChild(btn);
		this._buttons.push({ el: btn, mark: item.mark });
	}
};

BubbleMenu.prototype._renderSvgIcon = function(tiddlerTitle, size) {
	try {
		const tiddler = $tw.wiki.getTiddler(tiddlerTitle);
		if(!tiddler) return null;
		const text = tiddler.fields.text;
		const svgMatch = text.match(/<svg[\s\S]*<\/svg>/);
		if(!svgMatch) return null;
		const svgString = svgMatch[0].replace(/<<size>>/g, size || "16px");
		const parser = new DOMParser();
		const doc = parser.parseFromString(svgString, "image/svg+xml");
		const svgEl = doc.querySelector("svg");
		if(!svgEl) return null;
		svgEl.setAttribute("width", size || "16px");
		svgEl.setAttribute("height", size || "16px");
		return document.importNode(svgEl, true);
	} catch(e) {
		return null;
	}
};

BubbleMenu.prototype._toggleLink = function() {
	const state = this.view.state;
	const schema = this.schema;
	if(!schema.marks.link) return;

	// Check if link is already active
	const { from, to } = state.selection;
	const $from = state.selection.$from;
	const linkMark = schema.marks.link.isInSet($from.marks());

	if(linkMark) {
		// Remove link
		this.view.dispatch(state.tr.removeMark(from, to, schema.marks.link));
		this.view.focus();
	} else {
		// Prompt for URL
		const TextField = require("$:/plugins/tiddlywiki/prosemirror/setup/prompt.js").TextField;
		const openPrompt = require("$:/plugins/tiddlywiki/prosemirror/setup/prompt.js").openPrompt;
		const view = this.view;
		openPrompt({
			title: $tw.wiki.getTiddlerText("$:/plugins/tiddlywiki/prosemirror/language/Menu/CreateLink", "Create a link"),
			fields: {
				href: new TextField({
					label: $tw.wiki.getTiddlerText("$:/plugins/tiddlywiki/prosemirror/language/Menu/LinkTarget", "Link target"),
					required: true
				})
			},
			callback: function(attrs) {
				toggleMark(schema.marks.link, { href: attrs.href, title: attrs.href })(view.state, view.dispatch);
				view.focus();
			}
		});
	}
};

/**
 * Called by ProseMirror view on every update to reposition/show/hide.
 */
BubbleMenu.prototype.update = function(view) {
	if(this._destroyed) return;
	this.view = view;
	const state = view.state;
	const sel = state.selection;

	// Only show for non-empty text selections (not node selections)
	if(sel.empty || sel.$from.pos === sel.$to.pos) {
		this.el.style.display = "none";
		return;
	}

	// Don't show inside code blocks
	if(sel.$from.parent.type.spec.code) {
		this.el.style.display = "none";
		return;
	}

	// Update button active states
	this._updateActiveStates(state);

	// Position above selection
	const start = view.coordsAtPos(sel.from);
	const end = view.coordsAtPos(sel.to);
	const top = Math.min(start.top, end.top);
	const left = (start.left + end.left) / 2;

	// Measure menu width for centering
	this.el.style.display = "flex";
	const menuRect = this.el.getBoundingClientRect();
	const menuLeft = Math.max(4, left - menuRect.width / 2);
	const menuTop = top - menuRect.height - 8 + window.scrollY;

	this.el.style.position = "absolute";
	this.el.style.left = menuLeft + "px";
	this.el.style.top = Math.max(4, menuTop) + "px";
	this.el.style.zIndex = "1001";
};

BubbleMenu.prototype._updateActiveStates = function(state) {
	const marks = this.schema.marks;
	for(let i = 0; i < this._buttons.length; i++) {
		const btn = this._buttons[i];
		const markType = marks[btn.mark];
		if(!markType) continue;
		const isActive = this._isMarkActive(state, markType);
		if(isActive) {
			btn.el.classList.add("tc-prosemirror-bubble-btn-active");
		} else {
			btn.el.classList.remove("tc-prosemirror-bubble-btn-active");
		}
	}
};

BubbleMenu.prototype._isMarkActive = function(state, markType) {
	const { from, $from, to, empty } = state.selection;
	if(empty) {
		return !!markType.isInSet(state.storedMarks || $from.marks());
	}
	return state.doc.rangeHasMark(from, to, markType);
};

BubbleMenu.prototype.destroy = function() {
	this._destroyed = true;
	if(this.el && this.el.parentNode) {
		this.el.parentNode.removeChild(this.el);
	}
};

exports.BubbleMenu = BubbleMenu;
