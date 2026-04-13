/*\
title: $:/plugins/tiddlywiki/prosemirror/slash-menu/slash-menu-ui.js
type: application/javascript
module-type: library

Native JS SlashMenu UI implementation for TiddlyWiki
\*/

"use strict";

const slashMenu = require("$:/plugins/tiddlywiki/prosemirror/slash-menu/slash-menu.js");

class SlashMenuUI {
	constructor(view, options) {
		this.view = view;
		this.options = options || {};
		this.container = null;
		this.isVisible = false;
		this.lastState = null;
		this.lastNavByKey = false;
		this._rafId = null;
		this._destroyed = false;

		this._createContainer();
		this._setupStateListener();

		document.addEventListener("keydown", (e) => {
			if(this.isVisible && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
				this.lastNavByKey = true;
			} else if(this.isVisible) {
				this.lastNavByKey = false;
			}
		});
	}

	_createContainer() {
		this.container = document.createElement("div");
		this.container.className = "tw-slash-menu-root";
		this.container.style.display = "none";
		document.body.appendChild(this.container);
	}

	_setupStateListener() {
		this._checkState = () => {
			if(this._destroyed) return;
			this.updateMenu();
			if(this.isVisible) {
				this._rafId = requestAnimationFrame(this._checkState);
			} else {
				this._rafId = null;
			}
		};
		this._checkState();
	}

	/**
	 * Called externally (from dispatchTransaction) to trigger a menu state check.
	 * Restarts the rAF loop if the menu becomes visible.
	 */
	checkState() {
		if(this._destroyed) return;
		this.updateMenu();
		if(this.isVisible && !this._rafId) {
			this._rafId = requestAnimationFrame(this._checkState);
		}
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
		this.positionMenu();
		this.renderMenu(state);
		this.container.style.display = "block";
	}

	hideMenu() {
		this.isVisible = false;
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
		while(this.container.firstChild) { this.container.removeChild(this.container.firstChild); }

		if(state.filter) {
			const filterWrapper = document.createElement("div");
			filterWrapper.className = "tw-slash-menu-filter-wrapper";
			const filterText = document.createElement("div");
			filterText.className = "tw-slash-menu-filter";
			filterText.textContent = state.filter;
			filterWrapper.appendChild(filterText);
			this.container.appendChild(filterWrapper);
		}

		const menuContent = document.createElement("div");
		menuContent.className = "tw-slash-menu-content";

		const elements = state.filteredElements;
		if(elements.length === 0) {
			const placeholder = document.createElement("div");
			placeholder.className = "tw-slash-menu-placeholder";
			placeholder.textContent = $tw.wiki.getTiddlerText(
				"$:/plugins/tiddlywiki/prosemirror/language/SlashMenu/NoMatches", "No matching items");
			menuContent.appendChild(placeholder);
		} else {
			for(const element of elements) {
				menuContent.appendChild(this.createMenuItem(element, state));
			}
		}

		this.container.appendChild(menuContent);
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
			if(this.lastNavByKey) {
				setTimeout(() => {
					menuItem.scrollIntoView({ block: "nearest" });
					this.lastNavByKey = false;
				}, 0);
			}
		}

		const icon = document.createElement("div");
		icon.className = "tw-slash-menu-item-icon";
		if(element.icon) {
			const svgEl = this._renderSvgIcon(element.icon, "1em");
			icon.appendChild(svgEl || document.createTextNode(this._getIconForElement(element)));
		} else {
			icon.textContent = this._getIconForElement(element);
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
			menuItem.onclick = () => this.executeCommand(element);
		}

		return menuItem;
	}

	_renderSvgIcon(tiddlerTitle, size) {
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

	_getIconForElement(element) {
		if(element.type === "submenu") return "▶";
		return "•";
	}

	executeCommand(element) {
		if(element.type === "command" && element.command) {
			element.command(this.view);
		}
	}

	destroy() {
		this._destroyed = true;
		if(this._rafId) {
			cancelAnimationFrame(this._rafId);
			this._rafId = null;
		}
		if(this.container && this.container.parentNode) {
			this.container.parentNode.removeChild(this.container);
		}
	}
}

exports.SlashMenuUI = SlashMenuUI;

