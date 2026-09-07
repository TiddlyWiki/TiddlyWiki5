/*\
title: $:/plugins/tiddlywiki/prosemirror/features/link-tooltip.js
type: application/javascript
module-type: library

Floating link tooltip that appears when the cursor is inside a link mark.
Shows the link target and provides edit/open/unlink buttons.

\*/

"use strict";

const { Plugin, PluginKey } = require("prosemirror-state");

const linkTooltipKey = new PluginKey("linkTooltip");

function getLinkAtPos(state) {
	const linkType = state.schema.marks.link;
	if(!linkType) return null;
	const { selection } = state;
	if(!selection.empty) return null;
	const $pos = selection.$from;
	const marks = $pos.marks();
	const linkMark = marks.find((m) => m.type === linkType);
	if(!linkMark) return null;
	// Scan the parent node's children to find the extent of this link mark
	const parentStart = $pos.start();
	let linkFrom = null, linkTo = null;
	$pos.parent.forEach((child, childOffset) => {
		const childFrom = parentStart + childOffset;
		const childTo = childFrom + child.nodeSize;
		if(child.isText && child.marks.some((m) => m.type === linkType && m.attrs.href === linkMark.attrs.href)) {
			if(childFrom <= $pos.pos && $pos.pos <= childTo) {
				linkFrom = childFrom;
				linkTo = childTo;
			} else if(linkFrom !== null && childFrom === linkTo) {
				linkTo = childTo;
			}
		}
	});
	if(linkFrom === null) return null;
	return { mark: linkMark, from: linkFrom, to: linkTo };
}

function getSvgIcon(tiddlerTitle, size) {
	size = size || "1em";
	try {
		const htmlStr = $tw.wiki.renderTiddler("text/html", tiddlerTitle, {
			variables: { size }
		});
		if(!htmlStr) return null;
		const container = document.createElement("div");
		container.innerHTML = htmlStr;
		return container.querySelector("svg") || null;
	} catch(e) {
		return null;
	}
}

function setButtonIcon(button, tiddlerTitle, fallbackText) {
	const svg = getSvgIcon(tiddlerTitle);
	if(svg) {
		button.innerHTML = "";
		button.appendChild(document.importNode(svg, true));
	} else {
		button.textContent = fallbackText || "•";
	}
}

class LinkTooltip {
	constructor(view, parentWidget) {
		this.view = view;
		this.parentWidget = parentWidget;
		this._destroyed = false;
		this._editing = false;
		this._currentLink = null;
		this._idSuffix = Math.random().toString(36).substr(2, 5);

		this.el = document.createElement("div");
		this.el.className = "tc-prosemirror-link-tooltip";
		this.el.style.display = "none";
		this.el.setAttribute("contenteditable", "false");
		document.body.appendChild(this.el);

		this._linkClickHandler = (event) => {
			// Capture clicks on links inside the editor so we can edit them
			// instead of letting the browser/TiddlyWiki navigate away.
			const target = event.target;
			let linkEl = null;
			if(target && target.closest) {
				linkEl = target.closest("a[data-tw-href]");
			} else if(target && target.parentNode && target.parentNode.closest) {
				linkEl = target.parentNode.closest("a[data-tw-href]");
			}
			if(!linkEl) {
				return;
			}
			const href = linkEl.getAttribute("data-tw-href") || "";
			if(event.ctrlKey || event.metaKey) {
				// Ctrl/Cmd+click navigates to the link target.
				if(/^(?:https?|ftp|mailto):/i.test(href)) {
					window.open(href, "_blank", "noopener,noreferrer");
				} else {
					this._navigateToTiddler(href);
				}
				event.preventDefault();
				event.stopPropagation();
				return;
			}
			// A plain click stays in the editor so the user can place the cursor
			// and edit the link text directly; the tooltip will show because the
			// selection is now inside the link.
			event.preventDefault();
			event.stopPropagation();
		};
		this.view.dom.addEventListener("click", this._linkClickHandler, true);

		this.el.addEventListener("mousedown", (e) => {
			// Allow inputs, labels and buttons inside the tooltip to receive their
			// default browser behaviour; otherwise prevent the editor from stealing focus.
			const tag = e.target.tagName;
			if(tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "LABEL" && tag !== "BUTTON") {
				e.preventDefault();
			}
			e.stopPropagation();
		});

		this._buildViewMode();
	}

