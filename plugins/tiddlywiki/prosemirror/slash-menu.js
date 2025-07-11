/*\
title: $:/plugins/tiddlywiki/prosemirror/slash-menu.js
type: application/javascript
module-type: library

Custom slash menu implementation based on prosemirror-slash-menu
\*/

"use strict";

var { Plugin, PluginKey } = require("prosemirror-state");

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
	var triggerCodes = options.triggerCodes || ['Slash']; // Allow custom trigger codes
	
	var defaultIgnoredKeys = [
		"Unidentified", "Alt", "AltGraph", "CapsLock", "Control", "Fn", "FnLock",
		"F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12",
		"Hyper", "Meta", "NumLock", "Pause", "PrintScreen", "Shift", "Super",
		"Symbol", "SymbolLock", "Enter", "Tab", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowUp",
		"End", "Home", "PageDown", "PageUp"
	];
	
	var allIgnoredKeys = defaultIgnoredKeys.concat(ignoredKeys);
	
	var initialState = {
		selected: menuElements[0].id,
		open: false,
		filter: "",
		filteredElements: menuElements.filter(function(element) { return !element.locked; }),
		elements: menuElements,
		ignoredKeys: allIgnoredKeys
	};
	
	function defaultConditions() {
		return {
			shouldOpen: function(state, event, view) {
				// Support configurable trigger codes (default: 'Slash' for both '/' and '、')
				console.log('shouldOpen called:', { key: event.key, code: event.code, keyCode: event.keyCode });
				var isSlashTrigger = triggerCodes.includes(event.code);
				
				if (!isSlashTrigger) return false;
				
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
				return state.open &&
					(triggerCodes.includes(event.code) || event.key === "Escape" || event.key === "Backspace") &&
					state.filter.length === 0;
			}
		};
	}
	
	function dispatchWithMeta(view, meta) {
		view.dispatch(view.state.tr.setMeta(SlashMenuKey, meta));
	}
	
	function getElementById(id, state) {
		return state.filteredElements.find(function(element) { return element.id === id; });
	}
	
	function getNextItemId(state) {
		var currentIndex = state.filteredElements.findIndex(function(element) { return element.id === state.selected; });
		if (currentIndex >= 0 && currentIndex < state.filteredElements.length - 1) {
			return state.filteredElements[currentIndex + 1].id;
		}
		return undefined;
	}
	
	function getPreviousItemId(state) {
		var currentIndex = state.filteredElements.findIndex(function(element) { return element.id === state.selected; });
		if (currentIndex > 0) {
			return state.filteredElements[currentIndex - 1].id;
		}
		return undefined;
	}
	
	function getFilteredItems(state, input) {
		var regExp = new RegExp(input.toLowerCase().replace(/\s/g, "\\s"));
		return state.elements.filter(function(element) {
			return element.label.toLowerCase().match(regExp) !== null && !element.locked;
		});
	}
	
	function getCase(state, event, view) {
		var condition = customConditions || defaultConditions();
		
		if (condition.shouldOpen(state, event, view)) {
			return "OpenMenu";
		}
		if (condition.shouldClose(state, event, view)) {
			return "CloseMenu";
		}
		if (state.open) {
			if (event.key === "ArrowDown") {
				return "NextItem";
			}
			if (event.key === "ArrowUp") {
				return "PrevItem";
			}
			if (event.key === "Enter" || event.key === "Tab") {
				return "Execute";
			}
			if (event.key === "Escape" || (event.key === "Backspace" && state.filter.length === 0)) {
				return "CloseMenu";
			}
			if (state.filter.length > 0 && event.key === "Backspace") {
				return "removeChar";
			}
			if (!allIgnoredKeys.includes(event.key)) {
				return "addChar";
			}
			if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
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
				if (!state) return false;
				
				var slashCase = getCase(state, event, view);
				
				switch (slashCase) {
					case "OpenMenu":
						dispatchWithMeta(view, { type: SlashMetaTypes.open });
						return true; // Always prevent character input when opening menu
					case "CloseMenu":
						if (!state.open) return false;
						dispatchWithMeta(view, { type: SlashMetaTypes.close });
						return true;
					case "Execute":
						var menuElement = getElementById(state.selected, state);
						if (!menuElement) return false;
						if (menuElement.type === "command") {
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
						return false; // Allow character to be added for filtering
					case "removeChar":
						var newFilter = state.filter.length === 1 ? "" : state.filter.slice(0, -1);
						dispatchWithMeta(view, {
							type: SlashMetaTypes.inputChange,
							filter: newFilter
						});
						return false;
					case "Catch":
						return true;
					case "Ignore":
					default:
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
				if (!meta) return state;
				
				switch (meta.type) {
					case SlashMetaTypes.open:
						return Object.assign({}, initialState, { open: true });
					case SlashMetaTypes.close:
						return initialState;
					case SlashMetaTypes.execute:
						return initialState;
					case SlashMetaTypes.nextItem:
						var nextId = getNextItemId(state);
						if (!nextId) return state;
						return Object.assign({}, state, { selected: nextId });
					case SlashMetaTypes.prevItem:
						var prevId = getPreviousItemId(state);
						if (!prevId) return state;
						return Object.assign({}, state, { selected: prevId });
					case SlashMetaTypes.inputChange:
						var newElements = meta.filter ? getFilteredItems(state, meta.filter) : initialState.elements;
						var selectedId = newElements[0] ? newElements[0].id : state.selected;
						return Object.assign({}, state, {
							selected: selectedId,
							filteredElements: newElements,
							filter: meta.filter || ""
						});
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
