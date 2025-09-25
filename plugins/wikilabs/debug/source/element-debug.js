/*\
title: $:/plugins/wikilabs/debug/custom-debug.js
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

				this._historyTiddler = "$:/config/wikilabs/debug/search-history";
				this._lastSearchTiddler = "$:/temp/wikilabs/debug/last-search";
				this._highlightedSuggestionIndex = -1;

				const popup = document.createElement("div");
				popup.setAttribute("class", "debug-popup");
				this._popup = popup;

				const style = document.createElement("style");
				style.textContent = `
					:host {
						/* Default values for themeable properties */
						--popup-bg-color: #fefefe;
						--popup-border: 1px solid #ccc;
						--popup-min-width: 350px;
						--popup-max-width: 600px;
						--popup-max-height: 500px;
						--popup-header-bg-color: #4CAF50;
						--popup-header-color: white;
						--function-content-color: blue;
					}
					.debug-popup {
						display: none; /* Hidden by default, shown with JS */
						position: fixed; /* Use fixed position for viewport-relative placement */
						z-index: 1000;
						background-color: var(--popup-bg-color);
						border: var(--popup-border);
						border-radius: 5px;
						padding: 10px;
						min-width: var(--popup-min-width);
						max-width: var(--popup-max-width);
						max-height: var(--popup-max-height);
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
						background-color: var(--popup-header-bg-color);
						color: var(--popup-header-color);
					}
					.debug-search-input {
						width: 98%;
						padding: 4px;
						margin-bottom: 8px;
						border: 1px solid #ccc;
						border-radius: 3px;
						font-size: 14px;
					}
					.debug-function-content {
						color: var(--function-content-color);
						display: block;
						margin-top: 3px;
					}
					.search-suggestions {
						display: none;
						position: absolute;
						border: 1px solid #ccc;
						background-color: var(--popup-bg-color);
						width: calc(98% - 2px); /* Match search input width */
						max-height: 150px;
						overflow-y: auto;
						z-index: 1001; /* Above the table */
						font-size: 14px;
					}
					.suggestion-item {
						padding: 8px;
						cursor: pointer;
					}
					.suggestion-item:hover, .suggestion-item.suggestion-active {
						background-color: #ddd;
					}
				`;

				this.shadowRoot.append(style, popup);

				const searchInput = document.createElement("input");
				searchInput.setAttribute("type", "text");
				searchInput.setAttribute("placeholder", "Filter variables...");
				searchInput.setAttribute("class", "debug-search-input");
				searchInput.setAttribute("part", "search-input"); // Expose this element for styling
				this._searchInput = searchInput;
				popup.append(searchInput);

				const suggestions = document.createElement("div");
				suggestions.setAttribute("class", "search-suggestions");
				this._suggestions = suggestions;
				popup.append(suggestions);

				// Add event listener for the search input
				searchInput.addEventListener("input", () => {
					this._filterTable();
					this._loadSearchHistory();
					this._showSuggestions();
				});
				searchInput.addEventListener("keydown", (e) => this._handleSearchInputKeydown(e));
				searchInput.addEventListener("focus", () => {
					this._loadSearchHistory();
					this._showSuggestions();
				});
				searchInput.addEventListener("blur", () => {
					// Delay hiding to allow click on suggestion
					setTimeout(() => this._hideSuggestions(), 150);
				});

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

			_showSuggestions() {
				this._suggestions.style.display = "block";
			}

			_hideSuggestions() {
				this._suggestions.style.display = "none";
			}

			_updateSuggestionHighlight() {
				const items = this._suggestions.querySelectorAll(".suggestion-item");
				items.forEach((item, index) => {
					if (index === this._highlightedSuggestionIndex) {
						item.classList.add("suggestion-active");
						item.scrollIntoView({ block: "nearest" });
					} else {
						item.classList.remove("suggestion-active");
					}
				});
			}

			_handleSuggestionClick(term) {
				this._searchInput.value = term;
				this._hideSuggestions();
				this._filterTable();
			}

			_handleSearchInputKeydown(event) {
				if (event.key === "ArrowDown" && this._suggestions.style.display === "none") {
					this._loadSearchHistory();
					this._showSuggestions();
				}

				const items = this._suggestions.querySelectorAll(".suggestion-item");
				if (this._suggestions.style.display === "none" || !items.length) {
					if (event.key === "Enter") {
						event.preventDefault();
						this._saveSearchTerm(this._searchInput.value);
						this._hideSuggestions();
					}
					return;
				}

				switch (event.key) {
					case "ArrowDown":
						event.preventDefault();
						this._highlightedSuggestionIndex++;
						if (this._highlightedSuggestionIndex >= items.length) {
							this._highlightedSuggestionIndex = 0;
						}
						this._updateSuggestionHighlight();
						break;
					case "ArrowUp":
						event.preventDefault();
						this._highlightedSuggestionIndex--;
						if (this._highlightedSuggestionIndex < 0) {
							this._highlightedSuggestionIndex = items.length - 1;
						}
						this._updateSuggestionHighlight();
						break;
					case "Enter":
						event.preventDefault();
						if (this._highlightedSuggestionIndex >= 0) {
							const selectedTerm = items[this._highlightedSuggestionIndex].textContent;
							this._handleSuggestionClick(selectedTerm);
							this._saveSearchTerm(selectedTerm);
						} else {
							this._saveSearchTerm(this._searchInput.value);
						}
						this._hideSuggestions();
						break;
				}
			}

			_saveSearchTerm(term) {
				term = term.trim();
				if (!term) {
					return;
				}
				let history = $tw.wiki.getTiddlerData(this._historyTiddler, []);
				// Remove from history if it exists, to move it to the top
				history = history.filter(item => item !== term);
				// Add to the beginning
				history.unshift(term);
				// Keep only the last 20
				history = history.slice(0, 20);
				$tw.wiki.setTiddlerData(this._historyTiddler, history);
			}

			_loadSearchHistory() {
				const history = $tw.wiki.getTiddlerData(this._historyTiddler, []);
				const suggestions = this._suggestions;
				if (!suggestions) {
					return;
				}
				suggestions.innerHTML = "";
				this._highlightedSuggestionIndex = -1;

				history.forEach((term, index) => {
					const item = document.createElement("div");
					item.setAttribute("class", "suggestion-item");
					item.textContent = term;
					item.addEventListener("mousedown", (e) => {
						e.preventDefault();
						this._handleSuggestionClick(term);
					});
					item.addEventListener("mouseenter", () => {
						this._highlightedSuggestionIndex = index;
						this._updateSuggestionHighlight();
					});
					suggestions.appendChild(item);
				});

				suggestions.addEventListener("mouseleave", () => {
					this._highlightedSuggestionIndex = -1;
					this._updateSuggestionHighlight();
				});
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
				const headerRow = document.createElement("tr");
				thead.append(headerRow);

				// Create headers safely using textContent to prevent XSS
				const th1 = document.createElement("th"); // Empty for type column
				const th2 = document.createElement("th");
				th2.textContent = "Variable";
				const th3 = document.createElement("th");
				th3.textContent = "Value";

				headerRow.append(th1, th2, th3);
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
				this._loadSearchHistory();

				if (this._searchInput) {
					this._searchInput.value = $tw.wiki.getTiddlerText(this._lastSearchTiddler) || "";
					this._filterTable();
				}

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
				this._hideSuggestions();
				if (this._searchInput) {
					$tw.wiki.setText(this._lastSearchTiddler, "text", undefined, this._searchInput.value);
				}
				this._popup.style.display = "none";
				document.removeEventListener("keydown", this._boundEscapeKeyListener, true);
				// Remove global wheel listener when popup is hidden
				document.body.removeEventListener("wheel", this._boundGlobalWheelListener);
			}

			_escapeKeyListener(event) {
				if (event.key === "Escape") {
					event.stopPropagation();
					if (this._suggestions.style.display === "block") {
						this._hideSuggestions();
					} else if (this._searchInput.value.length > 0) {
						this._searchInput.value = "";
						this._filterTable();
					} else {
						this.hide();
					}
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

	// --- Intersection Observer Implementation ---

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

	// Use a WeakMap to associate DOM nodes with their specific data and listeners
	const nodeDataMap = new WeakMap();

	/**
	 * Callback for the IntersectionObserver. Adds/removes event listeners as elements
	 * enter or leave the viewport.
	 * @param {IntersectionObserverEntry[]} entries - The entries that have changed.
	 */
	const handleIntersection = (entries) => {
		for (const entry of entries) {
			const domNode = entry.target;
			const data = nodeDataMap.get(domNode);

			if (!data) {
				continue;
			}

			if (entry.isIntersecting) {
				// Element is in view: add listeners if they aren't already active
				if (!data.listenersAttached) {
					domNode.addEventListener("mouseenter", data.mouseenterListener, true);
					domNode.addEventListener("mouseleave", data.mouseleaveListener, true);
					data.listenersAttached = true;
				}
			} else {
				// Element is out of view: remove listeners if they are active
				if (data.listenersAttached) {
					domNode.removeEventListener("mouseenter", data.mouseenterListener, true);
					domNode.removeEventListener("mouseleave", data.mouseleaveListener, true);
					data.listenersAttached = false;
				}
			}
		}
	};

	// Create a single observer to watch all relevant elements
	const observer = new IntersectionObserver(handleIntersection);

	$tw.hooks.addHook("th-dom-rendering-element", function(domNode, widget) {

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

		const mouseenterListener = function(event) {
			// Clear any existing timeout to prevent multiple popups or flickering
			if (globalDebugPopup._popupTimeout) {
				clearTimeout(globalDebugPopup._popupTimeout);
			}
			// Set a timeout to show the popup
			globalDebugPopup._popupTimeout = setTimeout(() => showPopupCallback(event), 1000); // Delay to show popup
		};

		const mouseleaveListener = function(event) {
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
		};

		// Store the listeners and their state in the WeakMap, associated with the domNode
		nodeDataMap.set(domNode, {
			mouseenterListener: mouseenterListener,
			mouseleaveListener: mouseleaveListener,
			listenersAttached: false // Start with listeners detached
		});

		// Start observing the element, but only if it is a valid Element
		if (domNode instanceof Element) {
			if(widget.getVariable("tv-debug") === "yes") {
				domNode.setAttribute("data-debug-xxxx", widget.getVariable("transclusion"));
				observer.observe(domNode);
			}
		}
	});
};