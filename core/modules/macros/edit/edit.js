/*\
title: $:/core/modules/macros/edit/edit.js
type: application/javascript
module-type: macro

Edit macro for editting fields and tiddlers

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "edit",
	dependentOnContextTiddler: true,
	params: {
		field: {byPos: 0, type: "text"}
	}
};

exports.executeMacro = function() {
	// Get the tiddler being editted
	var field = this.hasParameter("field") ? this.params.field : "text",
		tiddler = this.wiki.getTiddler(this.tiddlerTitle),
		Editor;
	// Figure out which editor to use
	// TODO: Tiddler field plugins should be able to specify a field type from which the editor is derived
	if(field === "text" && tiddler.fields.type) {
		Editor = this.wiki.macros.edit.editors[tiddler.fields.type];
	}
	if(!Editor) {
		Editor = this.wiki.macros.edit.editors["text/x-tiddlywiki"];
	}
	this.editor = new Editor(this);
	// Call the editor to generate the child nodes
	var child = this.editor.getChild();
	child.execute(this.parents,this.tiddlerTitle);
	return child;
};

exports.addEventHandlers = function() {
	if(this.editor.addEventHandlers) {
		this.editor.addEventHandlers();
	}
};

exports.postRenderInDom = function() {
	if(this.editor.postRenderInDom) {
		this.editor.postRenderInDom();
	}
};

exports.refreshInDom = function(changes) {
	var t;
	// Only refresh if a dependency is triggered
	if(this.dependencies.hasChanged(changes,this.tiddlerTitle)) {
		// Only refresh if the editor lets us
		if(this.editor.isRefreshable()) {
			// Remove the previous child
			var parent = this.child.domNode.parentNode,
				nextSibling = this.child.domNode.nextSibling;
			parent.removeChild(this.child.domNode);
			// Execute the macro
			this.execute(this.parents,this.tiddlerTitle);
			// Render to the DOM
			this.child.renderInDom(parent,nextSibling);
			this.domNode = this.child.domNode;
			this.addEventHandlers();
		}
	} else {
		// Refresh any children
		this.child.refreshInDom(changes);
	}
};

})();