	_buildViewMode() {
		this.el.innerHTML = "";
		this._editing = false;

		const linkDisplay = document.createElement("div");
		linkDisplay.className = "tc-prosemirror-link-tooltip-display";

		this._linkText = document.createElement("a");
		this._linkText.className = "tc-prosemirror-link-tooltip-href tc-tiddlylink";
		linkDisplay.appendChild(this._linkText);

		const btnGroup = document.createElement("span");
		btnGroup.className = "tc-prosemirror-link-tooltip-buttons";

		const editBtn = document.createElement("button");
		editBtn.type = "button";
		editBtn.className = "tc-prosemirror-link-tooltip-btn";
		editBtn.title = "Edit link";
		setButtonIcon(editBtn, "$:/core/images/edit-button", "E");
		editBtn.addEventListener("click", (e) => {
			e.preventDefault();
			this._enterEditMode();
		});
		btnGroup.appendChild(editBtn);

		const openBtn = document.createElement("button");
		openBtn.type = "button";
		openBtn.className = "tc-prosemirror-link-tooltip-btn";
		openBtn.title = "Open link";
		setButtonIcon(openBtn, "$:/core/images/open-window", "\u2197");
		openBtn.addEventListener("click", (e) => {
			e.preventDefault();
			if(!this._currentLink) return;
			const href = this._currentLink.mark.attrs.href || "";
			if(/^(?:https?|ftp|mailto):/i.test(href)) {
				// Check if this is actually an internal link to the same TW instance
				const base = window.location.origin + window.location.pathname;
				if(href.startsWith(base + "#") || href.startsWith(base + "/#")) {
					// Internal wiki link stored as full URL — extract tiddler name
					const hashIdx = href.indexOf("#");
					const tiddler = decodeURIComponent(href.substring(hashIdx + 1));
					this._navigateToTiddler(tiddler);
				} else {
					window.open(href, "_blank", "noopener,noreferrer");
				}
			} else {
				// Internal wiki link — dispatch through the TW widget tree
				this._navigateToTiddler(href);
			}
		});
		btnGroup.appendChild(openBtn);

		const unlinkBtn = document.createElement("button");
		unlinkBtn.type = "button";
		unlinkBtn.className = "tc-prosemirror-link-tooltip-btn tc-prosemirror-link-tooltip-btn-danger";
		unlinkBtn.title = "Remove link";
		setButtonIcon(unlinkBtn, "$:/core/images/close-button", "\u00D7");
		unlinkBtn.addEventListener("click", (e) => {
			e.preventDefault();
			if(!this._currentLink) return;
			const { state } = this.view;
			this.view.dispatch(state.tr.removeMark(this._currentLink.from, this._currentLink.to, state.schema.marks.link));
			this.view.focus();
		});
		btnGroup.appendChild(unlinkBtn);

		linkDisplay.appendChild(btnGroup);
		this.el.appendChild(linkDisplay);
	}

	_navigateToTiddler(tiddlerName) {
		const widget = this.parentWidget;
		if(widget) {
			widget.dispatchEvent({
				type: "tm-navigate",
				navigateTo: tiddlerName,
				navigateFromTitle: widget.getVariable("storyTiddler")
			});
		}
	}

	_enterEditMode() {
		if(!this._currentLink) return;
		this._editing = true;
		this.el.innerHTML = "";

		const form = document.createElement("div");
		form.className = "tc-prosemirror-link-tooltip-edit";

		const targetRow = document.createElement("div");
		targetRow.className = "tc-prosemirror-link-tooltip-edit-row";
		const targetLabel = document.createElement("label");
		targetLabel.className = "tc-prosemirror-link-tooltip-edit-label";
		targetLabel.textContent = "Target";
		const targetInput = document.createElement("input");
		targetInput.id = "tw-prosemirror-link-target-" + this._idSuffix;
		targetLabel.htmlFor = targetInput.id;
		targetInput.type = "text";
		targetInput.className = "tc-prosemirror-link-tooltip-input";
		targetInput.setAttribute("data-tw-link-field", "target");
		targetInput.value = this._currentLink.mark.attrs.href || "";
		targetInput.placeholder = "Link target...";
		targetRow.appendChild(targetLabel);
		targetRow.appendChild(targetInput);
		form.appendChild(targetRow);

		const textRow = document.createElement("div");
		textRow.className = "tc-prosemirror-link-tooltip-edit-row";
		const textLabel = document.createElement("label");
		textLabel.className = "tc-prosemirror-link-tooltip-edit-label";
		textLabel.textContent = "Text";
		const textInput = document.createElement("input");
		textInput.id = "tw-prosemirror-link-text-" + this._idSuffix;
		textLabel.htmlFor = textInput.id;
		textInput.type = "text";
		textInput.className = "tc-prosemirror-link-tooltip-input";
		textInput.setAttribute("data-tw-link-field", "text");
		textInput.value = this.view.state.doc.textBetween(this._currentLink.from, this._currentLink.to) || "";
		textInput.placeholder = "Link text...";
		textRow.appendChild(textLabel);
		textRow.appendChild(textInput);
		form.appendChild(textRow);

		const btnRow = document.createElement("div");
		btnRow.className = "tc-prosemirror-link-tooltip-edit-buttons";

		const okBtn = document.createElement("button");
		okBtn.type = "button";
		okBtn.className = "tc-prosemirror-link-tooltip-btn tc-prosemirror-link-tooltip-btn-ok";
		setButtonIcon(okBtn, "$:/core/images/done-button", "\u2713");
		okBtn.title = "Confirm";
		okBtn.addEventListener("click", (e) => {
			e.preventDefault();
			this._commitEdit(targetInput.value, textInput.value);
		});
		btnRow.appendChild(okBtn);

		const cancelBtn = document.createElement("button");
		cancelBtn.type = "button";
		cancelBtn.className = "tc-prosemirror-link-tooltip-btn";
		setButtonIcon(cancelBtn, "$:/core/images/cancel-button", "\u00D7");
		cancelBtn.title = "Cancel";
		cancelBtn.addEventListener("click", (e) => {
			e.preventDefault();
			this._editing = false;
			this._buildViewMode();
			this.update(this.view);
			this.view.focus();
		});
		btnRow.appendChild(cancelBtn);

		form.appendChild(btnRow);
		this.el.appendChild(form);

		setTimeout(() => { targetInput.focus(); targetInput.select(); }, 0);

		const handleKeydown = (e) => {
			if(e.key === "Enter") {
				e.preventDefault();
				this._commitEdit(targetInput.value, textInput.value);
			} else if(e.key === "Escape") {
				e.preventDefault();
				this._editing = false;
				this._buildViewMode();
				this.update(this.view);
				this.view.focus();
			}
		};
		targetInput.addEventListener("keydown", handleKeydown);
		textInput.addEventListener("keydown", handleKeydown);
	}

