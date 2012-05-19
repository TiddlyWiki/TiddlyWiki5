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
	var children = this.editor.getChildren();
	for(var t=0; t<children.length; t++) {
		children[t].execute(this.parents,this.tiddlerTitle);
	}
	return children;
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
			// Remove the previous children
			while(this.domNode.hasChildNodes()) {
				this.domNode.removeChild(this.domNode.firstChild);
			}
			// Execute the new children
			this.execute(this.parents,this.tiddlerTitle);
			// Render to the DOM
			for(t=0; t<this.children.length; t++) {
				this.children[t].renderInDom(this.domNode);
			}
		}
	} else {
		// Refresh any children
		for(t=0; t<this.children.length; t++) {
			this.children[t].refreshInDom(changes);
		}
	}
};

})();
