/*\
title: $:/plugins/tiddlywiki/editorjs/widget.js
type: application/javascript
module-type: widget

Text node widget

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var EditorJSWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
EditorJSWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
EditorJSWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
  var container = $tw.utils.domMaker('div', {
    class: 'tc-editorjs-container',
  });
  var EditorJS = require("$:/plugins/tiddlywiki/editorjs/lib/editorjs.js");
  var List = require("$:/plugins/tiddlywiki/editorjs/lib/editorjs-list.js");
  var Header = require("$:/plugins/tiddlywiki/editorjs/lib/header.js");
	const editor = new EditorJS({
    holder: container,
    tools: {
      list: List,
      header: Header
    }
  });

  editor.isReady
    .then(() => {
      console.log('Editor.js is ready to work!')
    })
    .catch((reason) => {
      console.log('Editor.js initialization failed because of', reason)
    });
	parent.insertBefore(container,nextSibling);
	this.domNodes.push(container);
};

/*
Compute the internal state of the widget
*/
EditorJSWidget.prototype.execute = function() {
	// Nothing to do for a text node
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
EditorJSWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.text) {
		this.refreshSelf();
		return true;
	} else {
		return false;
	}
};

exports.editorjs = EditorJSWidget;
