/*\
title: $:/core/modules/widgets/secret-manager-input.js
type: application/javascript
module-type: widget

Secure input widget for the Secrets Manager using Shadow DOM

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var SecretManagerInputWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
SecretManagerInputWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
SecretManagerInputWidget.prototype.render = function(parent,nextSibling) {
	var self = this;
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	
	// Create host element
	var hostNode = this.document.createElement("div");
	hostNode.className = "tc-secret-input-host";
	
	// Check Shadow DOM support
	if(hostNode.attachShadow) {
		// Create shadow root (closed for security)
		this.shadowRoot = hostNode.attachShadow({mode: "closed"});
		
		// First append the host to parent to ensure styles are computed
		parent.insertBefore(hostNode,nextSibling);
		
		// Store style element reference for updates
		this.styleNode = this.document.createElement("style");
		this.shadowRoot.appendChild(this.styleNode);
		
		// Function to update styles
		this.updateShadowStyles = function() {
			// Get computed styles from the parent and find the closest TiddlyWiki container
			var computedStyle = window.getComputedStyle(hostNode);
			var parentStyle = window.getComputedStyle(parent);
			
			// Find the closest element with TiddlyWiki styles
			var twElement = hostNode.closest('.tc-tiddler-body, .tc-tiddler-frame, .tc-story-river, body');
			var twStyle = twElement ? window.getComputedStyle(twElement) : computedStyle;
			
			// Get colors from the computed styles, handling transparent backgrounds
			var backgroundColor = twStyle.backgroundColor;
			var color = twStyle.color;
			
			// If background is transparent or not set, traverse up to find a non-transparent background
			if (!backgroundColor || backgroundColor === 'transparent' || backgroundColor === 'rgba(0, 0, 0, 0)') {
				var elem = twElement;
				while (elem && elem !== document.body) {
					var style = window.getComputedStyle(elem);
					if (style.backgroundColor && style.backgroundColor !== 'transparent' && style.backgroundColor !== 'rgba(0, 0, 0, 0)') {
						backgroundColor = style.backgroundColor;
						break;
					}
					elem = elem.parentElement;
				}
			}
			
			// Fallback to body background if still not found
			if (!backgroundColor || backgroundColor === 'transparent' || backgroundColor === 'rgba(0, 0, 0, 0)') {
				backgroundColor = window.getComputedStyle(document.body).backgroundColor || '#ffffff';
			}
			
			// Similar handling for color
			if (!color || color === 'transparent' || color === 'rgba(0, 0, 0, 0)') {
				color = twStyle.color || parentStyle.color || computedStyle.color || '#333333';
			}
			
			// Parse RGB values for creating variations
			var parseRgb = function(colorStr) {
				var match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
				if (match) {
					return {r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3])};
				}
				// Handle hex colors
				if (colorStr.startsWith('#')) {
					var hex = colorStr.slice(1);
					if (hex.length === 3) {
						hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
					}
					return {
						r: parseInt(hex.slice(0, 2), 16),
						g: parseInt(hex.slice(2, 4), 16),
						b: parseInt(hex.slice(4, 6), 16)
					};
				}
				return {r: 255, g: 255, b: 255}; // Default to white
			};
			
			// Create lighter/darker variations
			var adjustColor = function(colorStr, amount) {
				var rgb = parseRgb(colorStr);
				var factor = amount > 0 ? amount : 1 + amount;
				if (amount > 0) {
					// Lighten
					rgb.r = Math.min(255, rgb.r + (255 - rgb.r) * factor);
					rgb.g = Math.min(255, rgb.g + (255 - rgb.g) * factor);
					rgb.b = Math.min(255, rgb.b + (255 - rgb.b) * factor);
				} else {
					// Darken
					rgb.r = Math.max(0, rgb.r * factor);
					rgb.g = Math.max(0, rgb.g * factor);
					rgb.b = Math.max(0, rgb.b * factor);
				}
				return `rgb(${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)})`;
			};
			
			// Determine if we're in a dark theme
			var bgRgb = parseRgb(backgroundColor);
			var isDark = (bgRgb.r + bgRgb.g + bgRgb.b) / 3 < 128;
			
			// Calculate derived colors
			var inputBg = isDark ? adjustColor(backgroundColor, -0.1) : adjustColor(backgroundColor, 0.05);
			var borderColor = isDark ? adjustColor(backgroundColor, 0.2) : adjustColor(backgroundColor, -0.15);
			var fieldBg = backgroundColor;
			var fieldBorder = isDark ? adjustColor(backgroundColor, 0.15) : adjustColor(backgroundColor, -0.1);
			var buttonBg = isDark ? adjustColor(color, -0.3) : adjustColor(color, 0.1);
			var buttonHoverBg = isDark ? adjustColor(buttonBg, 0.1) : adjustColor(buttonBg, -0.1);
			
			// Update styles
			self.styleNode.textContent = `
			:host {
				display: block;
				margin: 1em 0;
			}
			.input-container {
				display: flex;
				flex-direction: column;
				gap: 0.75em;
				padding: 1em;
				background: ${inputBg};
				color: ${color};
				border: 1px solid ${borderColor};
				border-radius: 4px;
			}
			.input-row {
				display: flex;
				align-items: center;
				gap: 0.5em;
			}
			label {
				flex: 0 0 100px;
				font-weight: 500;
				color: ${color};
			}
			input {
				flex: 1;
				padding: 0.5em;
				background: ${fieldBg};
				border: 1px solid ${fieldBorder};
				color: ${color};
				border-radius: 3px;
				font-family: inherit;
				font-size: inherit;
			}
			input:focus {
				outline: none;
				border-color: ${buttonBg};
				box-shadow: 0 0 0 2px ${buttonBg}33;
			}
			.button-row {
				display: flex;
				justify-content: flex-end;
				margin-top: 0.5em;
			}
			button {
				padding: 0.5em 1.5em;
				background: ${buttonBg};
				color: ${isDark ? backgroundColor : '#ffffff'};
				border: none;
				border-radius: 3px;
				font-weight: 500;
				cursor: pointer;
				transition: background 0.2s;
			}
			button:hover {
				background: ${buttonHoverBg};
			}
			button:active {
				transform: translateY(1px);
			}
			button:disabled {
				opacity: 0.5;
				cursor: not-allowed;
			}
			.status {
				font-size: 0.9em;
				font-style: italic;
				color: ${adjustColor(color, isDark ? -0.2 : 0.3)};
			}
			.status.error {
				color: ${isDark ? '#ff6666' : '#cc0000'};
			}
			.status.success {
				color: ${isDark ? '#66ff66' : '#00aa00'};
			}
		`;
		};
		
		// Initial style update
		this.updateShadowStyles();
		
		// Create form container
		var container = this.document.createElement("div");
		container.className = "input-container";
		
		// Name input row
		var nameRow = this.document.createElement("div");
		nameRow.className = "input-row";
		
		var nameLabel = this.document.createElement("label");
		nameLabel.textContent = "Name:";
		
		this.nameInput = this.document.createElement("input");
		this.nameInput.type = "text";
		this.nameInput.placeholder = "secret-name";
		this.nameInput.autocomplete = "off";
		this.nameInput.spellcheck = false;
		
		nameRow.appendChild(nameLabel);
		nameRow.appendChild(this.nameInput);
		
		// Value input row
		var valueRow = this.document.createElement("div");
		valueRow.className = "input-row";
		
		var valueLabel = this.document.createElement("label");
		valueLabel.textContent = "Value:";
		
		this.valueInput = this.document.createElement("input");
		this.valueInput.type = "password";
		this.valueInput.placeholder = "secret value";
		this.valueInput.autocomplete = "new-password";
		
		valueRow.appendChild(valueLabel);
		valueRow.appendChild(this.valueInput);
		
		// Status message
		this.statusNode = this.document.createElement("div");
		this.statusNode.className = "status";
		this.statusNode.style.display = "none";
		
		// Button row
		var buttonRow = this.document.createElement("div");
		buttonRow.className = "button-row";
		
		this.addButton = this.document.createElement("button");
		this.addButton.textContent = "Add Secret";
		
		buttonRow.appendChild(this.addButton);
		
		// Assemble
		container.appendChild(nameRow);
		container.appendChild(valueRow);
		container.appendChild(this.statusNode);
		container.appendChild(buttonRow);
		
		this.shadowRoot.appendChild(container);
		
		// Event handlers
		this.addButton.addEventListener("click", function(e) {
			e.preventDefault();
			self.handleAddSecret();
		});
		
		// Enter key handling
		var handleEnter = function(e) {
			if(e.key === "Enter") {
				e.preventDefault();
				self.handleAddSecret();
			}
		};
		this.nameInput.addEventListener("keydown", handleEnter);
		this.valueInput.addEventListener("keydown", handleEnter);
		
		// Validation on input
		this.nameInput.addEventListener("input", function() {
			self.validateInputs();
		});
		this.valueInput.addEventListener("input", function() {
			self.validateInputs();
		});
		
		// Initial validation
		this.validateInputs();
	} else {
		hostNode.textContent = "[Browser does not support Shadow DOM]";
		parent.insertBefore(hostNode,nextSibling);
	}
	
	this.domNodes.push(hostNode);
};

/*
Validate inputs and update button state
*/
SecretManagerInputWidget.prototype.validateInputs = function() {
	var name = this.nameInput.value.trim();
	var value = this.valueInput.value;
	
	// Check if name is valid (alphanumeric, dash, underscore)
	var isValidName = name && /^[a-zA-Z0-9_-]+$/.test(name);
	var hasValue = value.length > 0;
	
	this.addButton.disabled = !isValidName || !hasValue;
	
	// Clear status on new input
	this.hideStatus();
};

