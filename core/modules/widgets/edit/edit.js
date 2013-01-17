/*\
title: $:/core/modules/widgets/edit/edit.js
type: application/javascript
module-type: widget

The edit widget uses editor plugins to edit tiddlers of different types.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var EditWidget = function(renderer) {
	// Save state
	this.renderer = renderer;
	// Initialise the editors if they've not been done already
	if(!this.editors) {
		EditWidget.prototype.editors = {};
		$tw.modules.applyMethods("editor",this.editors);
	}
	// Generate child nodes
	this.generate();
};

EditWidget.prototype.generate = function() {
	// Get parameters from our attributes
	this.tiddlerTitle = this.renderer.getAttribute("tiddler",this.renderer.getContextTiddlerTitle());
	this.fieldName = this.renderer.getAttribute("field","text");
	// Choose the editor to use
	// TODO: Tiddler field modules should be able to specify a field type from which the editor is derived
	var tiddler = this.renderer.renderTree.wiki.getTiddler(this.tiddlerTitle),
		Editor;
	if(this.fieldName === "text" && tiddler && tiddler.fields.type) {
		Editor = this.editors[tiddler.fields.type];
	}
	if(!Editor) {
		Editor = this.editors["text/vnd.tiddlywiki"];
	}
	// Instantiate the editor
	this.editor = new Editor(this,this.tiddlerTitle,this.fieldName);
	// Ask the editor to create the widget element
	this.editor.render();
};

EditWidget.prototype.postRenderInDom = function() {
	if(this.editor && this.editor.postRenderInDom) {
		this.editor.postRenderInDom();
	}
};

EditWidget.prototype.refreshInDom = function(changedAttributes,changedTiddlers) {
	// We'll completely regenerate ourselves if any of our attributes have changed
	if(changedAttributes.tiddler || changedAttributes.field || changedAttributes.format) {
		// Regenerate and rerender the widget and replace the existing DOM node
		this.generate();
		var oldDomNode = this.renderer.domNode,
			newDomNode = this.renderer.renderInDom();
		oldDomNode.parentNode.replaceChild(newDomNode,oldDomNode);
	} else if(this.tiddlerTitle && changedTiddlers[this.tiddlerTitle]) {
		// Refresh the editor if our tiddler has changed
		if(this.editor && this.editor.refreshInDom) {
			this.editor.refreshInDom(changedTiddlers);
		}
	} else {
		// Otherwise, just refresh any child nodes
		$tw.utils.each(this.children,function(node) {
			if(node.refreshInDom) {
				node.refreshInDom(changedTiddlers);
			}
		});
	}
};

exports.edit = EditWidget;

})();
