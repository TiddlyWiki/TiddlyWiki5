/*\
title: $:/core/modules/macros/view/viewers/wikified.js
type: application/javascript
module-type: fieldviewer

A viewer for viewing tiddler fields as wikified text

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var WikifiedViewer = function(viewMacro,tiddler,field,value) {
	this.viewMacro = viewMacro;
	this.tiddler = tiddler;
	this.field = field;
	this.value = value;
};

WikifiedViewer.prototype.render = function() {
	// Check for recursion
	var parents = this.viewMacro.parents,
		children,t,childrenClone = [];
	if(this.tiddler && this.viewMacro.params.field === "text") {
		if(parents.indexOf(this.tiddler.fields.title) !== -1) {
			children = [$tw.Tree.errorNode("Tiddler recursion error in <<view>> macro")];
		} else {
			children = this.viewMacro.wiki.parseTiddler(this.tiddler.fields.title).tree;
		}
		parents = parents.slice(0);
		parents.push(this.tiddler.fields.title);
	} else {
		children = this.viewMacro.wiki.parseText("text/x-tiddlywiki",this.value).tree;
	}
	// Clone and execute the parsed wikitext
	for(t=0; t<children.length; t++) {
		childrenClone.push(children[t].clone());
	}
	for(t=0; t<childrenClone.length; t++) {
		childrenClone[t].execute(parents,this.viewMacro.tiddlerTitle);
	}
	return $tw.Tree.Element(this.viewMacro.isBlock ? "div" : "span",{},childrenClone);
};

exports.wikified = WikifiedViewer;

})();
