/*\
title: $:/plugins/tiddlywiki/prosemirror/slash-menu-ui.js
type: application/javascript
module-type: library

Native JS SlashMenu UI implementation for TiddlyWiki
\*/

"use strict";

const slashMenu = require("$:/plugins/tiddlywiki/prosemirror/slash-menu.js");

function SlashMenuUI(view, options) {
	this.view = view;
	this.options = options || {};
	this.container = null;
	this.isVisible = false;
	this.lastState = null;
	this.lastNavByKey = false;

	// Create and append the menu container
	this.createContainer();

	// Listen to state changes
	this.setupStateListener();

	// Listen for keydown events to track navigation method
	const self = this;
	document.addEventListener("keydown", e => {
		if(self.isVisible && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
			self.lastNavByKey = true;
		} else if(self.isVisible) {
			self.lastNavByKey = false;
		}
	});
}

SlashMenuUI.prototype.createContainer = function() {
	this.container = document.createElement("div");
	this.container.className = "tw-slash-menu-root";
	this.container.style.display = "none";
	document.body.appendChild(this.container);
};

SlashMenuUI.prototype.setupStateListener = function() {
	const self = this;
	this._rafId = null;
	this._destroyed = false;
	
	this._checkState = function() {
		if(self._destroyed) return;
		self.updateMenu();
		// Only keep animating while the menu is visible (positioning/rendering updates)
		if(self.isVisible) {
			self._rafId = requestAnimationFrame(self._checkState);
		} else {
			self._rafId = null;
		}
	};
	
	// Do an initial check
	self._checkState();
};

/**
 * Called externally (from dispatchTransaction) to check whether the menu should open.
 * Restarts the rAF loop if the menu becomes visible.
 */
SlashMenuUI.prototype.checkState = function() {
	if(this._destroyed) return;
	this.updateMenu();
	// If menu just became visible but rAF isn't running, start it
	if(this.isVisible && !this._rafId) {
		this._rafId = requestAnimationFrame(this._checkState);
	}
};

SlashMenuUI.prototype.updateMenu = function() {
	const state = slashMenu.SlashMenuKey.getState(this.view.state);
	if(!state) {
		return;
	}
	if(state.open && !this.isVisible) {
		this.showMenu(state);
	} else if(!state.open && this.isVisible) {
		this.hideMenu();
	} else if(state.open && this.isVisible) {
		this.renderMenu(state);
	}
};

SlashMenuUI.prototype.showMenu = function(state) {
	this.isVisible = true;
	this.positionMenu();
	this.renderMenu(state);
	this.container.style.display = "block";
};

SlashMenuUI.prototype.hideMenu = function() {
	this.isVisible = false;
	this.container.style.display = "none";
};

SlashMenuUI.prototype.positionMenu = function() {
	const selection = this.view.state.selection;
	const coords = this.view.coordsAtPos(selection.to);
	
	this.container.style.position = "absolute";
	this.container.style.left = (coords.left + window.scrollX) + "px";
	this.container.style.top = (coords.bottom + 5 + window.scrollY) + "px";
	this.container.style.zIndex = "1000";
	
	// Ensure menu doesn't overflow viewport bottom
	requestAnimationFrame(function() {
		var menuRect = this.container.getBoundingClientRect();
		if(menuRect.bottom > window.innerHeight) {
			// Show above the cursor instead
			this.container.style.top = (coords.top - menuRect.height - 5 + window.scrollY) + "px";
		}
		// Ensure menu doesn't overflow viewport right
		if(menuRect.right > window.innerWidth) {
			this.container.style.left = Math.max(4, window.innerWidth - menuRect.width - 8 + window.scrollX) + "px";
		}
	}.bind(this));
};

