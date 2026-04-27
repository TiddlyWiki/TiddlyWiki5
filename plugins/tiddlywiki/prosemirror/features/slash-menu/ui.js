/*\
title: $:/plugins/tiddlywiki/prosemirror/features/slash-menu/ui.js
type: application/javascript
module-type: library

Native JS SlashMenu UI implementation for TiddlyWiki
\*/

"use strict";

const slashMenu = require("$:/plugins/tiddlywiki/prosemirror/features/slash-menu/plugin.js");

class SlashMenuUI {
	constructor(view, options) {
		this.view = view;
		this.options = options || {};
		this.container = null;
		this.filterWrapper = null;
		this.filterText = null;
		this.menuContent = null;
		this.isVisible = false;
		this._lastSelectedId = null;
		this._destroyed = false;

		this._createContainer();
	}

	_createContainer() {
		this.container = document.createElement("div");
		this.container.className = "tw-slash-menu-root";
		this.container.style.display = "none";

		this.filterWrapper = document.createElement("div");
		this.filterWrapper.className = "tw-slash-menu-filter-wrapper";
		this.filterWrapper.style.display = "none";
		this.filterText = document.createElement("div");
		this.filterText.className = "tw-slash-menu-filter";
		this.filterWrapper.appendChild(this.filterText);
		this.container.appendChild(this.filterWrapper);

		this.menuContent = document.createElement("div");
		this.menuContent.className = "tw-slash-menu-content";
		this.container.appendChild(this.menuContent);

		// Prevent the editor from blurring or losing selection when the user
		// presses on the menu — without this, click handlers fire too late
		// because focus moves and the slash plugin closes via outside-click.
		this.container.addEventListener("mousedown", (e) => {
			e.preventDefault();
		});

		document.body.appendChild(this.container);
	}

	checkState() {
		if(this._destroyed) return;
		this.updateMenu();
	}

	updateMenu() {
		const state = slashMenu.SlashMenuKey.getState(this.view.state);
		if(!state) return;
		if(state.open && !this.isVisible) {
			this.showMenu(state);
		} else if(!state.open && this.isVisible) {
			this.hideMenu();
		} else if(state.open && this.isVisible) {
			this.renderMenu(state);
		}
	}

	showMenu(state) {
		this.isVisible = true;
		this._lastSelectedId = null;
		this.positionMenu();
		this.renderMenu(state);
		this.container.style.display = "flex";
	}

	hideMenu() {
		this.isVisible = false;
		this._lastSelectedId = null;
		this.container.style.display = "none";
	}

	positionMenu() {
		const coords = this.view.coordsAtPos(this.view.state.selection.to);

		this.container.style.position = "absolute";
		this.container.style.left = (coords.left + window.scrollX) + "px";
		this.container.style.top = (coords.bottom + 5 + window.scrollY) + "px";
		this.container.style.zIndex = "1000";

		// Ensure menu doesn't overflow viewport
		requestAnimationFrame(() => {
			if(!this.isVisible || this._destroyed) return;
			const menuRect = this.container.getBoundingClientRect();
			if(menuRect.bottom > window.innerHeight) {
				this.container.style.top = (coords.top - menuRect.height - 5 + window.scrollY) + "px";
			}
			if(menuRect.right > window.innerWidth) {
				this.container.style.left = Math.max(4, window.innerWidth - menuRect.width - 8 + window.scrollX) + "px";
			}
		});
	}

	renderMenu(state) {
		// Filter row stays pinned in flex layout — outside the scroll area.
		if(state.filter) {
			this.filterText.textContent = state.filter;
			this.filterWrapper.style.display = "flex";
		} else {
			this.filterWrapper.style.display = "none";
		}

		while(this.menuContent.firstChild) { this.menuContent.removeChild(this.menuContent.firstChild); }

		const elements = state.filteredElements;
		if(elements.length === 0) {
			const placeholder = document.createElement("div");
			placeholder.className = "tw-slash-menu-placeholder";
			placeholder.textContent = $tw.wiki.getTiddlerText(
				"$:/plugins/tiddlywiki/prosemirror/language/SlashMenu/NoMatches", "No matching items");
			this.menuContent.appendChild(placeholder);
		} else {
			let selectedItemEl = null;
			for(const element of elements) {
				const node = this.createMenuItem(element, state);
				this.menuContent.appendChild(node);
				if(element.id === state.selected && element.type !== "group") {
					selectedItemEl = node;
				}
			}
			// Keep the highlighted item in view whenever the selection changes
			// (covers both keyboard arrows and incremental filter changes).
			if(selectedItemEl && this._lastSelectedId !== state.selected) {
				this._lastSelectedId = state.selected;
				this._scrollIntoView(selectedItemEl);
			}
		}
	}

