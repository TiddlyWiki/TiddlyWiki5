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
	
	const checkState = () => {
		self.updateMenu();
		// Continue checking on next frame
		requestAnimationFrame(checkState);
	};
	
	// Start the animation frame loop
	requestAnimationFrame(checkState);
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
	this.container.style.left = coords.left + "px";
	this.container.style.top = (coords.bottom + 5) + "px";
	this.container.style.zIndex = "1000";
};

SlashMenuUI.prototype.renderMenu = function(state) {
	// Clear existing content
	this.container.innerHTML = "";
	
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
		placeholder.textContent = "No matching items";
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

	// Create icon placeholder
	const icon = document.createElement("div");
	icon.className = "tw-slash-menu-item-icon";
	icon.textContent = this.getIconForElement(element);
	menuItem.appendChild(icon);

	// Create label
	const label = document.createElement("div");
	label.className = "tw-slash-menu-item-label";
	label.textContent = element.label;
	menuItem.appendChild(label);

	// Add click handler if clickable
	if(this.options.clickable) {
		menuItem.classList.add("tw-slash-menu-item-clickable");
		menuItem.onclick = () => {
			self.executeCommand(element);
		};
	}

	return menuItem;
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
	if(this.container && this.container.parentNode) {
		this.container.parentNode.removeChild(this.container);
	}
};

exports.SlashMenuUI = SlashMenuUI;
