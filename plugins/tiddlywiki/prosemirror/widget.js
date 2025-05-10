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

var { EditorState } = require("prosemirror-state");
var { EditorView } = require("prosemirror-view");
var { Schema, DOMParser } = require("prosemirror-model");
var { schema: basicSchema } = require("prosemirror-schema-basic");
var {
	createListPlugins,
	createListSpec,
	listKeymap
} = require("prosemirror-flat-list");
var { exampleSetup } = require("$:/plugins/tiddlywiki/prosemirror/setup/setup.js");
var { keymap } = require("prosemirror-keymap");
var { inputRules } = require("prosemirror-inputrules");

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
	// DEBUG: console initialWikiAst
	console.log(`initialWikiAst`, initialWikiAst);
	var doc = wikiAstToProseMirrorAst(initialWikiAst);
	// DEBUG: console doc
	console.log(`initial doc`, doc);

	var container = $tw.utils.domMaker('div', {
		class: 'tc-prosemirror-container',
	});
	
	var schema = new Schema({
		nodes: basicSchema.spec.nodes.append({ list: createListSpec() }),
		marks: basicSchema.spec.marks,
	})
	
	var listKeymapPlugin = keymap(listKeymap)
	var listPlugins = createListPlugins({ schema })

	var self = this;
	this.view = new EditorView(container, {
		state: EditorState.create({
			// doc: schema.node("doc", null, [schema.node("paragraph")]),
			doc: schema.nodeFromJSON(doc),
			plugins: [
				listKeymapPlugin,
				...listPlugins,
				...exampleSetup({ schema }),
			],
		}),
		dispatchTransaction: function(transaction) {
			var newState = self.view.state.apply(transaction);
			self.view.updateState(newState);
			self.debouncedSaveEditorContent();
		}
	})
		
	parent.insertBefore(container,nextSibling);
	this.domNodes.push(container);
};

ProsemirrorWidget.prototype.saveEditorContent = function() {
	var content = this.view.state.doc.toJSON();
	var wikiast = wikiAstFromProseMirrorAst(content);
	var wikiText = $tw.utils.serializeParseTree(wikiast);
	var tiddler = this.getAttribute("tiddler");
	var currentText = this.wiki.getTiddlerText(tiddler, "");
	if (currentText !== wikiText) {
		console.log(`ProseMirror: ${JSON.stringify(content)}`, content);
		console.log(`WikiAST: ${JSON.stringify(wikiast)}`, wikiast);
		console.log(`WikiText: ${wikiText}`);
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
	// DEBUG: console this.saveLock
	console.log(`this.saveLock`, this.saveLock);
	if(changedAttributes.text) {
		this.refreshSelf();
		return true;
	} else if (changedTiddlers[this.getAttribute("tiddler")]) {
		if (this.saveLock) {
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
