/*\
title: $:/plugins/tiddlywiki/prosemirror/widget.js
type: application/javascript
module-type: library

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;
var debounce = require("$:/core/modules/utils/debounce.js").debounce;
var wikiAstFromProseMirrorAst = require("$:/plugins/tiddlywiki/prosemirror/ast/from-prosemirror.js").from;
var wikiAstToProseMirrorAst = require("$:/plugins/tiddlywiki/prosemirror/ast/to-prosemirror.js").to;

var EditorState = require("prosemirror-state").EditorState;
var EditorView = require("prosemirror-view").EditorView;
var Schema = require("prosemirror-model").Schema;
var DOMParser = require("prosemirror-model").DOMParser;
var basicSchema = require("prosemirror-schema-basic").schema;
var createListPlugins = require("prosemirror-flat-list").createListPlugins;
var createListSpec = require("prosemirror-flat-list").createListSpec;
var listKeymap = require("prosemirror-flat-list").listKeymap;
var exampleSetup = require("$:/plugins/tiddlywiki/prosemirror/setup/setup.js").exampleSetup;
var keymap = require("prosemirror-keymap").keymap;
var inputRules = require("prosemirror-inputrules").inputRules;
var SlashMenuPlugin = require("$:/plugins/tiddlywiki/prosemirror/slash-menu.js").SlashMenuPlugin;
var SlashMenuUI = require("$:/plugins/tiddlywiki/prosemirror/slash-menu-ui.js").SlashMenuUI;
var getAllMenuElements = require("$:/plugins/tiddlywiki/prosemirror/menu-elements.js").getAllMenuElements;

var ProsemirrorWidget = function(parseTreeNode,options) {
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

	var tiddler = this.getAttribute("tiddler");
	var initialText = this.wiki.getTiddlerText(tiddler, "");
	var initialWikiAst = $tw.wiki.parseText(null, initialText).tree;
	var doc = wikiAstToProseMirrorAst(initialWikiAst);

	var container = $tw.utils.domMaker("div", {
		class: "tc-prosemirror-container"
	});
	
	var schema = new Schema({
		nodes: basicSchema.spec.nodes.append({ list: createListSpec() }),
		marks: basicSchema.spec.marks
	});
	
	var listKeymapPlugin = keymap(listKeymap);
	var listPlugins = createListPlugins({ schema: schema });

	var allMenuElements = getAllMenuElements(this.wiki, schema);

	var self = this;
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
		dispatchTransaction: function(transaction) {
			var newState = self.view.state.apply(transaction);
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
	var content = this.view.state.doc.toJSON();
	var wikiast = wikiAstFromProseMirrorAst(content);
	var wikiText = $tw.utils.serializeWikitextParseTree(wikiast);
	var tiddler = this.getAttribute("tiddler");
	var currentText = this.wiki.getTiddlerText(tiddler, "");
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
