/*\
title: $:/plugins/tiddlywiki/prosemirror/slash-menu-ui.js
type: application/javascript
module-type: library

Native JS SlashMenu UI implementation for TiddlyWiki
\*/

"use strict";

var { SlashMenuKey } = require("$:/plugins/tiddlywiki/prosemirror/slash-menu.js");

function SlashMenuUI(view, options) {
	this.view = view;
	this.options = options || {};
	this.container = null;
	this.isVisible = false;
	this.lastState = null;
	
	// Create and append the menu container
	this.createContainer();
	
	// Listen to state changes
	this.setupStateListener();
}

SlashMenuUI.prototype.createContainer = function() {
	this.container = document.createElement('div');
	this.container.className = 'tw-slash-menu-root';
	this.container.style.display = 'none';
	document.body.appendChild(this.container);
};

SlashMenuUI.prototype.setupStateListener = function() {
	var self = this;
	
	function checkState() {
		self.updateMenu();
		// Continue checking on next frame
		requestAnimationFrame(checkState);
	}
	
	// Start the animation frame loop
	requestAnimationFrame(checkState);
};

SlashMenuUI.prototype.updateMenu = function() {
	var state = SlashMenuKey.getState(this.view.state);
	if (!state) return;
	if (state.open && !this.isVisible) {
		this.showMenu(state);
	} else if (!state.open && this.isVisible) {
		this.hideMenu();
	} else if (state.open && this.isVisible) {
		this.renderMenu(state);
	}
};

SlashMenuUI.prototype.showMenu = function(state) {
	this.isVisible = true;
	this.positionMenu();
	this.renderMenu(state);
	this.container.style.display = 'block';
};

SlashMenuUI.prototype.hideMenu = function() {
	this.isVisible = false;
	this.container.style.display = 'none';
};

SlashMenuUI.prototype.positionMenu = function() {
	var selection = this.view.state.selection;
	var coords = this.view.coordsAtPos(selection.to);
	
	this.container.style.position = 'absolute';
	this.container.style.left = coords.left + 'px';
	this.container.style.top = (coords.bottom + 5) + 'px';
	this.container.style.zIndex = '1000';
};

SlashMenuUI.prototype.renderMenu = function(state) {
	// Clear existing content
	this.container.innerHTML = '';
	
	// Create filter display if there's a filter
	if (state.filter) {
		var filterWrapper = document.createElement('div');
		filterWrapper.className = 'tw-slash-menu-filter-wrapper';
		
		var filterText = document.createElement('div');
		filterText.className = 'tw-slash-menu-filter';
		filterText.textContent = state.filter;
		
		filterWrapper.appendChild(filterText);
		this.container.appendChild(filterWrapper);
	}
	
	// Create menu content
	var menuContent = document.createElement('div');
	menuContent.className = 'tw-slash-menu-content';
	
	// Render menu elements
	var elements = state.filteredElements;
	if (elements.length === 0) {
		var placeholder = document.createElement('div');
		placeholder.className = 'tw-slash-menu-placeholder';
		placeholder.textContent = 'No matching items';
		menuContent.appendChild(placeholder);
	} else {
		for (var i = 0; i < elements.length; i++) {
			var element = elements[i];
			var menuItem = this.createMenuItem(element, state);
			menuContent.appendChild(menuItem);
		}
	}
	
	this.container.appendChild(menuContent);
};

SlashMenuUI.prototype.createMenuItem = function(element, state) {
	var self = this;
	var menuItem = document.createElement('div');
	menuItem.className = 'tw-slash-menu-item';
	menuItem.id = 'menu-item-' + element.id;
	
	// Add selected class if this is the selected item
	if (element.id === state.selected) {
		menuItem.classList.add('tw-slash-menu-item-selected');
	}
	
	// Create icon placeholder
	var icon = document.createElement('div');
	icon.className = 'tw-slash-menu-item-icon';
	icon.textContent = this.getIconForElement(element);
	menuItem.appendChild(icon);
	
	// Create label
	var label = document.createElement('div');
	label.className = 'tw-slash-menu-item-label';
	label.textContent = element.label;
	menuItem.appendChild(label);
	
	// Add click handler if clickable
	if (this.options.clickable) {
		menuItem.classList.add('tw-slash-menu-item-clickable');
		menuItem.onclick = function() {
			self.executeCommand(element);
		};
	}
	
	return menuItem;
};

SlashMenuUI.prototype.getIconForElement = function(element) {
	// Simple text icons for now - can be enhanced with SVG later
	switch (element.type) {
		case 'command':
			return '';
		case 'submenu':
			return '▶';
		default:
			return '•';
	}
};

SlashMenuUI.prototype.executeCommand = function(element) {
	if (element.type === 'command' && element.command) {
		element.command(this.view);
	}
	// The command execution will trigger a state change that hides the menu
};

SlashMenuUI.prototype.destroy = function() {
	if (this.container && this.container.parentNode) {
		this.container.parentNode.removeChild(this.container);
	}
};

exports.SlashMenuUI = SlashMenuUI;
