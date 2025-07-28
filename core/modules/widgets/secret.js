/*\
title: $:/core/modules/widgets/secret.js
type: application/javascript
module-type: widget

Secret widget for displaying encrypted secrets using Shadow DOM

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var SecretWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
SecretWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
SecretWidget.prototype.render = function(parent,nextSibling) {
	var self = this;
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	
	// Create the host element
	var hostNode = this.document.createElement("span");
	hostNode.className = "tc-secret-host";
	
	// Check if Shadow DOM is supported
	if(hostNode.attachShadow) {
		// Create shadow root with closed mode for maximum security
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
			
			// Get colors from the computed styles
			var backgroundColor = twStyle.backgroundColor || parentStyle.backgroundColor || computedStyle.backgroundColor || '#ffffff';
			var color = twStyle.color || parentStyle.color || computedStyle.color || '#333333';
			
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
			
			// Get code background/foreground colors if available
			var codeElement = self.document.createElement('code');
			twElement.appendChild(codeElement);
			var codeStyle = window.getComputedStyle(codeElement);
			var codeBackground = codeStyle.backgroundColor || (isDark ? adjustColor(backgroundColor, 0.1) : adjustColor(backgroundColor, -0.05));
			var codeForeground = codeStyle.color || color;
			twElement.removeChild(codeElement);
			
			// Calculate derived colors
			var buttonBg = codeBackground;
			var buttonBorder = isDark ? adjustColor(backgroundColor, 0.2) : adjustColor(backgroundColor, -0.15);
			var buttonHoverBg = isDark ? adjustColor(codeBackground, 0.1) : adjustColor(codeBackground, -0.1);
			var contentBg = codeBackground;
			var contentForeground = codeForeground;
			
			// Update styles
			self.styleNode.textContent = `
			:host {
				display: inline-block;
				vertical-align: baseline;
			}
			.secret-container {
				display: inline-flex;
				align-items: center;
				gap: 0.25em;
			}
			.secret-button {
				background: ${buttonBg};
				border: 1px solid ${buttonBorder};
				border-radius: 3px;
				padding: 2px 6px;
				cursor: pointer;
				font-size: 0.85em;
				font-family: inherit;
				color: ${contentForeground};
				transition: all 0.15s ease;
				user-select: none;
			}
			.secret-button:hover {
				background: ${buttonHoverBg};
				border-color: ${adjustColor(buttonBorder, isDark ? 0.1 : -0.1)};
			}
			.secret-button:active {
				transform: translateY(1px);
			}
			.secret-content {
				font-family: monospace;
				background: ${contentBg};
				border: 1px solid transparent;
				color: ${contentForeground};
				padding: 2px 6px;
				border-radius: 3px;
				user-select: text;
				max-width: 400px;
				overflow-wrap: break-word;
			}
			.secret-content.hidden {
				display: none;
			}
			.secret-error {
				color: ${isDark ? '#ff6666' : '#cc0000'} !important;
				font-style: italic;
				font-size: 0.9em;
				background: transparent !important;
			}
			.secret-locked {
				opacity: 0.7;
			}
			.secret-icon {
				font-size: 1.1em;
				margin-right: 0.2em;
			}
			.secret-copy-button {
				background: ${buttonBg};
				border: 1px solid ${buttonBorder};
				border-radius: 3px;
				padding: 2px 6px;
				cursor: pointer;
				font-size: 0.85em;
				margin-left: 0.25em;
				transition: all 0.15s ease;
				user-select: none;
			}
			.secret-copy-button:hover {
				background: ${buttonHoverBg};
				border-color: ${adjustColor(buttonBorder, isDark ? 0.1 : -0.1)};
			}
			.secret-copy-button:active {
				transform: translateY(1px);
			}
			.secret-copy-button.hidden {
				display: none;
			}
		`;
		};
		
		// Initial style update
		this.updateShadowStyles();
		
		// Create container
		var container = this.document.createElement("div");
		container.className = "secret-container";
		
		// Create button
		this.buttonNode = this.document.createElement("button");
		this.buttonNode.className = "secret-button";
		this.updateButtonState("locked");
		
		// Create content span
		this.contentNode = this.document.createElement("span");
		this.contentNode.className = "secret-content hidden";
		
		// Create copy button
		this.copyButton = this.document.createElement("button");
		this.copyButton.className = "secret-copy-button hidden";
		this.copyButton.innerHTML = '📋';
		this.copyButton.title = "Copy to clipboard";
		
		// Add click handlers
		this.buttonNode.addEventListener("click", function(e) {
			e.preventDefault();
			e.stopPropagation();
			self.handleClick();
		});
		
		this.copyButton.addEventListener("click", function(e) {
			e.preventDefault();
			e.stopPropagation();
			self.copyToClipboard();
		});
		
		container.appendChild(this.buttonNode);
		container.appendChild(this.contentNode);
		container.appendChild(this.copyButton);
		this.shadowRoot.appendChild(container);
		
		// Check initial state
		this.checkState();
	} else {
		// Fallback for browsers without Shadow DOM
		hostNode.textContent = "[Browser does not support Shadow DOM]";
		parent.insertBefore(hostNode,nextSibling);
	}
	
	this.domNodes.push(hostNode);
};

/*
Update button appearance based on state
*/
SecretWidget.prototype.updateButtonState = function(state) {
	if(!this.buttonNode) return;
	
	var icons = {
		locked: "🔒",
		unlocked: "🔓", 
		missing: "⚠️",
		error: "❌"
	};
	
	var labels = {
		locked: this.secretName || "secret",
		unlocked: this.secretName || "secret",
		missing: "not found",
		error: "error"
	};
	
	this.buttonNode.innerHTML = '<span class="secret-icon">' + icons[state] + '</span>' + labels[state];
	this.buttonNode.className = "secret-button" + (state === "locked" ? " secret-locked" : "");
};

