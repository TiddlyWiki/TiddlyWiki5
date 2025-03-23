/*\
title: $:/plugins/tiddlywiki/prosemirror/widget.js
type: application/javascript
module-type: library

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;
var debounce = require("$:/core/modules/utils/debounce.js").debounce;

var { EditorState } = require("prosemirror-state");
var { EditorView } = require("prosemirror-view");
var { Schema, DOMParser } = require("prosemirror-model");
var { schema } = require("prosemirror-schema-basic");
var { addListNodes } = require("prosemirror-schema-list");
var { exampleSetup } = require("prosemirror-example-setup");

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
  
  // Mix the nodes from prosemirror-schema-list into the basic schema to
  // create a schema with list support.
  const mySchema = new Schema({
    nodes: addListNodes(schema.spec.nodes, "paragraph block*", "block"),
    marks: schema.spec.marks
  })

  var self = this;
  this.view = new EditorView(container, {
    state: EditorState.create({
      doc: mySchema.node("doc", null, [mySchema.node("paragraph")]),
      plugins: exampleSetup({schema: mySchema})
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
  const content = this.view.state.doc.toJSON();
  console.log(JSON.stringify(content));
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
