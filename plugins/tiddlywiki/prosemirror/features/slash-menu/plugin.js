/*\
title: $:/plugins/tiddlywiki/prosemirror/features/slash-menu/plugin.js
type: application/javascript
module-type: library

ProseMirror adapter for the editor-independent command menu plugin.

\*/

"use strict";

const { Plugin, PluginKey } = require("prosemirror-state");
const registry = require("$:/plugins/tiddlywiki/editor-command-menu/registry.js");
const { CommandMenuView } = require("$:/plugins/tiddlywiki/editor-command-menu/menu-view.js");
const {
	canExecuteEditorCommand,
	executeEditorCommand
} = require("$:/plugins/tiddlywiki/prosemirror/core/editor-commands.js");

const SlashMenuKey = new PluginKey("prosemirror-slash-menu");

const META_OPEN = "open";
const META_CLOSE = "close";
const SNIPPET_TAG = "$:/tags/TextEditor/Snippet";

function createContext(view, options) {
	return {
		view: view,
		wiki: options.wiki,
		editorType: "prosemirror",
		contentType: options.contentType || "text/vnd.tiddlywiki",
		surface: "slash-menu"
	};
}

function getSnippetCommands(wiki) {
	return wiki.getTiddlersWithTag(SNIPPET_TAG).map(function(title) {
		const tiddler = wiki.getTiddler(title);
		if(!tiddler || tiddler.fields["draft.of"] || !tiddler.fields.text) {
			return null;
		}
		const label = registry.renderPlainText(wiki, tiddler.fields.caption || title);
		return {
			id: "snippet:" + title,
			commandId: "insert-snippet",
			label: label,
			description: "",
			icon: tiddler.fields.icon ? String(tiddler.fields.icon) : null,
			category: "snippet",
			surfaces: ["slash-menu"],
			editors: ["prosemirror"],
			contentTypes: ["text/vnd.tiddlywiki"],
			keywords: [],
			parameters: { title: title },
			sourceTitle: title,
			searchText: label.toLocaleLowerCase()
		};
	}).filter(Boolean);
}

function getAvailableCommands(view, options) {
	const context = createContext(view, options);
	return registry.getCommands(options.wiki, context, {
		commands: getSnippetCommands(options.wiki),
		canExecute: function(command) {
			return canExecuteEditorCommand(context, command);
		}
	});
}

function shouldOpen(view, event) {
	if(!event || event.key !== "/" || event.altKey || event.ctrlKey || event.metaKey ||
		event.isComposing || event.keyCode === 229 || view.composing) {
		return false;
	}
	const selection = view.state.selection;
	const parent = selection.$from.parent;
	if(!parent.isTextblock || parent.type.spec.code || selection.$from.parent !== selection.$to.parent) {
		return false;
	}
	if(!selection.empty) {
		return true;
	}
	const offset = selection.$from.parentOffset;
	if(offset === 0) {
		return true;
	}
	const previous = parent.textBetween(Math.max(0, offset - 1), offset, "", "");
	return previous === " " || previous === "\t" || previous === "\u3000";
}

