/*\
title: $:/plugins/wikilabs/custom-debug.js
type: application/javascript
module-type: startup

A startup module to replace the debug tooltip with a custom element.

\*/

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Export name and synchronous status
exports.name = "custom-debug-hook";
exports.platforms = ["browser"];
exports.after = ["startup"];
exports.synchronous = true;

exports.startup = function() {
	// Define the custom element that IS the popup
	if (!window.customElements.get("debug-info-popup")) {
		class DebugInfoPopup extends HTMLElement {
			constructor() {
				super();
				this.attachShadow({ mode: "open" });

				const popup = document.createElement("div");
				popup.setAttribute("class", "debug-popup");
				this._popup = popup;

				const closeButton = document.createElement("button");
				closeButton.setAttribute("class", "debug-close-button");
				closeButton.textContent = "x";
				closeButton.setAttribute("title", "Close");

				const style = document.createElement("style");
				style.textContent = `
					.debug-popup {
						display: none; /* Hidden by default, shown with JS */
						position: fixed; /* Use fixed position for viewport-relative placement */
						z-index: 1000;
						background-color: #fefefe;
						border: 1px solid #ccc;
						border-radius: 5px;
						padding: 10px;
						min-width: 350px;
						max-width: 600px;
						max-height: 500px;
						overflow-y: auto;
						box-shadow: 0px 4px 8px 0px rgba(0,0,0,0.2);
						font-family: "Source Code Pro", monospace;
						font-size: 12px;
						line-height: 1.4;
						white-space: pre-wrap;
						text-align: left;
					}
					.debug-popup-table {
						border-collapse: collapse;
						width: 100%;
					}
					.debug-popup-table td, .debug-popup-table th {
						border: 1px solid #ddd;
						padding: 3px;
						vertical-align: top;
					}
					.debug-popup-table tr:nth-child(even){background-color: #f9f9f9;}
					.debug-popup-table th {
						padding-top: 4px;
						padding-bottom: 4px;
						text-align: left;
						background-color: #4CAF50;
						color: white;
					}
				`;

				this.shadowRoot.append(style, popup);
				popup.append(closeButton);

				closeButton.addEventListener("click", () => this.hide());

				// Prevent scroll events from bleeding out
				popup.addEventListener("wheel", function(event) {
					const { scrollTop, scrollHeight, clientHeight } = this;
					const isAtTop = scrollTop === 0 && event.deltaY < 0;
					const isAtBottom = scrollHeight - clientHeight <= scrollTop && event.deltaY > 0;
					if (isAtTop || isAtBottom) {
						event.preventDefault();
					}
					event.stopPropagation();
				});

				// Prevent hover events from bleeding out
				popup.addEventListener("mousemove", function(event) {
					event.stopPropagation();
				});

				this._triggerElement = null;
				this._boundEscapeKeyListener = this._escapeKeyListener.bind(this);
				this._popupTimeout = null; // Initialize timeout ID
				this._hideTimeout = null; // Initialize hide timeout ID
				this._boundGlobalWheelListener = this._globalWheelListener.bind(this); // Bind global wheel listener
			}

			_globalWheelListener(event) {
				// Prevent scroll events on the document body if they are not originating from within the popup
				if (this._popup.style.display !== "none" && !this._popup.contains(event.target)) {
					event.preventDefault();
					event.stopPropagation();
				}
			}

			setData(data) {
				this._popup.innerHTML = ""; // Clear previous content

				// Re-append the close button after clearing content
				const closeButton = this.shadowRoot.querySelector(".debug-close-button");
				if (closeButton) {
					this._popup.append(closeButton);
				}

				const table = document.createElement("table");
				table.setAttribute("class", "debug-popup-table");

				const thead = document.createElement("thead");
				thead.innerHTML = "<tr><th>Variable</th><th>Value</th></tr>";
				table.append(thead);

				const tbody = document.createElement("tbody");
				for (const key in data) {
					if (Object.prototype.hasOwnProperty.call(data, key)) {
						const row = document.createElement("tr");
						const keyCell = document.createElement("td");
						const valueCell = document.createElement("td");
						keyCell.textContent = key;
						valueCell.textContent = data[key];
						row.append(keyCell, valueCell);
						tbody.append(row);
					}
				}
				table.append(tbody);
				this._popup.append(table);
			}

			showPopup(triggerElement) {
				if (triggerElement && typeof triggerElement.getBoundingClientRect === "function") {
					this._triggerElement = triggerElement;
				}

				if (!this._triggerElement) {
					return;
				}

				const popup = this._popup;
				popup.style.display = "block";

				const rect = this._triggerElement.getBoundingClientRect();
				const popupRect = popup.getBoundingClientRect();
				const viewportWidth = window.innerWidth;
				const viewportHeight = window.innerHeight;

				let top = rect.bottom + 5;
				let left = rect.left;

				if (top + popupRect.height > viewportHeight) {
					top = rect.top - popupRect.height - 5;
				}

				if (top < 0) {
					top = 5;
				}

				if (left < 0) {
					left = 5;
				}
				if (left + popupRect.width > viewportWidth) {
					left = viewportWidth - popupRect.width - 5;
				}

				popup.style.top = top + "px";
				popup.style.left = left + "px";

				// Add Escape key listener
				document.addEventListener("keydown", this._boundEscapeKeyListener, true);
				// Add global wheel listener to prevent scrolling outside the popup
				document.body.addEventListener("wheel", this._boundGlobalWheelListener, { passive: false });
			}

			hide() {
				this._popup.style.display = "none";
				document.removeEventListener("keydown", this._boundEscapeKeyListener, true);
				// Remove global wheel listener when popup is hidden
				document.body.removeEventListener("wheel", this._boundGlobalWheelListener);
			}

			_escapeKeyListener(event) {
				if (event.key === "Escape") {
					this.hide();
					event.stopPropagation();
				}
			}

			// Methods to handle mouse events on the popup itself
			handlePopupMouseEnter() {
				if (this._hideTimeout) {
					clearTimeout(this._hideTimeout);
					this._hideTimeout = null;
				}
			}

			handlePopupMouseLeave() {
				if (this._popup.style.display !== "none") { // Only hide if currently visible
					if (this._hideTimeout) {
						clearTimeout(this._hideTimeout);
					}
					this._hideTimeout = setTimeout(() => {
						this.hide();
						this._hideTimeout = null;
					}, 900); // 1000ms delay before hiding
				}
			}
		}
		window.customElements.define("debug-info-popup", DebugInfoPopup);
	}

	let globalDebugPopup = document.getElementById("tw-debug-popup-instance");
	if (!globalDebugPopup) {
		globalDebugPopup = document.createElement("debug-info-popup");
		globalDebugPopup.id = "tw-debug-popup-instance";
		document.body.appendChild(globalDebugPopup);

		// Add event listeners to the popup itself to manage hide delay
		globalDebugPopup.addEventListener("mouseenter", function() {
			globalDebugPopup.handlePopupMouseEnter();
		});
		globalDebugPopup.addEventListener("mouseleave", function() {
			globalDebugPopup.handlePopupMouseLeave();
		});
	}

	$tw.hooks.addHook("th-rendering-debug", function(domNode, widget) {
		domNode.addEventListener("mouseenter", function(event) {
			// Clear any existing timeout to prevent multiple popups or flickering
			if (globalDebugPopup._popupTimeout) {
				clearTimeout(globalDebugPopup._popupTimeout);
			}
			// Set a timeout to show the popup after 1000ms
			globalDebugPopup._popupTimeout = setTimeout(() => {
				// If the popup is already visible, do nothing (no toggle behavior on hover)
				if (globalDebugPopup._popup.style.display !== "none") {
					return;
				}

				var test = widget.getVariable("transclusion");
				var data = Object.create(null);
				var allVars = Object.create(null);
				var filter;

				for (var v in widget.variables) {
					let variable = widget.parentWidget && widget.parentWidget.variables[v];
					if (variable && variable.isFunctionDefinition) {
						if (widget.getVariable("tv-debug-functions") === "yes") allVars[v] = variable.value;
					} else if (variable && variable.isProcedureDefinition) {
						if (widget.getVariable("tv-debug-procedures") === "yes") allVars[v] = widget.getVariable(v, { defaultValue: "" });
					} else if (variable && variable.isMacroDefinition) {
						if (widget.getVariable("tv-debug-macros") === "yes") allVars[v] = widget.getVariable(v, { defaultValue: "" });
					} else if (variable && variable.isWidgetDefinition) {
						if (widget.getVariable("tv-debug-widgets") === "yes") allVars[v] = widget.getVariable(v, { defaultValue: "" });
					} else {
						allVars[v] = widget.getVariable(v, { defaultValue: "" });
					}
				}

				filter = widget.getVariable("tv-debug-filter", { defaultValue: "[limit[30]]" });
				if (filter) {
					var filteredVars = widget.wiki.compileFilter(filter).call(widget.wiki, widget.wiki.makeTiddlerIterator(allVars));
					$tw.utils.each(filteredVars, function(name) {
						data[name] = allVars[name];
					});
				}

				var finalData = Object.create(null);
				finalData["transclusion"] = test || "";

				$tw.utils.each((filter) ? data : allVars, function(el, title) {
					let str = "";
					if (typeof el === "string" && el.includes("\n")) {
						str = el.split("\n")[0] + " ...";
					} else {
						str = (el) ? String(el) : "";
					}
					if (str) finalData[title] = str;
				});

				globalDebugPopup.setData(finalData);
				globalDebugPopup.showPopup(domNode);
				globalDebugPopup._popupTimeout = null; // Clear timeout ID after execution
			}, 1000);
		}, true);

		domNode.addEventListener("mouseleave", function(event) {
			// Clear the show timeout if mouse leaves before popup shows
			if (globalDebugPopup._popupTimeout) {
				clearTimeout(globalDebugPopup._popupTimeout);
				globalDebugPopup._popupTimeout = null;
			}
			// Set a hide timeout if the popup is visible
			if (globalDebugPopup._popup.style.display !== "none") {
				if (globalDebugPopup._hideTimeout) {
					clearTimeout(globalDebugPopup._hideTimeout);
				}
				globalDebugPopup._hideTimeout = setTimeout(() => {
					globalDebugPopup.hide();
					globalDebugPopup._hideTimeout = null;
				}, 900); // 900ms delay before hiding
			}
		}, true);
	});
};