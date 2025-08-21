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
exports.before = ["startup"];
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
					.debug-search-input {
						width: 98%;
						padding: 4px;
						margin-bottom: 8px;
						border: 1px solid #ccc;
						border-radius: 3px;
					}
					.debug-function-content {
						color: blue;
						display: block;
						margin-top: 3px;
					}
				`;

				this.shadowRoot.append(style, popup);

				const searchInput = document.createElement("input");
				searchInput.setAttribute("type", "text");
				searchInput.setAttribute("placeholder", "Filter variables...");
				searchInput.setAttribute("class", "debug-search-input");
				this._searchInput = searchInput;
				popup.append(searchInput);

				// Add event listener for the search input
				searchInput.addEventListener("input", () => this._filterTable());

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

			_filterTable() {
				let filterText = this._searchInput.value.toLowerCase();
				const table = this._popup.querySelector(".debug-popup-table");
				if (!table) return;

				const rows = table.querySelectorAll("tbody tr");

				let typeFilter = null;
				let searchFilter = '';

				// Check for special type-filtering commands
				if (filterText.startsWith(':')) {
					const parts = filterText.split(' ');
					const command = parts[0];
					
					switch (command) {
						case ':m':
							typeFilter = 'm';
							break;
						case ':p':
							typeFilter = 'p';
							break;
						case ':f':
							typeFilter = 'f';
							break;
						case ':w':
							typeFilter = 'w';
							break;
						case ':-':
							typeFilter = ''; // Empty string for no type
							break;
					}

					if (typeFilter !== null) {
						searchFilter = parts.slice(1).join(' ').trim();
					} else {
						// Not a valid command, treat the whole thing as a normal search
						searchFilter = filterText;
					}
				} else {
					searchFilter = filterText;
				}

				rows.forEach(row => {
					const typeCell = row.cells[0];
					const variableCell = row.cells[1];
					const valueCell = row.cells[2];

					if (!typeCell || !variableCell || !valueCell) return;

					const typeText = typeCell.textContent.toLowerCase();
					const variableText = variableCell.textContent.toLowerCase();
					const valueText = valueCell.textContent.toLowerCase();

					let typeMatch = true;
					if (typeFilter !== null) {
						typeMatch = (typeText === typeFilter);
					}

					let searchMatch = true;
					if (searchFilter) {
						searchMatch = variableText.includes(searchFilter) || valueText.includes(searchFilter);
					}

					if (typeMatch && searchMatch) {
						row.style.display = "";
					} else {
						row.style.display = "none";
					}
				});
			}

			setData(data) {
				// Clear the search input
				if (this._searchInput) {
					this._searchInput.value = "";
				}

				// Find and remove the old table if it exists
				const oldTable = this._popup.querySelector(".debug-popup-table");
				if (oldTable) {
					oldTable.remove();
				}

				const table = document.createElement("table");
				table.setAttribute("class", "debug-popup-table");

				const thead = document.createElement("thead");
				thead.innerHTML = "<tr><th></th><th>Variable</th><th>Value</th></tr>";
				table.append(thead);

				const tbody = document.createElement("tbody");
				for (const key in data) {
					if (Object.prototype.hasOwnProperty.call(data, key)) {
						const row = document.createElement("tr");
						const typeCell = document.createElement("td");
						const keyCell = document.createElement("td");
						const valueCell = document.createElement("td");

						typeCell.textContent = data[key].type || "";
						keyCell.textContent = key;

						// Special handling for functions to show definition and content
						if (data[key].type === 'f' && data[key].content) {
							const valueContainer = document.createElement("div");

							const definitionSpan = document.createElement("span");
							definitionSpan.textContent = data[key].value;
							
							const contentSpan = document.createElement("span");
							contentSpan.textContent = data[key].content;
							contentSpan.classList.add("debug-function-content");

							valueContainer.append(definitionSpan, contentSpan);
							valueCell.append(valueContainer);
						} else {
							// Default behavior for all other types
							valueCell.textContent = data[key].value;
						}

						row.append(typeCell, keyCell, valueCell);
						tbody.append(row);
					}
				}
				table.append(tbody);
				this._popup.append(table);
			}

			showPopup(triggerElement, mouseX, mouseY) {
				if (triggerElement && typeof triggerElement.getBoundingClientRect === "function") {
					this._triggerElement = triggerElement;
				}

				if (!this._triggerElement) {
					return;
				}

				const popup = this._popup;
				popup.style.display = "block";

				const popupRect = popup.getBoundingClientRect();
				const viewportWidth = window.innerWidth;
				const viewportHeight = window.innerHeight;

				let top = mouseY;
				let left = mouseX;

				if (top < 0) {
					top = 5;
				}

				if (top + popupRect.height > viewportHeight) {
					top = viewportHeight - popupRect.height - 5;
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
					}, 900); // 900ms delay before hiding
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

		/**
		 * Gathers and formats all relevant variable data from the current widget context.
		 * @param {object} widget - The widget instance to inspect.
		 * @returns {object} A formatted object containing variable data for the popup.
		 */
		function _gatherVariableData(widget) {
			var test = widget.getVariable("transclusion");
			var data = Object.create(null);
			var allVars = Object.create(null);
			var filter;

			for (var v in widget.variables) {
				let variable = widget.parentWidget && widget.parentWidget.variables[v];
				let entry = null;

				if (variable && variable.isFunctionDefinition) {
					if (widget.getVariable("tv-debug-functions") === "yes") {
						entry = {
							value: variable.value,
							type: 'f',
							content: widget.getVariable(v, { defaultValue: "" })
						};
					}
				} else if (variable && variable.isProcedureDefinition) {
					if (widget.getVariable("tv-debug-procedures") === "yes") {
						entry = { value: widget.getVariable(v, { defaultValue: "" }), type: 'p' };
					}
				} else if (variable && variable.isMacroDefinition) {
					if (widget.getVariable("tv-debug-macros") === "yes") {
						entry = { value: widget.getVariable(v, { defaultValue: "" }), type: 'm' };
					}
				} else if (variable && variable.isWidgetDefinition) {
					if (widget.getVariable("tv-debug-widgets") === "yes") {
						entry = { value: widget.getVariable(v, { defaultValue: "" }), type: 'w' };
					}
				} else {
					entry = { value: widget.getVariable(v, { defaultValue: "" }), type: '' };
				}

				if (entry && entry.value !== undefined) {
					allVars[v] = entry;
				}
			}

			filter = widget.getVariable("tv-debug-filter", { defaultValue: "[limit[100]]" });
			if (filter) {
				var filteredVars = widget.wiki.compileFilter(filter).call(widget.wiki, widget.wiki.makeTiddlerIterator(Object.keys(allVars)));
				$tw.utils.each(filteredVars, function(name) {
					data[name] = allVars[name];
				});
			}

			var finalData = Object.create(null);
			finalData["transclusion"] = { value: test || "", type: "" };

			$tw.utils.each((filter) ? data : allVars, function(el, title) {
				let str = "";
				if (typeof el.value === "string" && el.value.includes("\n")) {
					str = el.value.split("\n")[0] + " ...";
				} else {
					str = (el.value) ? String(el.value) : "";
				}
				if (str) {
					finalData[title] = { value: str, type: el.type, content: el.content }; // Preserve content
				}
			});
			return finalData;
		}

		/**
		 * The callback function to execute after a delay when the mouse enters the element.
		 * It gathers data and shows the popup.
		 * @param {MouseEvent} event - The mouse event.
		 */
		const showPopupCallback = (event) => {
			if (globalDebugPopup._popup.style.display !== "none") {
				return;
			}
			const finalData = _gatherVariableData(widget);
			globalDebugPopup.setData(finalData);
			globalDebugPopup.showPopup(domNode, event.clientX, event.clientY);
			globalDebugPopup._popupTimeout = null; // Clear timeout ID after execution
		};

		domNode.addEventListener("mouseenter", function(event) {
			// Clear any existing timeout to prevent multiple popups or flickering
			if (globalDebugPopup._popupTimeout) {
				clearTimeout(globalDebugPopup._popupTimeout);
			}
			// Set a timeout to show the popup
			globalDebugPopup._popupTimeout = setTimeout(() => showPopupCallback(event), 1000); // Delay to show popup
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
				}, 900); // Delay before hiding
			}
		}, true);
	});
};