SlashMenuUI.prototype.renderMenu = function(state) {
	// Clear existing content safely
	while(this.container.firstChild) { this.container.removeChild(this.container.firstChild); }
	
	// Create filter display if there's a filter
	if(state.filter) {
		const filterWrapper = document.createElement("div");
		filterWrapper.className = "tw-slash-menu-filter-wrapper";
		
		const filterText = document.createElement("div");
		filterText.className = "tw-slash-menu-filter";
		filterText.textContent = state.filter;
		
		filterWrapper.appendChild(filterText);
		this.container.appendChild(filterWrapper);
	}
	
	// Create menu content
	const menuContent = document.createElement("div");
	menuContent.className = "tw-slash-menu-content";
	
	// Render menu elements
	const elements = state.filteredElements;
	if(elements.length === 0) {
		const placeholder = document.createElement("div");
		placeholder.className = "tw-slash-menu-placeholder";
		placeholder.textContent = $tw.wiki.getTiddlerText(
			"$:/plugins/tiddlywiki/prosemirror/language/SlashMenu/NoMatches", "No matching items");
		menuContent.appendChild(placeholder);
	} else {
		for(let i = 0; i < elements.length; i++) {
			const element = elements[i];
			const menuItem = this.createMenuItem(element, state);
			menuContent.appendChild(menuItem);
		}
	}
	
	this.container.appendChild(menuContent);
};

SlashMenuUI.prototype.createMenuItem = function(element, state) {
	const self = this;
	if(element.type === "group") {
		const groupTitle = document.createElement("div");
		groupTitle.className = "tw-slash-menu-group-title";
		groupTitle.textContent = element.label;
		return groupTitle;
	}
	const menuItem = document.createElement("div");
	menuItem.className = "tw-slash-menu-item";
	menuItem.id = "menu-item-" + element.id;

	// Add selected class if this is the selected item
	if(element.id === state.selected) {
		menuItem.classList.add("tw-slash-menu-item-selected");
		// Only auto scroll if last navigation was via keyboard
		if(self.lastNavByKey) {
			setTimeout(() => {
				menuItem.scrollIntoView({ block: "nearest" });
				self.lastNavByKey = false; // Reset after scroll
			}, 0);
		}
	}

	// Create icon — render SVG from tiddler if available, else fallback emoji/text
	const icon = document.createElement("div");
	icon.className = "tw-slash-menu-item-icon";
	if(element.icon) {
		const svgEl = this._renderSvgIcon(element.icon, "1em");
		if(svgEl) {
			icon.appendChild(svgEl);
		} else {
			icon.textContent = this.getIconForElement(element);
		}
	} else {
		icon.textContent = this.getIconForElement(element);
	}
	menuItem.appendChild(icon);

	// Create text wrapper with label + description
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

	// Add click handler if clickable
	if(this.options.clickable) {
		menuItem.classList.add("tw-slash-menu-item-clickable");
		menuItem.onclick = () => {
			self.executeCommand(element);
		};
	}

	return menuItem;
};

/**
 * Render an SVG icon from a tiddler title, returning a safe DOM element.
 */
SlashMenuUI.prototype._renderSvgIcon = function(tiddlerTitle, size) {
	try {
		const tiddler = $tw.wiki.getTiddler(tiddlerTitle);
		if(!tiddler) return null;
		const text = tiddler.fields.text;
		const svgMatch = text.match(/<svg[\s\S]*<\/svg>/);
		if(!svgMatch) return null;
		const svgString = svgMatch[0].replace(/<<size>>/g, size || "1em");
		const parser = new DOMParser();
		const doc = parser.parseFromString(svgString, "image/svg+xml");
		const svgEl = doc.querySelector("svg");
		if(!svgEl) return null;
		// Ensure consistent sizing
		svgEl.setAttribute("width", size || "1em");
		svgEl.setAttribute("height", size || "1em");
		svgEl.style.verticalAlign = "middle";
		return document.importNode(svgEl, true);
	} catch(e) {
		return null;
	}
};

SlashMenuUI.prototype.getIconForElement = function(element) {
	// Simple text icons for now - can be enhanced with SVG later
	switch(element.type) {
		case "command":
			return "";
		case "submenu":
			return "▶";
		default:
			return "•";
	}
};

SlashMenuUI.prototype.executeCommand = function(element) {
	if(element.type === "command" && element.command) {
		element.command(this.view);
	}
	// The command execution will trigger a state change that hides the menu
};

SlashMenuUI.prototype.destroy = function() {
	this._destroyed = true;
	if(this._rafId) {
		cancelAnimationFrame(this._rafId);
		this._rafId = null;
	}
	if(this.container && this.container.parentNode) {
		this.container.parentNode.removeChild(this.container);
	}
};

exports.SlashMenuUI = SlashMenuUI;
