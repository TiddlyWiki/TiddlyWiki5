/*\
title: $:/plugins/tiddlywiki/prosemirror/widget.js
type: application/javascript
module-type: library

\*/

"use strict";

const Widget = require("$:/core/modules/widgets/widget.js").widget;
const debounce = require("$:/core/modules/utils/debounce.js").debounce;
const wikiAstFromProseMirrorAst = require("$:/plugins/tiddlywiki/prosemirror/ast/from-prosemirror.js").from;
const wikiAstToProseMirrorAst = require("$:/plugins/tiddlywiki/prosemirror/ast/to-prosemirror.js").to;

const EditorState = require("prosemirror-state").EditorState;
const EditorView = require("prosemirror-view").EditorView;
const Schema = require("prosemirror-model").Schema;
const DOMParser = require("prosemirror-model").DOMParser;
const basicSchema = require("prosemirror-schema-basic").schema;
const createListPlugins = require("prosemirror-flat-list").createListPlugins;
const createListSpec = require("prosemirror-flat-list").createListSpec;
const listKeymap = require("prosemirror-flat-list").listKeymap;
const exampleSetup = require("$:/plugins/tiddlywiki/prosemirror/setup/setup.js").exampleSetup;
const keymap = require("prosemirror-keymap").keymap;
const inputRules = require("prosemirror-inputrules").inputRules;
const SlashMenuPlugin = require("$:/plugins/tiddlywiki/prosemirror/slash-menu.js").SlashMenuPlugin;
const SlashMenuUI = require("$:/plugins/tiddlywiki/prosemirror/slash-menu-ui.js").SlashMenuUI;
const getAllMenuElements = require("$:/plugins/tiddlywiki/prosemirror/menu-elements.js").getAllMenuElements;

const ProsemirrorWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
	// indicate the change is triggered by the widget itself
	this.saveLock = false;
};

/*
Inherit from the base widget class
*/
ProsemirrorWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
ProsemirrorWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();

	const tiddler = this.getAttribute("tiddler");
	const initialText = this.wiki.getTiddlerText(tiddler, "");
	const initialWikiAst = $tw.wiki.parseText(null, initialText).tree;
	const doc = wikiAstToProseMirrorAst(initialWikiAst);

	const container = $tw.utils.domMaker("div", {
		class: "tc-prosemirror-container"
	});
	
	const schema = new Schema({
		nodes: basicSchema.spec.nodes.append({ list: createListSpec() }),
		marks: basicSchema.spec.marks
	});
	
	const listKeymapPlugin = keymap(listKeymap);
	const listPlugins = createListPlugins({ schema: schema });

	const allMenuElements = getAllMenuElements(this.wiki, schema);

	const self = this;
	this.view = new EditorView(container, {
		state: EditorState.create({
			// doc: schema.node("doc", null, [schema.node("paragraph")]),
			doc: schema.nodeFromJSON(doc),
			plugins: [
				SlashMenuPlugin(allMenuElements, {
					triggerCodes: ["Slash", "Backslash"] // Support both / (、) and \ keys
				}),
				listKeymapPlugin
			]
			.concat(listPlugins)
			.concat(exampleSetup({ schema: schema })),
		}),
		dispatchTransaction: transaction => {
			const newState = self.view.state.apply(transaction);
			self.view.updateState(newState);
			self.debouncedSaveEditorContent();
		}
	});
	
	// Initialize SlashMenu UI
	this.slashMenuUI = new SlashMenuUI(this.view, {
		clickable: true
	});
		
	parent.insertBefore(container,nextSibling);
	this.domNodes.push(container);
};

ProsemirrorWidget.prototype.saveEditorContent = function() {
	const content = this.view.state.doc.toJSON();
	const wikiast = wikiAstFromProseMirrorAst(content);
	const wikiText = $tw.utils.serializeWikitextParseTree(wikiast);
	const tiddler = this.getAttribute("tiddler");
	const currentText = this.wiki.getTiddlerText(tiddler, "");
	if(currentText !== wikiText) {
		this.saveLock = true;
		this.wiki.setText(tiddler, "text", undefined, wikiText);
	}
}

// Debounced save function for performance
ProsemirrorWidget.prototype.debouncedSaveEditorContent = debounce(ProsemirrorWidget.prototype.saveEditorContent, 300);

/*
Compute the internal state of the widget
*/
ProsemirrorWidget.prototype.execute = function() {
	// Nothing to do for a text node
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
ProsemirrorWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.text) {
		this.refreshSelf();
		return true;
	} else if(changedTiddlers[this.getAttribute("tiddler")]) {
		if(this.saveLock) {
			// Skip refresh if the change is triggered by the widget itself
			this.saveLock = false;
			return false;
		}
		// Not Re-render the widget, which will cause focus lost.
		// We manually update the editor content.
		this.refreshSelf();
		return true;
	}
	return false;
};

exports.prosemirror = ProsemirrorWidget;