	_scrollIntoView(itemEl) {
		const container = this.menuContent;
		const itemTop = itemEl.offsetTop;
		const itemBottom = itemTop + itemEl.offsetHeight;
		const viewTop = container.scrollTop;
		const viewBottom = viewTop + container.clientHeight;
		if(itemTop < viewTop) {
			container.scrollTop = itemTop;
		} else if(itemBottom > viewBottom) {
			container.scrollTop = itemBottom - container.clientHeight;
		}
	}

	createMenuItem(element, state) {
		if(element.type === "group") {
			const groupTitle = document.createElement("div");
			groupTitle.className = "tw-slash-menu-group-title";
			groupTitle.textContent = element.label;
			return groupTitle;
		}

		const menuItem = document.createElement("div");
		menuItem.className = "tw-slash-menu-item";
		menuItem.id = "menu-item-" + element.id;

		if(element.id === state.selected) {
			menuItem.classList.add("tw-slash-menu-item-selected");
		}

		const icon = document.createElement("div");
		icon.className = "tw-slash-menu-item-icon";
		if(element.icon) {
			const svgEl = this.constructor._renderSvgIcon(element.icon, "1em");
			icon.appendChild(svgEl || document.createTextNode(this.constructor._getIconForElement(element)));
		} else {
			icon.textContent = this.constructor._getIconForElement(element);
		}
		menuItem.appendChild(icon);

		const textWrap = document.createElement("div");
		textWrap.className = "tw-slash-menu-item-text";
		const label = document.createElement("div");
		label.className = "tw-slash-menu-item-label";
		label.textContent = element.label;
		textWrap.appendChild(label);
		if(element.description) {
			const desc = document.createElement("div");
			desc.className = "tw-slash-menu-item-description";
			desc.textContent = element.description;
			textWrap.appendChild(desc);
		}
		menuItem.appendChild(textWrap);

		if(this.options.clickable) {
			menuItem.classList.add("tw-slash-menu-item-clickable");
			// mousedown is suppressed by the container handler; click then
			// fires reliably without losing the editor selection.
			menuItem.addEventListener("click", (e) => {
				e.preventDefault();
				e.stopPropagation();
				this.executeCommand(element);
			});
			menuItem.addEventListener("mouseenter", () => {
				// Hover-driven highlight syncs the plugin's `selected` state
				// so Enter and click both target the same item.
				if(state.selected !== element.id) {
					this.view.dispatch(this.view.state.tr.setMeta(slashMenu.SlashMenuKey, {
						type: slashMenu.SlashMetaTypes.inputChange,
						filter: state.filter,
						selected: element.id
					}));
				}
			});
		}

		return menuItem;
	}

	static _renderSvgIcon(tiddlerTitle, size) {
		try {
			const tiddler = $tw.wiki.getTiddler(tiddlerTitle);
			if(!tiddler) return null;
			const svgMatch = tiddler.fields.text.match(/<svg[\s\S]*<\/svg>/);
			if(!svgMatch) return null;
			const svgString = svgMatch[0].replace(/<<size>>/g, size || "1em");
			const doc = new DOMParser().parseFromString(svgString, "image/svg+xml");
			const svgEl = doc.querySelector("svg");
			if(!svgEl) return null;
			svgEl.setAttribute("width", size || "1em");
			svgEl.setAttribute("height", size || "1em");
			svgEl.style.verticalAlign = "middle";
			return document.importNode(svgEl, true);
		} catch(e) {
			return null;
		}
	}

	static _getIconForElement(element) {
		if(element.type === "submenu") return "▶";
		return "•";
	}

	executeCommand(element) {
		if(element.type !== "command" || !element.command) return;
		// Restore editor focus before running the command so commands that
		// depend on the current selection (e.g. setBlockType) operate on the
		// expected range.
		this.view.focus();
		element.command(this.view);
		this.view.dispatch(this.view.state.tr.setMeta(slashMenu.SlashMenuKey, {
			type: slashMenu.SlashMetaTypes.execute
		}));
		this.hideMenu();
	}

	destroy() {
		this._destroyed = true;
		if(this.container && this.container.parentNode) {
			this.container.parentNode.removeChild(this.container);
		}
	}
}

exports.SlashMenuUI = SlashMenuUI;
