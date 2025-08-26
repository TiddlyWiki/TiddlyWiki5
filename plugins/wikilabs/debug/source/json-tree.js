/*\
title: $:/plugins/wikilabs/debug/json-tree.js
type: application/javascript
module-type: startup

A startup module to create a json-tree custom html element.

\*/

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Export name and synchronous status
exports.name = "json-tree-startup";
exports.platforms = ["browser"];
exports.before = ["startup"];
exports.synchronous = true;

exports.startup = function() {
	// Define the custom element
	if (!window.customElements.get("json-tree")) {
		class JsonTree extends HTMLElement {
			constructor() {
				super();
				this.attachShadow({ mode: "open" });
				const style = document.createElement("style");
				style.textContent = `
					:host {
						display: block;
						font-family: "Source Code Pro", monospace;
						font-size: 12px;
						line-height: 1.3;
						overflow-y: auto;
						border: 1px solid #ddd;
						padding: 10px;
						resize: vertical;
					}
					.tree {
						padding-left: 1em;
					}
					.tree > details:first-child {
						border-left: none;
						margin-left: 0;
						padding-left: 0;
					}
					details {
						border-left: 1px solid #ccc;
						padding-left: 1em;
						margin-left: 1em;
					}
					summary {
						cursor: pointer;
						outline: none;
					}
					summary:hover {
						color: blue;
					}
					.key {
						color: #666;
					}
					.string {
						color: #a31515;
					}
					.number {
						color: #098658;
					}
					.boolean {
						color: #0000ff;
					}
					.null {
						color: #800080;
					}
					.value {
						margin-left: 1em;
					}
				`
				this.shadowRoot.append(style);
				this._container = document.createElement("div");
				this._container.setAttribute("class", "tree");
				this.shadowRoot.append(this._container);
				this._boundUpdateMaxHeight = this._updateMaxHeight.bind(this);
			}

			connectedCallback() {
				this.render();
				this._updateMaxHeight();
				window.addEventListener("resize", this._boundUpdateMaxHeight);
			}

			disconnectedCallback() {
				window.removeEventListener("resize", this._boundUpdateMaxHeight);
			}

			_updateMaxHeight() {
				const rect = this.getBoundingClientRect();
				const availableHeight = window.innerHeight - rect.top;
				const margin = 40; // A bit of space at the bottom
				this.style.maxHeight = (availableHeight - margin) + "px";
			}

			render() {
				const sourceTiddler = this.getAttribute("tiddler") || "$:/plugins/wikilabs/debug/test.json";
				const tiddler = $tw.wiki.getTiddler(sourceTiddler);
				let data;
				if (tiddler) {
					try {
						data = JSON.parse(tiddler.fields.text);
					} catch (e) {
						this._container.textContent = "Invalid JSON in tiddler: " + sourceTiddler;
						return;
					}
				} else {
					this._container.textContent = "Source tiddler not found: " + sourceTiddler;
					return;
				}

				const blockListAttr = this.getAttribute("block-list");
				this._blockList = blockListAttr ? blockListAttr.split(" ") : [];

				this._container.innerHTML = ""; // Clear previous content
				const stateAttr = this.getAttribute("state");
				const stateDataTiddlerTitle = stateAttr || "_"; // Default to "_" if not provided
				const tree = this._createTreeElement(data, null, "", stateDataTiddlerTitle); // Initial empty path and state tiddler title
				this._container.append(tree);
			}

			_createTreeElement(data, key, currentPath, stateDataTiddlerTitle) {
				if (Array.isArray(data)) {
					return this._createArrayElement(data, key, currentPath, stateDataTiddlerTitle);
				} else if (typeof data === "object" && data !== null) {
					return this._createObjectElement(data, key, currentPath, stateDataTiddlerTitle);
				} else {
					const fragment = document.createDocumentFragment();
					if (key !== null) {
						const keySpan = document.createElement("span");
						keySpan.className = "key";
						keySpan.textContent = (typeof key === 'number') ? `${key}: ` : `"${key}": `;
						fragment.append(keySpan);
					}
					fragment.append(this._createValueElement(data));
					return fragment;
				}
			}

			_createObjectElement(obj, key, currentPath, stateDataTiddlerTitle) {
				const details = document.createElement("details");
				// const stateDataTiddlerTitle = "_"; // Now passed as parameter
				const stateKey = currentPath; // The key within the data tiddler
				const stateData = $tw.wiki.getTiddlerDataCached(stateDataTiddlerTitle, {});
				details.open = (stateData[stateKey] === undefined) ? true : (stateData[stateKey] !== "hide");
				details.setAttribute("data-state-key", stateKey); // For event listener
				details.addEventListener("toggle", (event) => {
					const keyToUpdate = event.target.getAttribute("data-state-key");
					if (keyToUpdate) {
						let currentData = $tw.wiki.getTiddlerDataCached(stateDataTiddlerTitle, {});
						currentData = {...currentData}; // Create a mutable copy
						if (event.target.open) {
							delete currentData[keyToUpdate]; // Remove key if open (default)
						} else {
							currentData[keyToUpdate] = "hide"; // Set to hide if closed
						}
						$tw.wiki.addTiddler(new $tw.Tiddler({
							title: stateDataTiddlerTitle,
							type: "application/json", // Assuming data tiddlers are JSON
							text: JSON.stringify(currentData, null, 2)
						}));
					}
				});
				const summary = document.createElement("summary");

				if (key !== null) {
					const keySpan = document.createElement("span");
					keySpan.className = "key";
					keySpan.textContent = `"${key}": `;
					summary.append(keySpan);
				}
				summary.append("{...}");

				details.append(summary);

				const list = document.createElement("div");
				list.className = "value";
				for (const newKey in obj) {
					if (Object.prototype.hasOwnProperty.call(obj, newKey)) {
						if (this._blockList.includes(newKey)) {
							continue;
						}
						const item = document.createElement("div");
						const newPath = (currentPath ? `${currentPath}/${newKey}` : newKey);
						item.append(this._createTreeElement(obj[newKey], newKey, newPath, stateDataTiddlerTitle));
						list.append(item);
					}
				}
				details.append(list);
				return details;
			}

			_createArrayElement(arr, key, currentPath, stateDataTiddlerTitle) {
				const details = document.createElement("details");
				// const stateDataTiddlerTitle = "_"; // Now passed as parameter
				const stateKey = currentPath; // The key within the data tiddler
				const stateData = $tw.wiki.getTiddlerDataCached(stateDataTiddlerTitle, {});
				details.open = (stateData[stateKey] === undefined) ? (key !== "orderedAttributes") : (stateData[stateKey] !== "hide");
				details.setAttribute("data-state-key", stateKey); // For event listener
				details.addEventListener("toggle", (event) => {
					const keyToUpdate = event.target.getAttribute("data-state-key");
					if (keyToUpdate) {
						let currentData = $tw.wiki.getTiddlerDataCached(stateDataTiddlerTitle, {});
						currentData = {...currentData}; // Create a mutable copy
						if (event.target.open) {
							delete currentData[keyToUpdate]; // Remove key if open (default)
						} else {
							currentData[keyToUpdate] = "hide"; // Set to hide if closed
						}
						$tw.wiki.addTiddler(new $tw.Tiddler({
							title: stateDataTiddlerTitle,
							type: "application/json", // Assuming data tiddlers are JSON
							text: JSON.stringify(currentData, null, 2)
						}));
					}
				});
				const summary = document.createElement("summary");

				if (key !== null) {
					const keySpan = document.createElement("span");
					keySpan.className = "key";
					// Use the key for arrays too, for consistency
					keySpan.textContent = (typeof key === 'number') ? `${key}: ` : `"${key}": `;
					summary.append(keySpan);
				}
				summary.append(`[...] (${arr.length} items)`);

				details.append(summary);

				const list = document.createElement("div");
				list.className = "value";
				arr.forEach((value, index) => {
					const item = document.createElement("div");
					const newPath = (currentPath ? `${currentPath}/${index}` : String(index));
					item.append(this._createTreeElement(value, index, newPath, stateDataTiddlerTitle));
					list.append(item);
				});
				details.append(list);
				return details;
			}

			_createValueElement(value) {
				const span = document.createElement("span");
				const type = typeof value;
				span.className = type;
				if (type === "string") {
					span.textContent = `"${value}"`
				} else if (value === null) {
					span.textContent = "null";
					span.className = "null";
				} else {
					span.textContent = String(value);
				}
				return span;
			}
		}
		window.customElements.define("json-tree", JsonTree);
	}
};