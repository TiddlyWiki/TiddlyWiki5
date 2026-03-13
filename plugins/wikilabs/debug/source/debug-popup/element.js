/*\
title: $:/plugins/wikilabs/debug/element.js
type: application/javascript
module-type: library

The DebugInfoPopup custom element definition.
\*/
"use strict";

class DebugInfoPopup extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });

		this._historyTiddler = "$:/config/wikilabs/debug/search-history";
		this._lastSearchTiddler = "$:/temp/wikilabs/debug/last-search";
		this._highlightedSuggestionIndex = -1;

		const popup = document.createElement("div");
		popup.setAttribute("class", "debug-popup");
		popup.style.display = "none";
		this._popup = popup;

		const style = document.createElement("style");
		style.textContent = $tw.wiki.getTiddlerText("$:/plugins/wikilabs/debug/styles.css");

		this.shadowRoot.append(style, popup);

		const dragHandle = document.createElement("div");
		dragHandle.setAttribute("class", "debug-popup-drag-handle");
		dragHandle.textContent = "⋮⋮";
		popup.append(dragHandle);

		// Drag-to-move via the handle
		this._isDragging = false;
		dragHandle.addEventListener("mousedown", (e) => {
			e.preventDefault();
			e.stopPropagation();
			this._isDragging = true;
			const startX = e.clientX, startY = e.clientY;
			const startLeft = parseInt(popup.style.left, 10) || 0;
			const startTop = parseInt(popup.style.top, 10) || 0;
			const onMouseMove = (ev) => {
				ev.preventDefault();
				ev.stopPropagation();
				popup.style.left = (startLeft + ev.clientX - startX) + "px";
				popup.style.top = (startTop + ev.clientY - startY) + "px";
			};
			const onMouseUp = (ev) => {
				ev.stopPropagation();
				this._isDragging = false;
				document.removeEventListener("mousemove", onMouseMove, true);
				document.removeEventListener("mouseup", onMouseUp, true);
			};
			document.addEventListener("mousemove", onMouseMove, true);
			document.addEventListener("mouseup", onMouseUp, true);
		});

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

		suggestions.addEventListener("mouseleave", () => {
			this._highlightedSuggestionIndex = -1;
			this._updateSuggestionHighlight();
		});

		// Right-click on selected text copies it to clipboard
		popup.addEventListener("contextmenu", (e) => {
			if(this._tryCopySelection(e.clientX, e.clientY)) {
				e.preventDefault();
			}
		});

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
			if(isAtTop || isAtBottom) {
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
		this._boundHandlePopupMouseEnter = this.handlePopupMouseEnter.bind(this);
		this._boundHandlePopupMouseLeave = this.handlePopupMouseLeave.bind(this);
	}

	connectedCallback() {
		this.addEventListener("mouseenter", this._boundHandlePopupMouseEnter);
		this.addEventListener("mouseleave", this._boundHandlePopupMouseLeave);
	}

	disconnectedCallback() {
		this.removeEventListener("mouseenter", this._boundHandlePopupMouseEnter);
		this.removeEventListener("mouseleave", this._boundHandlePopupMouseLeave);
		// Clean up global listeners in case the element is removed while popup is visible
		document.removeEventListener("keydown", this._boundEscapeKeyListener, true);
		document.body.removeEventListener("wheel", this._boundGlobalWheelListener);
		if(this._hideTimeout) {
			clearTimeout(this._hideTimeout);
			this._hideTimeout = null;
		}
		if(this._popupTimeout) {
			clearTimeout(this._popupTimeout);
			this._popupTimeout = null;
		}
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
			if(index === this._highlightedSuggestionIndex) {
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
		if(event.key === "ArrowDown" && this._suggestions.style.display === "none") {
			this._loadSearchHistory();
			this._showSuggestions();
		}

		const items = this._suggestions.querySelectorAll(".suggestion-item");
		if(this._suggestions.style.display === "none" || !items.length) {
			if(event.key === "Enter") {
				event.preventDefault();
				this._saveSearchTerm(this._searchInput.value);
				this._hideSuggestions();
			}
			return;
		}

		switch(event.key) {
			case "ArrowDown":
				event.preventDefault();
				this._highlightedSuggestionIndex++;
				if(this._highlightedSuggestionIndex >= items.length) {
					this._highlightedSuggestionIndex = 0;
				}
				this._updateSuggestionHighlight();
				break;
			case "ArrowUp":
				event.preventDefault();
				this._highlightedSuggestionIndex--;
				if(this._highlightedSuggestionIndex < 0) {
					this._highlightedSuggestionIndex = items.length - 1;
				}
				this._updateSuggestionHighlight();
				break;
			case "Enter":
				event.preventDefault();
				if(this._highlightedSuggestionIndex >= 0) {
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
		if(!term) {
			return;
		}
		let history = $tw.wiki.getTiddlerData(this._historyTiddler, []);
		// Remove from history if it exists, to move it to the top
		history = history.filter((item) => item !== term);
		// Add to the beginning
		history.unshift(term);
		// Keep only the last 20
		history = history.slice(0, 20);
		$tw.wiki.setTiddlerData(this._historyTiddler, history);
	}

	_loadSearchHistory() {
		const history = $tw.wiki.getTiddlerData(this._historyTiddler, []);
		const suggestions = this._suggestions;
		if(!suggestions) {
			return;
		}
		suggestions.replaceChildren();
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
	}

	_globalWheelListener(event) {
		// Prevent scroll events on the document body if they are not originating from within the popup
		if(this._popup.style.display !== "none" && !this._popup.contains(event.target)) {
			event.preventDefault();
			event.stopPropagation();
		}
	}

	_filterTable() {
		let filterText = this._searchInput.value.toLowerCase();
		const table = this._popup.querySelector(".debug-popup-table");
		if(!table) return;

		const rows = table.querySelectorAll("tbody tr");

		let typeFilter = null;
		let searchFilter = "";

		// Check for special type-filtering commands
		if(filterText.startsWith(":")) {
			const parts = filterText.split(" ");
			const command = parts[0];
				
			switch(command) {
				case ":m":
					typeFilter = "m";
					break;
				case ":p":
					typeFilter = "p";
					break;
				case ":f":
					typeFilter = "f";
					break;
				case ":w":
					typeFilter = "w";
					break;
				case ":-":
					typeFilter = ""; // Empty string for no type
					break;
			}

			if(typeFilter !== null) {
				searchFilter = parts.slice(1).join(" ").trim();
			} else {
				// Not a valid command, treat the whole thing as a normal search
				searchFilter = filterText;
			}
		} else {
			searchFilter = filterText;
		}

		rows.forEach((row) => {
			const typeCell = row.cells[0];
			const variableCell = row.cells[1];
			const valueCell = row.cells[2];

			if(!typeCell || !variableCell || !valueCell) return;

			const typeText = typeCell.textContent.toLowerCase();
			const variableText = variableCell.textContent.toLowerCase();
			const valueText = valueCell.textContent.toLowerCase();

			let typeMatch = true;
			if(typeFilter !== null) {
				typeMatch = (typeText === typeFilter);
			}

			let searchMatch = true;
			if(searchFilter) {
				searchMatch = variableText.includes(searchFilter) || valueText.includes(searchFilter);
			}

			if(typeMatch && searchMatch) {
				row.style.display = "";
			} else {
				row.style.display = "none";
			}
		});
	}

	setData(data) {
		// Clear the search input
		if(this._searchInput) {
			this._searchInput.value = "";
		}

		// Find and remove the old table if it exists
		const oldTable = this._popup.querySelector(".debug-popup-table");
		if(oldTable) {
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
		for(const key in data) {
			if(Object.prototype.hasOwnProperty.call(data, key)) {
				const row = document.createElement("tr");
				const typeCell = document.createElement("td");
				const keyCell = document.createElement("td");
				const valueCell = document.createElement("td");

				typeCell.textContent = data[key].type || "";
				keyCell.textContent = key;

				// Special handling for functions to show definition and content
				if(data[key].type === "f" && data[key].content) {
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
		if(this._isDragging) {
			return;
		}
		this._loadSearchHistory();

		if(this._searchInput) {
			this._searchInput.value = $tw.wiki.getTiddlerText(this._lastSearchTiddler) || "";
			this._filterTable();
		}

		if(triggerElement && typeof triggerElement.getBoundingClientRect === "function") {
			// Reset previous trigger element back to "yes"
			if(this._triggerElement && this._triggerElement !== triggerElement) {
				this._triggerElement.setAttribute("data-debug", "yes");
			}
			this._triggerElement = triggerElement;
			triggerElement.setAttribute("data-debug", "active");
		}

		if(!this._triggerElement) {
			return;
		}

		const popup = this._popup;
		popup.style.display = "block";

		const popupRect = popup.getBoundingClientRect();
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;

		let top = mouseY;
		let left = mouseX;

		if(top < 0) {
			top = 5;
		}

		if(top + popupRect.height > viewportHeight) {
			top = viewportHeight - popupRect.height - 5;
		}

		if(left < 0) {
			left = 5;
		}
		if(left + popupRect.width > viewportWidth) {
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
		if(this._searchInput) {
			$tw.wiki.setText(this._lastSearchTiddler, "text", undefined, this._searchInput.value);
		}
		if(this._triggerElement) {
			this._triggerElement.setAttribute("data-debug", "yes");
		}
		this._popup.style.display = "none";
		document.removeEventListener("keydown", this._boundEscapeKeyListener, true);
		// Remove global wheel listener when popup is hidden
		document.body.removeEventListener("wheel", this._boundGlobalWheelListener);
	}

	_escapeKeyListener(event) {
		if(event.key === "Escape") {
			event.stopPropagation();
			if(this._suggestions.style.display === "block") {
				this._hideSuggestions();
			} else if(this._searchInput.value.length > 0) {
				this._searchInput.value = "";
				this._filterTable();
			} else {
				this.hide();
			}
		}
	}

	_tryCopySelection(x, y) {
		const selection = this.shadowRoot.getSelection
			? this.shadowRoot.getSelection()
			: document.getSelection();
		const selectedText = selection ? selection.toString() : "";
		if(selectedText && selection.rangeCount > 0) {
			const range = selection.getRangeAt(0);
			const rect = range.getBoundingClientRect();
			if(x >= rect.left && x <= rect.right &&
				y >= rect.top && y <= rect.bottom) {
				navigator.clipboard.writeText(selectedText);
				this._showCopyFeedback(x, y);
				return true;
			}
		}
		return false;
	}

	_showCopyFeedback(x, y) {
		const tooltip = document.createElement("div");
		tooltip.setAttribute("class", "copy-feedback");
		tooltip.textContent = "Copied!";
		this.shadowRoot.appendChild(tooltip);
		// Position relative to viewport using fixed positioning
		tooltip.style.left = x + "px";
		tooltip.style.top = (y - 30) + "px";
		setTimeout(() => tooltip.remove(), 1200);
	}

	// Methods to handle mouse events on the popup itself
	handlePopupMouseEnter() {
		if(this._hideTimeout) {
			clearTimeout(this._hideTimeout);
			this._hideTimeout = null;
		}
	}

	handlePopupMouseLeave() {
		if(this._popup.style.display !== "none") { // Only hide if currently visible
			if(this._hideTimeout) {
				clearTimeout(this._hideTimeout);
			}
			this._hideTimeout = setTimeout(() => {
				this.hide();
				this._hideTimeout = null;
			}, 900); // 900ms delay before hiding
		}
	}
}

exports.DebugInfoPopup = DebugInfoPopup;
