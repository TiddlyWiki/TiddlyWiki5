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
	if(!window.customElements.get("json-tree")) {
		class JsonTree extends HTMLElement {
			constructor() {
				super();
				this.attachShadow({ mode: "open" });
				const style = document.createElement("style");
				style.textContent = `
					:host {
						display: block;
						font-family: var(--json-tree-font-family, "Source Code Pro", monospace);
						font-size: var(--json-tree-font-size, 12px);
						line-height: 1.3;
						overflow-y: auto;
						border: 1px solid var(--json-tree-border-color, #ddd);
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
						border-left: 1px solid var(--json-tree-guide-color, #ccc);
						padding-left: 1em;
						margin-left: 1em;
					}
					summary {
						cursor: pointer;
						outline: none;
					}
					summary:hover {
						color: var(--json-tree-hover-color, blue);
					}
					summary::marker {
						color: var(--json-tree-marker-color, #666);
					}
					details:not([open]) > summary::marker {
						color: var(--json-tree-marker-closed-color, red);
					}
					.key {
						color: var(--json-tree-key-color, #666);
					}
					.string {
						color: var(--json-tree-string-color, #a31515);
					}
					.number {
						color: var(--json-tree-number-color, #098658);
					}
					.boolean {
						color: var(--json-tree-boolean-color, #0000ff);
					}
					.null {
						color: var(--json-tree-null-color, #800080);
					}
					.value {
						margin-left: 1em;
					}
				`;
				this.shadowRoot.append(style);
				this._container = document.createElement("div");
				this._container.setAttribute("class", "tree");
				this.shadowRoot.append(this._container);
				this._boundUpdateMaxHeight = this._updateMaxHeight.bind(this);
				this._saveStateTimer = null;
				this._pendingStateUpdates = null;
			}

			static get observedAttributes() {
				return ["tiddler", "block-list", "state"];
			}

			connectedCallback() {
				this.render();
				this._updateMaxHeight();
				window.addEventListener("resize", this._boundUpdateMaxHeight);
			}

			disconnectedCallback() {
				window.removeEventListener("resize", this._boundUpdateMaxHeight);
				if(this._saveStateTimer) {
					clearTimeout(this._saveStateTimer);
					this._flushStateUpdates();
				}
			}

			attributeChangedCallback() {
				if(this.isConnected) {
					this.render();
				}
			}

			_updateMaxHeight() {
				const rect = this.getBoundingClientRect();
				const availableHeight = window.innerHeight - rect.top;
				const margin = 40;
				this.style.maxHeight = (availableHeight - margin) + "px";
			}

			_getStateTiddlerTitle() {
				return this.getAttribute("state") || "$:/temp/json-tree/state";
			}

			_scheduleSaveState(stateKey, isOpen) {
				var self = this;
				if(!this._pendingStateUpdates) {
					this._pendingStateUpdates = {};
				}
				this._pendingStateUpdates[stateKey] = isOpen;
				if(!this._saveStateTimer) {
					this._saveStateTimer = setTimeout(function() {
						self._flushStateUpdates();
					}, 100);
				}
			}

			_flushStateUpdates() {
				this._saveStateTimer = null;
				if(!this._pendingStateUpdates) {
					return;
				}
				var stateDataTiddlerTitle = this._getStateTiddlerTitle();
				var currentData = Object.assign({}, $tw.wiki.getTiddlerDataCached(stateDataTiddlerTitle, {}));
				for(var key in this._pendingStateUpdates) {
					if(this._pendingStateUpdates[key]) {
						delete currentData[key];
					} else {
						currentData[key] = "hide";
					}
				}
				this._pendingStateUpdates = null;
				$tw.wiki.addTiddler(new $tw.Tiddler({
					title: stateDataTiddlerTitle,
					type: "application/json",
					text: JSON.stringify(currentData, null, 2)
				}));
			}

			render() {
				var sourceTiddler = this.getAttribute("tiddler");
				if(!sourceTiddler) {
					this._container.textContent = "No tiddler attribute specified";
					return;
				}
				var tiddler = $tw.wiki.getTiddler(sourceTiddler);
				if(!tiddler) {
					this._container.textContent = "Source tiddler not found: " + sourceTiddler;
					return;
				}
				var data;
				try {
					data = JSON.parse(tiddler.fields.text);
				} catch(e) {
					this._container.textContent = "Invalid JSON in tiddler: " + sourceTiddler;
					return;
				}
				var blockListAttr = this.getAttribute("block-list");
				this._blockList = blockListAttr ? blockListAttr.split(" ") : [];
				this._container.replaceChildren();
				var stateDataTiddlerTitle = this._getStateTiddlerTitle();
				this._stateData = $tw.wiki.getTiddlerDataCached(stateDataTiddlerTitle, {});
				var tree = this._createTreeElement(data, null, "");
				this._container.append(tree);
				this._stateData = null;
			}

			_createTreeElement(data, key, currentPath) {
				if(Array.isArray(data)) {
					return this._createCollapsibleElement(data, key, currentPath, true);
				} else if(typeof data === "object" && data !== null) {
					return this._createCollapsibleElement(data, key, currentPath, false);
				}
				var fragment = document.createDocumentFragment();
				if(key !== null) {
					fragment.append(createKeySpan(key));
				}
				fragment.append(createValueElement(data));
				return fragment;
			}

			_createCollapsibleElement(data, key, currentPath, isArray) {
				var self = this;
				var details = document.createElement("details");
				var stateKey = currentPath;
				var stateValue = this._stateData[stateKey];
				details.open = (stateValue === undefined) ? true : (stateValue !== "hide");
				details.setAttribute("data-state-key", stateKey);
				details.addEventListener("toggle", function(event) {
					var keyToUpdate = event.target.getAttribute("data-state-key");
					if(keyToUpdate) {
						self._scheduleSaveState(keyToUpdate, event.target.open);
					}
				});
				var summary = document.createElement("summary");
				if(key !== null) {
					summary.append(createKeySpan(key));
				}
				if(isArray) {
					summary.append("[...] (" + data.length + " items)");
				} else {
					summary.append("{...}");
				}
				details.append(summary);
				var list = document.createElement("div");
				list.className = "value";
				if(isArray) {
					for(var i = 0; i < data.length; i++) {
						var item = document.createElement("div");
						var newPath = currentPath ? currentPath + "/" + i : String(i);
						item.append(this._createTreeElement(data[i], i, newPath));
						list.append(item);
					}
				} else {
					var keys = Object.keys(data);
					for(var k = 0; k < keys.length; k++) {
						var newKey = keys[k];
						if(this._blockList.indexOf(newKey) !== -1) {
							continue;
						}
						var objItem = document.createElement("div");
						var objPath = currentPath ? currentPath + "/" + newKey : newKey;
						objItem.append(this._createTreeElement(data[newKey], newKey, objPath));
						list.append(objItem);
					}
				}
				details.append(list);
				return details;
			}

		}

		function createKeySpan(key) {
			var span = document.createElement("span");
			span.className = "key";
			span.textContent = (typeof key === "number") ? key + ": " : "\"" + key + "\": ";
			return span;
		}

		function createValueElement(value) {
			var span = document.createElement("span");
			if(value === null) {
				span.className = "null";
				span.textContent = "null";
			} else {
				var type = typeof value;
				span.className = type;
				span.textContent = (type === "string") ? "\"" + value + "\"" : String(value);
			}
			return span;
		}

		window.customElements.define("json-tree", JsonTree);
	}
};