/*
Check the current state and update UI
*/
SecretWidget.prototype.checkState = function() {
	var state = $tw.utils.getSecretsStoreState();
	
	if(state === "unencrypted") {
		this.showError("No password set");
		this.updateButtonState("error");
	} else if(!this.secretName) {
		this.showError("No secret name specified");
		this.updateButtonState("error");
	} else {
		// Check if secret exists
		var vault = this.wiki.getTiddler("$:/secrets/vault");
		if(!vault || !vault.fields[this.secretName]) {
			this.updateButtonState("missing");
		} else {
			this.updateButtonState(state === "unlocked" ? "unlocked" : "locked");
		}
	}
};

/*
Handle click on the secret button
*/
SecretWidget.prototype.handleClick = function() {
	var self = this;
	
	// Toggle if already showing
	if(!this.contentNode.classList.contains("hidden")) {
		this.hideSecret();
		return;
	}
	
	var state = $tw.utils.getSecretsStoreState();
	
	if(state === "unencrypted") {
		this.showError("Please set a password first");
		return;
	}
	
	// Get the encrypted secret
	var encryptedSecret = $tw.utils.getSecret(this.secretName);
	
	if(encryptedSecret === null && state === "unlocked") {
		// Secret doesn't exist or couldn't be decrypted
		var vault = this.wiki.getTiddler("$:/secrets/vault");
		if(!vault || !vault.fields[this.secretName]) {
			this.showError("Secret not found");
			this.updateButtonState("missing");
		} else {
			this.showError("Decryption failed");
			this.updateButtonState("error");
		}
		return;
	}
	
	if(state === "locked") {
		// Need to unlock first
		$tw.passwordPrompt.createPrompt({
			serviceName: "Enter password to reveal secret",
			noUserName: true,
			canCancel: true,
			submitText: "Unlock",
			callback: function(data) {
				if(!data) return true;
				
				// Verify password
				if($tw.utils.verifySecretsPassword(data.password)) {
					$tw.crypto.setPassword(data.password);
					// Try again now that we're unlocked
					self.handleClick();
					return true;
				} else {
					// Wrong password
					return false;
				}
			}
		});
	} else if(state === "unlocked") {
		// We're unlocked, show the secret
		if(encryptedSecret) {
			this.revealSecret(encryptedSecret);
		}
	}
};