function createSlashMenuPlugin(options) {
	options = options || {};
	if(!options.wiki) {
		throw new Error("createSlashMenuPlugin requires a wiki");
	}

	return new Plugin({
		key: SlashMenuKey,
		state: {
			init: function() {
				return { open: false, from: null, to: null };
			},
			apply: function(transaction, previous) {
				const meta = transaction.getMeta(SlashMenuKey);
				if(meta && meta.type === META_OPEN) {
					return { open: true, from: meta.from, to: meta.to };
				}
				if(meta && meta.type === META_CLOSE) {
					return { open: false, from: null, to: null };
				}
				if(previous.open && transaction.selectionSet) {
					return { open: false, from: null, to: null };
				}
				if(previous.open && transaction.docChanged) {
					const mappedFrom = transaction.mapping.map(previous.from, 1);
					const mappedTo = transaction.mapping.map(previous.to, previous.from === previous.to ? 1 : -1);
					if(mappedFrom > mappedTo) {
						return { open: false, from: null, to: null };
					}
					return {
						open: true,
						from: mappedFrom,
						to: mappedTo
					};
				}
				return previous;
			}
		},
		props: {
			handleKeyDown: function(view, event) {
				const state = SlashMenuKey.getState(view.state);
				if(state && state.open) {
					return false;
				}
				if(!shouldOpen(view, event) || getAvailableCommands(view, options).length === 0) {
					return false;
				}
				view.dispatch(view.state.tr.setMeta(SlashMenuKey, {
					type: META_OPEN,
					from: view.state.selection.from,
					to: view.state.selection.to
				}));
				return true;
			}
		},
		view: function(editorView) {
			let wasOpen = false;
			let destroyed = false;

			function closeWithoutInsertion() {
				const state = SlashMenuKey.getState(editorView.state);
				if(state && state.open) {
					editorView.dispatch(editorView.state.tr.setMeta(SlashMenuKey, { type: META_CLOSE }));
				}
			}

			function insertLiteral(text) {
				const state = SlashMenuKey.getState(editorView.state);
				if(!state || !state.open || typeof state.from !== "number" || typeof state.to !== "number") {
					return;
				}
				let transaction = editorView.state.tr.insertText(text, state.from, state.to);
				transaction = transaction.setMeta(SlashMenuKey, { type: META_CLOSE }).scrollIntoView();
				editorView.dispatch(transaction);
				editorView.focus();
			}

			function cancelAndInsertSlash() {
				insertLiteral("/");
			}

			const menu = new CommandMenuView({
				document: editorView.dom.ownerDocument,
				wiki: options.wiki,
				searchable: true,
				ariaLabel: options.wiki.getTiddlerText("$:/plugins/tiddlywiki/prosemirror/language/SlashMenu/AriaLabel", "Slash menu commands"),
				onRequestClose: cancelAndInsertSlash,
				onExecute: function(command) {
					closeWithoutInsertion();
					editorView.focus();
					executeEditorCommand(createContext(editorView, options), command);
				}
			});

			function handleSearchKeyDown(event) {
				// WikiText uses // for italic. A second slash before any query
				// escapes the trigger into the document, without coupling the
				// reusable menu to WikiText syntax or bypassing IME composition.
				if(event.key === "/" && menu.searchInput.value === "" &&
					!event.altKey && !event.ctrlKey && !event.metaKey &&
					!event.isComposing && event.keyCode !== 229) {
					event.preventDefault();
					event.stopPropagation();
					insertLiteral("//");
				}
			}
			menu.searchInput.addEventListener("keydown",handleSearchKeyDown);

			function closeOnOutsidePointer(event) {
				if(menu.root && !menu.root.contains(event.target)) {
					cancelAndInsertSlash();
				}
			}

			function update(view) {
				if(destroyed) {
					return;
				}
				const state = SlashMenuKey.getState(view.state);
				const isOpen = !!(state && state.open);
				if(isOpen && !wasOpen) {
					const commands = getAvailableCommands(view, options);
					if(commands.length === 0) {
						closeWithoutInsertion();
						return;
					}
					menu.setCommands(commands);
					menu.setFilter("");
					let rect;
					try {
						rect = view.coordsAtPos(state.to);
					} catch(e) {
						rect = view.dom.getBoundingClientRect();
					}
					menu.show(rect, function() {
						const current = SlashMenuKey.getState(editorView.state);
						return current && current.open ? editorView.coordsAtPos(current.to) : null;
					});
					view.dom.ownerDocument.addEventListener("mousedown", closeOnOutsidePointer);
				} else if(!isOpen && wasOpen) {
					menu.hide();
					view.dom.ownerDocument.removeEventListener("mousedown", closeOnOutsidePointer);
				}
				wasOpen = isOpen;
			}

			update(editorView);
			return {
				update: update,
				destroy: function() {
					destroyed = true;
					editorView.dom.ownerDocument.removeEventListener("mousedown", closeOnOutsidePointer);
					menu.searchInput.removeEventListener("keydown",handleSearchKeyDown);
					menu.destroy();
				}
			};
		}
	});
}

exports.SlashMenuKey = SlashMenuKey;
exports.createSlashMenuPlugin = createSlashMenuPlugin;
exports.shouldOpen = shouldOpen;
exports.getSnippetCommands = getSnippetCommands;
