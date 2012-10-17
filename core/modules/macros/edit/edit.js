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
	params: {
		tiddler: {byName: true, type: "tiddler"},
		field: {byPos: 0, type: "text"},
		type: {byName: true, type: "text"},
		"default": {byName: true, type: "text"},
		requireFocus: {byName: true, type: "text"}
	}
};

exports.evaluateDependencies = function() {
	var dependencies = new $tw.Dependencies();
	if(!this.srcParams.tiddler) {
		dependencies.dependentOnContextTiddler = true;
	}
	for(var m in this.info.params) {
		var paramInfo = this.info.params[m];
		if(m in this.srcParams && paramInfo.type === "tiddler") {
			if(typeof this.srcParams[m] === "function") {
				dependencies.dependentAll = true;
			} else {
				dependencies.addDependency(this.srcParams[m],!paramInfo.skinny);
			}
		}
	}
	return dependencies;
};

exports.executeMacro = function() {
	// Get the tiddler being editted
	this.editField = this.hasParameter("field") ? this.params.field : "text";
	this.editTiddler = this.hasParameter("tiddler") ? this.params.tiddler : this.tiddlerTitle;
	var tiddler = this.wiki.getTiddler(this.editTiddler),
		Editor;
	// Figure out which editor to use
	// TODO: Tiddler field modules should be able to specify a field type from which the editor is derived
	if(this.editField === "text" && tiddler && tiddler.fields.type) {
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

exports.postRenderInDom = function() {
	if(this.editor.postRenderInDom) {
		this.editor.postRenderInDom();
	}
};

exports.refreshInDom = function(changes) {
	var t;
	// Only refresh if a dependency is triggered
	if(this.dependencies.hasChanged(changes,this.tiddlerTitle)) {
		if(this.editor.refreshInDom) {
			this.editor.refreshInDom();
		}
	} else {
		// Refresh any children
		this.child.refreshInDom(changes);
	}
};

})();