/*
Show an error message
*/
SecretWidget.prototype.showError = function(message) {
	this.contentNode.textContent = message;
	this.contentNode.className = "secret-content secret-error";
	this.copyButton.className = "secret-copy-button hidden";
};

/*
Hide the secret
*/
SecretWidget.prototype.hideSecret = function() {
	this.contentNode.textContent = "";
	this.contentNode.className = "secret-content hidden";
	this.copyButton.className = "secret-copy-button hidden";
	this.updateButtonState($tw.utils.getSecretsStoreState() === "unlocked" ? "unlocked" : "locked");
	
	if(this.hideTimeout) {
		clearTimeout(this.hideTimeout);
		this.hideTimeout = null;
	}
};

/*
Reveal the secret
*/
SecretWidget.prototype.revealSecret = function(secret) {
	this.contentNode.textContent = secret;
	this.contentNode.className = "secret-content";
	this.copyButton.className = "secret-copy-button";
	this.updateButtonState("unlocked");
	
	// Auto-hide after timeout
	if(this.autoHide > 0) {
		var self = this;
		if(this.hideTimeout) {
			clearTimeout(this.hideTimeout);
		}
		this.hideTimeout = setTimeout(function() {
			self.hideSecret();
		}, this.autoHide * 1000);
	}
};

/*
Copy the secret to clipboard
*/
SecretWidget.prototype.copyToClipboard = function() {
	var self = this;
	var secretText = this.contentNode.textContent;
	
	if(!secretText) return;
	
	// Create a textarea element to copy from (outside shadow DOM)
	var textarea = this.document.createElement("textarea");
	textarea.value = secretText;
	textarea.style.position = "fixed";
	textarea.style.left = "-999999px";
	this.document.body.appendChild(textarea);
	
	try {
		// Select and copy
		textarea.select();
		var success = this.document.execCommand("copy");
		
		if(success) {
			// Change button to show success
			var originalHTML = this.copyButton.innerHTML;
			this.copyButton.innerHTML = "✓";
			setTimeout(function() {
				self.copyButton.innerHTML = originalHTML;
			}, 1500);
			
			// Show notification
			$tw.notifier.display("$:/language/Notifications/CopiedToClipboard/Succeeded");
		} else {
			$tw.notifier.display("$:/language/Notifications/CopiedToClipboard/Failed");
		}
	} catch(err) {
		$tw.notifier.display("$:/language/Notifications/CopiedToClipboard/Failed");
	} finally {
		// Clean up
		this.document.body.removeChild(textarea);
	}
};

/*
Compute the internal state of the widget
*/
SecretWidget.prototype.execute = function() {
	// Get attributes
	this.secretName = this.getAttribute("name");
	this.autoHide = parseInt(this.getAttribute("autohide", "10"));
	
	// Make child widgets
	this.makeChildWidgets();
};

/*
Refresh the widget
*/
SecretWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(Object.keys(changedAttributes).length > 0 || 
	   changedTiddlers["$:/secrets/vault"] || 
	   changedTiddlers["$:/isEncrypted"]) {
		this.refreshSelf();
		return true;
	}
	// Update shadow DOM styles when palette changes
	if(changedTiddlers["$:/palette"] && this.updateShadowStyles) {
		this.updateShadowStyles();
	}
	return this.refreshChildren(changedTiddlers);
};

/*
Remove the widget
*/
SecretWidget.prototype.removeChildDomNodes = function() {
	if(this.hideTimeout) {
		clearTimeout(this.hideTimeout);
	}
	if(this.contentNode) {
		this.contentNode.textContent = "";
	}
	Widget.prototype.removeChildDomNodes.call(this);
};

exports.secret = SecretWidget;

})();
