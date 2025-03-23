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
  listInputRules,
  listKeymap
} = require("prosemirror-flat-list");
var { exampleSetup } = require("prosemirror-example-setup");
var { keymap } = require("prosemirror-keymap");
var { inputRules } = require("prosemirror-inputrules");

var ProsemirrorWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
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
  var container = $tw.utils.domMaker('div', {
    class: 'tc-prosemirror-container',
  });
  
  var schema = new Schema({
    nodes: basicSchema.spec.nodes.append({ list: createListSpec() }),
    marks: basicSchema.spec.marks,
  })
  
  var listKeymapPlugin = keymap(listKeymap)
  var listInputRulePlugin = inputRules({ rules: listInputRules })
  var listPlugins = createListPlugins({ schema })

  var self = this;
  var wikiAst = $tw.wiki.parseText(null, `* This is an unordered list
* It has two items

# This is a numbered list
## With a subitem
# And a third item`).tree;
  var doc = wikiAstToProseMirrorAst(wikiAst);
  // DEBUG: console doc
  console.log(`initial doc`, doc);
  this.view = new EditorView(container, {
    state: EditorState.create({
      // doc: schema.node("doc", null, [schema.node("paragraph")]),
      doc: schema.nodeFromJSON(doc),
      plugins: [
        listKeymapPlugin,
        listInputRulePlugin,
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
  console.log(`ProseMirror: ${JSON.stringify(content)}`);
  var wikiast = wikiAstFromProseMirrorAst(content);
  console.log(`WikiAST: ${JSON.stringify(wikiast)}`);
  var wikiText = $tw.utils.serializeParseTree(wikiast);
  console.log(`WikiText: ${wikiText}`);
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
	} else {
		return false;
	}
};

exports.prosemirror = ProsemirrorWidget;
