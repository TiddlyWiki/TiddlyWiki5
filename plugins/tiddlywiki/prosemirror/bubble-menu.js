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
class BubbleMenu {
	constructor(view, schema) {
		this.view = view;
		this.schema = schema;
		this._destroyed = false;
		this._buttons = [];

		// Build the toolbar DOM
		this.el = document.createElement("div");
		this.el.className = "tc-prosemirror-bubble-menu";
		this.el.setAttribute("role", "toolbar");
		this.el.setAttribute("aria-label", "Formatting");
		this.el.style.display = "none";
		document.body.appendChild(this.el);

		this._buildButtons();

		// Prevent mousedown from stealing focus from the editor
		this.el.addEventListener("mousedown", (e) => e.preventDefault());
	}

	_buildButtons() {
		const { schema } = this;
		const items = [];

		if(schema.marks.strong) items.push({ mark: "strong", icon: "$:/core/images/bold", title: "Bold", cmd: toggleMark(schema.marks.strong) });
		if(schema.marks.em) items.push({ mark: "em", icon: "$:/core/images/italic", title: "Italic", cmd: toggleMark(schema.marks.em) });
		if(schema.marks.underline) items.push({ mark: "underline", icon: "$:/core/images/underline", title: "Underline", cmd: toggleMark(schema.marks.underline) });
		if(schema.marks.strike) items.push({ mark: "strike", icon: "$:/core/images/strikethrough", title: "Strikethrough", cmd: toggleMark(schema.marks.strike) });
		if(schema.marks.code) items.push({ mark: "code", icon: "$:/core/images/mono-line", title: "Code", cmd: toggleMark(schema.marks.code) });
		if(schema.marks.link) items.push({ mark: "link", icon: "$:/core/images/link", title: "Link", cmd: null, isLink: true });

		for(const item of items) {
			const btn = document.createElement("button");
			btn.type = "button";
			btn.className = "tc-prosemirror-bubble-btn";
			btn.title = item.title;
			btn.setAttribute("data-mark", item.mark);

			const svgEl = this._renderSvgIcon(item.icon, "16px");
			if(svgEl) {
				btn.appendChild(svgEl);
			} else {
				btn.textContent = item.title.charAt(0);
			}

			btn.addEventListener("click", (e) => {
				e.preventDefault();
				e.stopPropagation();
				if(item.isLink) {
					this._toggleLink();
				} else if(item.cmd) {
					item.cmd(this.view.state, this.view.dispatch);
					this.view.focus();
					this.update(this.view);
				}
			});

			this.el.appendChild(btn);
			this._buttons.push({ el: btn, mark: item.mark });
		}
	}

	_renderSvgIcon(tiddlerTitle, size = "16px") {
		try {
			const htmlStr = $tw.wiki.renderTiddler("text/html", tiddlerTitle, { variables: { size } });
			if(!htmlStr) return null;
			const container = document.createElement("div");
			container.innerHTML = htmlStr;
			return container.querySelector("svg");
		} catch(e) {
			return null;
		}
	}

	_toggleLink() {
		const { state, schema } = { state: this.view.state, schema: this.schema };
		if(!schema.marks.link) return;

		const { from, to } = state.selection;
		const linkMark = schema.marks.link.isInSet(state.selection.$from.marks());

		if(linkMark) {
			this.view.dispatch(state.tr.removeMark(from, to, schema.marks.link));
			this.view.focus();
		} else {
			const { TextField, openPrompt } = require("$:/plugins/tiddlywiki/prosemirror/setup/prompt.js");
			const view = this.view;
			openPrompt({
				title: $tw.wiki.getTiddlerText("$:/plugins/tiddlywiki/prosemirror/language/Menu/CreateLink", "Create a link"),
				fields: {
					href: new TextField({
						label: $tw.wiki.getTiddlerText("$:/plugins/tiddlywiki/prosemirror/language/Menu/LinkTarget", "Link target"),
						required: true
					})
				},
				callback(attrs) {
					toggleMark(schema.marks.link, { href: attrs.href, title: attrs.href })(view.state, view.dispatch);
					view.focus();
				}
			});
		}
	}

	/** Called by ProseMirror view on every update to reposition/show/hide. */
	update(view) {
		if(this._destroyed) return;
		this.view = view;
		const { state } = view;
		const sel = state.selection;

		if(sel.empty || sel.$from.pos === sel.$to.pos || sel.$from.parent.type.spec.code) {
			this.el.style.display = "none";
			return;
		}

		this._updateActiveStates(state);

		const start = view.coordsAtPos(sel.from);
		const end = view.coordsAtPos(sel.to);
		const top = Math.min(start.top, end.top);
		const left = (start.left + end.left) / 2;

		this.el.style.display = "flex";
		const menuRect = this.el.getBoundingClientRect();
		this.el.style.position = "absolute";
		this.el.style.left = Math.max(4, left - menuRect.width / 2 + window.scrollX) + "px";
		this.el.style.top = Math.max(4, top - menuRect.height - 8 + window.scrollY) + "px";
		this.el.style.zIndex = "1001";
	}

	_updateActiveStates(state) {
		for(const btn of this._buttons) {
			const markType = this.schema.marks[btn.mark];
			if(!markType) continue;
			btn.el.classList.toggle("tc-prosemirror-bubble-btn-active", this._isMarkActive(state, markType));
		}
	}

	_isMarkActive(state, markType) {
		const { from, $from, to, empty } = state.selection;
		if(empty) return !!markType.isInSet(state.storedMarks || $from.marks());
		return state.doc.rangeHasMark(from, to, markType);
	}

	destroy() {
		this._destroyed = true;
		if(this.el && this.el.parentNode) {
			this.el.parentNode.removeChild(this.el);
		}
	}
}

exports.BubbleMenu = BubbleMenu;
