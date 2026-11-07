/*\
title: $:/plugins/tiddlywiki/editor-command-menu/menu-view.js
type: application/javascript
module-type: library

Reusable DOM command menu. Editor adapters own triggers and command execution.

\*/

"use strict";

const registry = require("$:/plugins/tiddlywiki/editor-command-menu/registry.js");

let nextMenuId = 0;

function sanitizeSvg(svg) {
	const forbiddenElements = svg.querySelectorAll("script, foreignObject, iframe, object, embed, image, use, style, link, meta");
	for(let index = forbiddenElements.length - 1; index >= 0; index--) {
		const node = forbiddenElements[index];
		if(node.parentNode) {
			node.parentNode.removeChild(node);
		}
	}
	const elements = [svg].concat(Array.prototype.slice.call(svg.querySelectorAll("*")));
	elements.forEach(function(element) {
		for(let index = element.attributes.length - 1; index >= 0; index--) {
			const attribute = element.attributes[index];
			const name = attribute.name.toLowerCase();
			const value = attribute.value || "";
			if(name.indexOf("on") === 0 || name === "href" || name === "xlink:href" || name === "style" ||
				/javascript\s*:|data\s*:|url\s*\(/i.test(value)) {
				element.removeAttribute(attribute.name);
			}
		}
	});
}

class CommandMenuView {
	constructor(options) {
		options = options || {};
		if(!options.document) {
			throw new Error("CommandMenuView requires an owner document");
		}
		this.document = options.document;
		this.wiki = options.wiki || $tw.wiki;
		this.onExecute = options.onExecute || function() {};
		this.onRequestClose = options.onRequestClose || function() {};
		this.searchable = !!options.searchable;
		this.commands = [];
		this.filteredCommands = [];
		this.filter = "";
		this.selectedId = null;
		this.visible = false;
		this.destroyed = false;
		this.anchorRect = null;
		this.anchorScrollX = 0;
		this.anchorScrollY = 0;
		this.getAnchorRect = null;
		this.positionFrame = null;
		this.onViewportChange = (event) => {
			// Scrolling the command list must not reposition it or scroll the
			// selected option back into view while the user browses the list.
			if(event && event.target && event.target.nodeType && this.root.contains(event.target)) return;
			const win = this.document.defaultView;
			if(!this.visible || !win || this.positionFrame !== null) return;
			this.positionFrame = win.requestAnimationFrame(() => {
				this.positionFrame = null;
				this.reposition();
			});
		};
		this.menuId = "tc-editor-command-menu-" + (++nextMenuId);
		this._buildDOM(options);
	}

	_buildDOM(options) {
		const root = this.document.createElement("div");
		root.id = this.menuId;
		root.className = "tc-editor-command-menu";
		root.setAttribute("role", "dialog");
		root.setAttribute("aria-label", options.ariaLabel || this._language("AriaLabel", "Editor commands"));
		root.style.display = "none";

		const filterWrapper = this.document.createElement("div");
		filterWrapper.className = "tc-editor-command-menu-filter-wrapper";
		this.filterWrapper = filterWrapper;
		if(this.searchable) {
			const search = this.document.createElement("input");
			search.type = "search";
			search.className = "tc-editor-command-menu-search";
			search.placeholder = options.filterPlaceholder || this._language("FilterPlaceholder", "Filter commands...");
			search.setAttribute("role", "combobox");
			search.setAttribute("aria-autocomplete", "list");
			search.setAttribute("aria-expanded", "false");
			search.setAttribute("aria-label", options.filterAriaLabel || this._language("FilterAriaLabel", "Filter commands"));
			search.addEventListener("input", () => this.setFilter(search.value));
			search.addEventListener("keydown", (event) => this._handleSearchKeyDown(event));
			filterWrapper.appendChild(search);
			this.searchInput = search;
		} else {
			const filterText = this.document.createElement("div");
			filterText.className = "tc-editor-command-menu-filter";
			filterWrapper.appendChild(filterText);
			this.filterText = filterText;
			filterWrapper.style.display = "none";
		}
		root.appendChild(filterWrapper);

		const content = this.document.createElement("div");
		content.id = this.menuId + "-listbox";
		content.className = "tc-editor-command-menu-content";
		content.setAttribute("role", "listbox");
		content.setAttribute("aria-label", options.listAriaLabel || this._language("ListAriaLabel", "Available commands"));
		if(this.searchInput) {
			this.searchInput.setAttribute("aria-controls", content.id);
			this.activeDescendantOwner = this.searchInput;
		} else {
			content.setAttribute("tabindex", "0");
			this.activeDescendantOwner = content;
		}
		root.appendChild(content);
		this.content = content;

		root.addEventListener("mousedown", function(event) {
			if(event.target !== this.searchInput) {
				event.preventDefault();
			}
		}.bind(this));
		this.document.body.appendChild(root);
		this.root = root;
	}

	_language(suffix, fallback) {
		return this.wiki.getTiddlerText("$:/plugins/tiddlywiki/editor-command-menu/language/" + suffix, fallback);
	}

	setCommands(commands) {
		this.commands = (commands || []).slice(0);
		this._applyFilter();
	}

	setFilter(filter) {
		this.filter = filter || "";
		if(this.searchInput && this.searchInput.value !== this.filter) {
			this.searchInput.value = this.filter;
		}
		if(this.filterText) {
			this.filterText.textContent = this.filter;
			this.filterWrapper.style.display = this.filter ? "flex" : "none";
		}
		this._applyFilter();
	}

	_applyFilter() {
		this.filteredCommands = registry.filterCommands(this.commands, this.filter);
		if(!this._findCommand(this.selectedId)) {
			this.selectedId = this.filteredCommands.length > 0 ? this.filteredCommands[0].id : null;
		}
		this.render();
		this.reposition();
	}

	_findCommand(id) {
		for(let index = 0; index < this.filteredCommands.length; index++) {
			if(this.filteredCommands[index].id === id) {
				return this.filteredCommands[index];
			}
		}
		return null;
	}

	select(id) {
		if(!this._findCommand(id)) {
			return false;
		}
		this.selectedId = id;
		this._syncSelectionDOM();
		return true;
	}

	moveSelection(direction) {
		if(this.filteredCommands.length === 0) {
			return false;
		}
		let current = this.filteredCommands.findIndex(function(command) {
			return command.id === this.selectedId;
		}.bind(this));
		if(current < 0) {
			current = direction > 0 ? -1 : 0;
		}
		const next = (current + direction + this.filteredCommands.length) % this.filteredCommands.length;
		this.selectedId = this.filteredCommands[next].id;
		this._syncSelectionDOM();
		return true;
	}

	_syncSelectionDOM() {
		if(!this.content) {
			return;
		}
		const items = this.content.querySelectorAll(".tc-editor-command-menu-item");
		let selectedElement = null;
		for(let index = 0; index < items.length; index++) {
			const selected = items[index].getAttribute("data-command-id") === this.selectedId;
			items[index].classList.toggle("tc-editor-command-menu-item-selected", selected);
			items[index].setAttribute("aria-selected", selected ? "true" : "false");
			if(selected) {
				selectedElement = items[index];
			}
		}
		if(selectedElement) {
			this.activeDescendantOwner.setAttribute("aria-activedescendant", selectedElement.id);
			if(this.visible && selectedElement.scrollIntoView) {
				selectedElement.scrollIntoView({ block: "nearest" });
			}
		} else {
			this.activeDescendantOwner.removeAttribute("aria-activedescendant");
		}
	}

	executeSelected() {
		const command = this._findCommand(this.selectedId);
		if(!command) {
			return false;
		}
		this.onExecute(command);
		return true;
	}

	_handleSearchKeyDown(event) {
		if(event.isComposing || event.keyCode === 229) {
			return;
		}
		if(event.key === "ArrowDown" || event.key === "ArrowUp") {
			event.preventDefault();
			this.moveSelection(event.key === "ArrowDown" ? 1 : -1);
		} else if(event.key === "Enter") {
			event.preventDefault();
			this.executeSelected();
		} else if(event.key === "Home" || event.key === "End") {
			event.preventDefault();
			if(this.filteredCommands.length > 0) {
				this.select(this.filteredCommands[event.key === "Home" ? 0 : this.filteredCommands.length - 1].id);
			}
		} else if(event.key === "Escape") {
			event.preventDefault();
			this.onRequestClose();
		}
	}

	render() {
		if(!this.content || this.destroyed) {
			return;
		}
		while(this.content.firstChild) {
			this.content.removeChild(this.content.firstChild);
		}
		if(this.filteredCommands.length === 0) {
			const empty = this.document.createElement("div");
			empty.className = "tc-editor-command-menu-empty";
			empty.setAttribute("role", "status");
			empty.textContent = this._language("NoMatches", "No matching commands");
			this.content.appendChild(empty);
			this.activeDescendantOwner.removeAttribute("aria-activedescendant");
			return;
		}
		let previousCategory = null;
		let selectedElement = null;
		for(let index = 0; index < this.filteredCommands.length; index++) {
			const command = this.filteredCommands[index];
			if(command.category !== previousCategory) {
				const group = this.document.createElement("div");
				group.className = "tc-editor-command-menu-group";
				group.setAttribute("role", "presentation");
				group.textContent = registry.getCategoryLabel(this.wiki, command.category);
				this.content.appendChild(group);
				previousCategory = command.category;
			}
			const item = this._createCommandElement(command, index);
			this.content.appendChild(item);
			if(command.id === this.selectedId) {
				selectedElement = item;
			}
		}
		if(selectedElement) {
			this.activeDescendantOwner.setAttribute("aria-activedescendant", selectedElement.id);
			if(this.visible && selectedElement.scrollIntoView) {
				selectedElement.scrollIntoView({ block: "nearest" });
			}
		}
	}

	_createCommandElement(command, index) {
		const item = this.document.createElement("button");
		item.type = "button";
		item.id = this.menuId + "-item-" + index;
		item.className = "tc-editor-command-menu-item";
		item.setAttribute("role", "option");
		item.setAttribute("tabindex", "-1");
		item.setAttribute("data-command-id", command.id);
		item.setAttribute("aria-selected", command.id === this.selectedId ? "true" : "false");
		if(command.id === this.selectedId) {
			item.classList.add("tc-editor-command-menu-item-selected");
		}
		const icon = this.document.createElement("span");
		icon.className = "tc-editor-command-menu-item-icon";
		const iconNode = command.icon ? this._renderSvgIcon(command.icon) : null;
		icon.appendChild(iconNode || this.document.createTextNode("\u2022"));
		item.appendChild(icon);
		const text = this.document.createElement("span");
		text.className = "tc-editor-command-menu-item-text";
		const label = this.document.createElement("span");
		label.className = "tc-editor-command-menu-item-label";
		label.textContent = command.label;
		text.appendChild(label);
		if(command.description) {
			const description = this.document.createElement("span");
			description.className = "tc-editor-command-menu-item-description";
			description.textContent = command.description;
			text.appendChild(description);
		}
		item.appendChild(text);
		item.addEventListener("mouseenter", () => this.select(command.id));
		item.addEventListener("click", (event) => {
			event.preventDefault();
			event.stopPropagation();
			this.selectedId = command.id;
			this.onExecute(command);
		});
		return item;
	}

	_renderSvgIcon(title) {
		try {
			const html = this.wiki.renderTiddler("text/html", title, {
				variables: { size: "1em" }
			});
			if(!html) {
				return null;
			}
			const container = this.document.createElement("div");
			container.innerHTML = html;
			const svg = container.querySelector("svg");
			if(!svg) {
				return null;
			}
			sanitizeSvg(svg);
			svg.setAttribute("width", "1em");
			svg.setAttribute("height", "1em");
			return this.document.importNode(svg, true);
		} catch(e) {
			return null;
		}
	}

	show(anchorRect, getAnchorRect) {
		if(this.destroyed || !anchorRect) {
			return;
		}
		this.anchorRect = anchorRect;
		const win = this.document.defaultView;
		this.anchorScrollX = win && win.scrollX || 0;
		this.anchorScrollY = win && win.scrollY || 0;
		this.getAnchorRect = getAnchorRect || null;
		this.visible = true;
		this.root.style.display = "flex";
		if(this.searchInput) {
			this.searchInput.setAttribute("aria-expanded", "true");
		}
		this.reposition();
		this.listenToViewport(true);
		if(this.searchInput) {
			this.searchInput.focus();
		} else {
			this.content.focus();
		}
	}

	listenToViewport(listen) {
		const win = this.document.defaultView;
		if(!win) return;
		const method = listen ? "addEventListener" : "removeEventListener";
		win[method]("resize", this.onViewportChange);
		this.document[method]("scroll", this.onViewportChange, true);
		if(win.visualViewport) {
			win.visualViewport[method]("resize", this.onViewportChange);
			win.visualViewport[method]("scroll", this.onViewportChange);
		}
		if(!listen && this.positionFrame !== null) {
			win.cancelAnimationFrame(this.positionFrame);
			this.positionFrame = null;
		}
	}

	reposition() {
		if(!this.visible || this.destroyed) return;
		const win = this.document.defaultView;
		const scrollX = win && win.scrollX || 0;
		const scrollY = win && win.scrollY || 0;
		let rect = this.anchorRect;
		if(this.getAnchorRect) {
			try {
				const current = this.getAnchorRect();
				if(current) {
					rect = this.anchorRect = current;
					this.anchorScrollX = scrollX;
					this.anchorScrollY = scrollY;
				}
			} catch(e) {
				// An editor may remove the anchor before hiding its menu.
				// The last known rectangle still permits viewport clamping.
			}
		}
		if(rect) {
			const dx = this.anchorScrollX - scrollX;
			const dy = this.anchorScrollY - scrollY;
			this.position({ left: rect.left + dx, right: rect.right + dx,
				top: rect.top + dy, bottom: rect.bottom + dy });
		}
	}

	position(anchorRect) {
		if(!this.visible || this.destroyed) {
			return;
		}
		const win = this.document.defaultView;
		if(!win) {
			return;
		}
		const scrollX = win.scrollX || 0;
		const scrollY = win.scrollY || 0;
		const viewport = win.visualViewport;
		const viewportLeft = viewport ? viewport.offsetLeft : 0;
		const viewportTop = viewport ? viewport.offsetTop : 0;
		const viewportWidth = viewport ? viewport.width : win.innerWidth;
		const viewportHeight = viewport ? viewport.height : win.innerHeight;
		this.root.style.setProperty("--tc-editor-command-menu-viewport-width", viewportWidth + "px");
		this.root.style.setProperty("--tc-editor-command-menu-viewport-height", viewportHeight + "px");
		this.root.style.left = (anchorRect.left + scrollX) + "px";
		this.root.style.top = (anchorRect.bottom + 5 + scrollY) + "px";
		const menuRect = this.root.getBoundingClientRect();
		const documentDirection = this.document.documentElement.getAttribute("dir");
		const rtl = documentDirection === "rtl";
		const idealLeft = rtl ? anchorRect.right - menuRect.width : anchorRect.left;
		const maxLeft = Math.max(viewportLeft + 4, viewportLeft + viewportWidth - menuRect.width - 8);
		const left = Math.min(Math.max(viewportLeft + 4, idealLeft), maxLeft);
		const fitsBelow = anchorRect.bottom + 5 + menuRect.height <= viewportTop + viewportHeight;
		const idealTop = fitsBelow ? anchorRect.bottom + 5 : anchorRect.top - menuRect.height - 5;
		const maxTop = Math.max(viewportTop + 4, viewportTop + viewportHeight - menuRect.height - 8);
		const top = Math.min(Math.max(viewportTop + 4, idealTop), maxTop);
		this.root.style.left = (left + scrollX) + "px";
		this.root.style.top = (top + scrollY) + "px";
	}

	hide() {
		this.visible = false;
		this.listenToViewport(false);
		this.anchorRect = null;
		this.getAnchorRect = null;
		if(this.root) {
			this.root.style.display = "none";
		}
		if(this.searchInput) {
			this.searchInput.setAttribute("aria-expanded", "false");
		}
	}

	destroy() {
		if(this.destroyed) {
			return;
		}
		this.hide();
		this.destroyed = true;
		if(this.root && this.root.parentNode) {
			this.root.parentNode.removeChild(this.root);
		}
	}
}

exports.CommandMenuView = CommandMenuView;
