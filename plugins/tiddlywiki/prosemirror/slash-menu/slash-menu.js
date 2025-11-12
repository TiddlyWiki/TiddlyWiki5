/*\
title: $:/plugins/tiddlywiki/prosemirror/slash-menu.js
type: application/javascript
module-type: library

Custom slash menu implementation based on prosemirror-slash-menu
\*/

"use strict";

var Plugin = require("prosemirror-state").Plugin;
var PluginKey = require("prosemirror-state").PluginKey;
var flattenMenuElementsWithGroup = require("$:/plugins/tiddlywiki/prosemirror/menu-elements.js").flattenMenuElementsWithGroup;

var SlashMenuKey = new PluginKey("slash-menu-plugin");

var SlashMetaTypes = {
	open: "open",
	close: "close",
	execute: "execute",
	nextItem: "nextItem",
	prevItem: "prevItem",
	inputChange: "inputChange"
};

function createSlashMenuPlugin(menuElements, options) {
	options = options || {};
	var ignoredKeys = options.ignoredKeys || [];
	var customConditions = options.customConditions;
	var triggerCodes = options.triggerCodes || ["Slash"];

	var defaultIgnoredKeys = [
		"Unidentified", "Alt", "AltGraph", "CapsLock", "Control", "Fn", "FnLock",
		"F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12",
		"Hyper", "Meta", "NumLock", "Pause", "PrintScreen", "Shift", "Super",
		"Symbol", "SymbolLock", "Enter", "Tab", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowUp",
		"End", "Home", "PageDown", "PageUp"
	];

	var allIgnoredKeys = defaultIgnoredKeys.concat(ignoredKeys);

	var initialState = {
		selected: menuElements.length > 0 ? menuElements[0].id : null,
		open: false,
		filter: "",
		filteredElements: flattenMenuElementsWithGroup(menuElements),
		elements: menuElements,
		ignoredKeys: allIgnoredKeys
	};

	function defaultConditions() {
		return {
			shouldOpen: function(state, event, view) {
				var isSlashTrigger = false;
				for(var i = 0; i < triggerCodes.length; i++) {
					if(triggerCodes[i] === event.code) {
						isSlashTrigger = true;
						break;
					}
				}
				if(!isSlashTrigger) return false;
				var editorState = view.state;
				var resolvedPos = editorState.doc.resolve(editorState.selection.from);
				var parentNode = resolvedPos.parent;
				var inParagraph = parentNode.type.name === "paragraph";
				var inEmptyPar = inParagraph && parentNode.nodeSize === 2;
				var posInLine = editorState.selection.$head.parentOffset;
				var prevCharacter = editorState.selection.$head.parent.textContent.slice(posInLine - 1, posInLine);
				var spaceBeforePos = prevCharacter === " " || prevCharacter === "" || prevCharacter === "　";
				return (
					!state.open &&
					inParagraph &&
					(inEmptyPar || spaceBeforePos || (editorState.selection.from !== editorState.selection.to))
				);
			},
			shouldClose: function(state, event, view) {
				var isTrigger = false;
				for(var i = 0; i < triggerCodes.length; i++) {
					if(triggerCodes[i] === event.code) {
						isTrigger = true;
						break;
					}
				}
				return state.open &&
					(isTrigger || event.key === "Escape" || event.key === "Backspace") &&
					state.filter.length === 0;
			}
		};
	}

	function dispatchWithMeta(view, meta) {
		view.dispatch(view.state.tr.setMeta(SlashMenuKey, meta));
	}

	function getElementById(id, state) {
		for(var i = 0; i < state.filteredElements.length; i++) {
			var element = state.filteredElements[i];
			if(element.id === id && element.type !== "group") {
				return element;
			}
		}
		return undefined;
	}

	function getNextItemId(state) {
		var currentIndex = -1;
		for(var i = 0; i < state.filteredElements.length; i++) {
			if(state.filteredElements[i].id === state.selected) {
				currentIndex = i;
				break;
			}
		}
		for(var i = currentIndex + 1; i < state.filteredElements.length; i++) {
			if(state.filteredElements[i].type !== "group") {
				return state.filteredElements[i].id;
			}
		}
		return undefined;
	}

	function getPreviousItemId(state) {
		var currentIndex = -1;
		for(var i = 0; i < state.filteredElements.length; i++) {
			if(state.filteredElements[i].id === state.selected) {
				currentIndex = i;
				break;
			}
		}
		for(var i = currentIndex - 1; i >= 0; i--) {
			if(state.filteredElements[i].type !== "group") {
				return state.filteredElements[i].id;
			}
		}
		return undefined;
	}

	function getFilteredItems(state, input) {
		var allElements = flattenMenuElementsWithGroup(state.elements);
		var regExp = new RegExp(input.toLowerCase().replace(/\s/g, "\\s"));
		var result = [];
		for(var i = 0; i < allElements.length; i++) {
			var element = allElements[i];
			if(element.type === "group") {
				result.push(element);
			} else if(element.label.toLowerCase().match(regExp) !== null && !element.locked) {
				result.push(element);
			}
		}
		return result;
	}

	function getCase(state, event, view) {
		var condition = customConditions || defaultConditions();
		if(condition.shouldOpen(state, event, view)) {
			return "OpenMenu";
		}
		if(condition.shouldClose(state, event, view)) {
			return "CloseMenu";
		}
		if(state.open) {
			if(event.code === "ArrowDown" || event.key === "ArrowDown") {
				return "NextItem";
			}
			if(event.code === "ArrowUp" || event.key === "ArrowUp") {
				return "PrevItem";
			}
			if(event.code === "Enter" || event.key === "Enter" || event.code === "Tab" || event.key === "Tab") {
				return "Execute";
			}
			if(event.code === "Escape" || event.key === "Escape" || (event.code === "Backspace" || event.key === "Backspace") && state.filter.length === 0) {
				return "CloseMenu";
			}
			if(state.filter.length > 0 && (event.code === "Backspace" || event.key === "Backspace")) {
				return "removeChar";
			}
			var isIgnored = false;
			for(var i = 0; i < allIgnoredKeys.length; i++) {
				if(allIgnoredKeys[i] === event.key) {
					isIgnored = true;
					break;
				}
			}
			if(!isIgnored && event.key !== "Process") {
				return "addChar";
			}
			if(event.code === "ArrowLeft" || event.key === "ArrowLeft" || event.code === "ArrowRight" || event.key === "ArrowRight") {
				return "Catch";
			}
		}
		return "Ignore";
	}

	return new Plugin({
		key: SlashMenuKey,
		props: {
			handleKeyDown: function(view, event) {
				var editorState = view.state;
				var state = SlashMenuKey.getState(editorState);
				if(!state) return false;
				var slashCase = getCase(state, event, view);
				switch(slashCase) {
					case "OpenMenu":
						dispatchWithMeta(view, { type: SlashMetaTypes.open });
						return true;
					case "CloseMenu":
						if(!state.open) return false;
						dispatchWithMeta(view, { type: SlashMetaTypes.close });
						return true;
					case "Execute":
						var menuElement = getElementById(state.selected, state);
						if(!menuElement) return false;
						if(menuElement.type === "command") {
							menuElement.command(view);
							dispatchWithMeta(view, { type: SlashMetaTypes.execute });
						}
						return true;
					case "NextItem":
						dispatchWithMeta(view, { type: SlashMetaTypes.nextItem });
						return true;
					case "PrevItem":
						dispatchWithMeta(view, { type: SlashMetaTypes.prevItem });
						return true;
					case "addChar":
						dispatchWithMeta(view, {
							type: SlashMetaTypes.inputChange,
							filter: state.filter + event.key
						});
						return true;
					case "removeChar":
						var newFilter = state.filter.length === 1 ? "" : state.filter.slice(0, -1);
						dispatchWithMeta(view, {
							type: SlashMetaTypes.inputChange,
							filter: newFilter
						});
						return true;
					case "Catch":
						return true;
					case "Ignore":
					default:
						return false;
				}
			},
			handleDOMEvents: {
				compositionstart: function(view, event) {
					var state = SlashMenuKey.getState(view.state);
					if(state && state.open) {
						this._slashMenuComposing = true;
					}
					return false;
				},
				compositionupdate: function(view, event) {
					var state = SlashMenuKey.getState(view.state);
					if(state && state.open && this._slashMenuComposing) {
						var data = event.data;
						if(data && data !== "、" && data !== "/") {
							dispatchWithMeta(view, {
								type: SlashMetaTypes.inputChange,
								filter: data
							});
						}
						return true;
					}
					return false;
				},
				compositionend: function(view, event) {
					var state = SlashMenuKey.getState(view.state);
					if(state && state.open) {
						var data = event.data;
						if(data && (data === "、" || data === "/")) {
							setTimeout(function() {
								var currentState = view.state;
								var tr = currentState.tr.delete(currentState.selection.from - data.length, currentState.selection.from);
								view.dispatch(tr);
							}, 0);
						} else if(this._slashMenuComposing && data) {
							setTimeout(function() {
								var currentState = view.state;
								var tr = currentState.tr.delete(currentState.selection.from - data.length, currentState.selection.from);
								view.dispatch(tr);
								dispatchWithMeta(view, {
									type: SlashMetaTypes.inputChange,
									filter: data
								});
							}, 0);
						}
						this._slashMenuComposing = false;
					}
					return false;
				}
			}
		},
		state: {
			init: function() {
				return initialState;
			},
			apply: function(tr, state) {
				var meta = tr.getMeta(SlashMenuKey);
				if(!meta) return state;
				var newState;
				switch(meta.type) {
					case SlashMetaTypes.open:
						newState = {};
						for(var key in initialState) {
							if(initialState.hasOwnProperty(key)) {
								newState[key] = initialState[key];
							}
						}
						newState.open = true;
						return newState;
					case SlashMetaTypes.close:
						return initialState;
					case SlashMetaTypes.execute:
						return initialState;
					case SlashMetaTypes.nextItem:
						var nextId = getNextItemId(state);
						if(!nextId) return state;
						newState = {};
						for(var key in state) {
							if(state.hasOwnProperty(key)) {
								newState[key] = state[key];
							}
						}
						newState.selected = nextId;
						return newState;
					case SlashMetaTypes.prevItem:
						var prevId = getPreviousItemId(state);
						if(!prevId) return state;
						newState = {};
						for(var key in state) {
							if(state.hasOwnProperty(key)) {
								newState[key] = state[key];
							}
						}
						newState.selected = prevId;
						return newState;
					case SlashMetaTypes.inputChange:
						var newElements = meta.filter ? getFilteredItems(state, meta.filter) : flattenMenuElementsWithGroup(initialState.elements);
						var selectedId = newElements[0] ? newElements[0].id : state.selected;
						newState = {};
						for(var key in state) {
							if(state.hasOwnProperty(key)) {
								newState[key] = state[key];
							}
						}
						newState.selected = selectedId;
						newState.filteredElements = newElements;
						newState.filter = meta.filter || "";
						return newState;
					default:
						return state;
				}
			}
		}
	});
}

exports.SlashMenuPlugin = createSlashMenuPlugin;
exports.SlashMenuKey = SlashMenuKey;
exports.SlashMetaTypes = SlashMetaTypes;