/*
Show status message
*/
SecretManagerInputWidget.prototype.showStatus = function(message, type) {
	this.statusNode.textContent = message;
	this.statusNode.className = "status " + (type || "");
	this.statusNode.style.display = "block";
	
	// Auto-hide success messages
	if(type === "success") {
		var self = this;
		setTimeout(function() {
			self.hideStatus();
		}, 3000);
	}
};

/*
Hide status message
*/
SecretManagerInputWidget.prototype.hideStatus = function() {
	this.statusNode.style.display = "none";
};

/*
Handle adding a secret
*/
SecretManagerInputWidget.prototype.handleAddSecret = function() {
	var self = this;
	var name = this.nameInput.value.trim();
	var value = this.valueInput.value;
	
	if(!name || !value) {
		this.showStatus("Please enter both name and value", "error");
		return;
	}
	
	// Check if name is valid
	if(!/^[a-zA-Z0-9_-]+$/.test(name)) {
		this.showStatus("Name can only contain letters, numbers, dash and underscore", "error");
		return;
	}
	
	// Check if secret already exists
	var secrets = $tw.utils.listSecrets();
	if(secrets.indexOf(name) !== -1) {
		this.showStatus("A secret with this name already exists", "error");
		return;
	}
	
	// Disable button during operation
	this.addButton.disabled = true;
	
	// Store the secret
	var success = $tw.utils.storeSecret(name, value);
	
	if(success) {
		// Clear inputs immediately
		this.nameInput.value = "";
		this.valueInput.value = "";
		
		// Show success
		this.showStatus("Secret added successfully", "success");
		
		// Send notification
		$tw.notifier.display("$:/language/Notifications/SecretAdded");
		
		// Trigger refresh of parent widget
		if(this.parentWidget) {
			this.parentWidget.refresh({"$:/secrets/vault": {modified: true}});
		}
	} else {
		this.showStatus("Failed to add secret", "error");
	}
	
	// Re-validate
	this.validateInputs();
};

/*
Compute the internal state of the widget
*/
SecretManagerInputWidget.prototype.execute = function() {
	// Make child widgets
	this.makeChildWidgets();
};

/*
Refresh the widget
*/
SecretManagerInputWidget.prototype.refresh = function(changedTiddlers) {
	// Update shadow DOM styles when palette changes
	if(changedTiddlers["$:/palette"] && this.updateShadowStyles) {
		this.updateShadowStyles();
	}
	// No need to refresh children, input is ephemeral
	return false;
};

exports["secret-manager-input"] = SecretManagerInputWidget;

})();