	_commitEdit(newHref, newText) {
		if(!this._currentLink) return;
		const { state } = this.view;
		const linkType = state.schema.marks.link;
		const { from, to } = this._currentLink;
		const trimmedHref = (newHref || "").trim();
		const oldText = state.doc.textBetween(from, to) || "";
		let trimmedText = (newText || "").trim();
		if(trimmedText === "") {
			trimmedText = trimmedHref || oldText;
		}
		let tr = state.tr;
		if(!trimmedHref) {
			tr = tr.replaceWith(from, to, state.schema.text(trimmedText || oldText));
		} else {
			const linkMark = linkType.create({ href: trimmedHref, title: trimmedHref });
			tr = tr.replaceWith(from, to, state.schema.text(trimmedText, [linkMark]));
		}
		this.view.dispatch(tr);
		this._editing = false;
		this._buildViewMode();
		this.view.focus();
	}

	update(view) {
		if(this._destroyed) return;
		this.view = view;
		if(this._editing) return;

		const linkInfo = getLinkAtPos(view.state);
		if(!linkInfo) {
			this.el.style.display = "none";
			this._currentLink = null;
			return;
		}

		this._currentLink = linkInfo;
		const href = linkInfo.mark.attrs.href || "";
		const isExternal = /^(?:https?|ftp|mailto):/i.test(href);
		this._linkText.textContent = href;
		this._linkText.href = isExternal ? href : `#${encodeURIComponent(href)}`;
		this._linkText.target = isExternal ? "_blank" : "_self";
		if(isExternal) {
			this._linkText.rel = "noopener noreferrer";
			this._linkText.className = "tc-prosemirror-link-tooltip-href tc-tiddlylink tc-tiddlylink-external";
		} else {
			this._linkText.removeAttribute("rel");
			this._linkText.className = "tc-prosemirror-link-tooltip-href tc-tiddlylink";
		}

		const coords = view.coordsAtPos(linkInfo.from);
		const endCoords = view.coordsAtPos(linkInfo.to);
		const left = (coords.left + endCoords.left) / 2;
		const top = Math.max(coords.bottom, endCoords.bottom);

		this.el.style.display = "flex";
		const rect = this.el.getBoundingClientRect();
		this.el.style.position = "absolute";
		this.el.style.left = `${Math.max(4, left - rect.width / 2 + window.scrollX)}px`;
		this.el.style.top = `${top + 4 + window.scrollY}px`;
		this.el.style.zIndex = "1002";
	}

	destroy() {
		this._destroyed = true;
		if(this.view && this.view.dom && this._linkClickHandler) {
			this.view.dom.removeEventListener("click", this._linkClickHandler, true);
		}
		if(this.el && this.el.parentNode) {
			this.el.parentNode.removeChild(this.el);
		}
	}
}

function createLinkTooltipPlugin(parentWidget) {
	let tooltipInstance = null;
	return new Plugin({
		key: linkTooltipKey,
		view(editorView) {
			tooltipInstance = new LinkTooltip(editorView, parentWidget);
			return {
				update(view) {
					tooltipInstance.update(view);
				},
				destroy() {
					tooltipInstance.destroy();
				}
			};
		}
	});
}

exports.createLinkTooltipPlugin = createLinkTooltipPlugin;
exports.LinkTooltip = LinkTooltip;
