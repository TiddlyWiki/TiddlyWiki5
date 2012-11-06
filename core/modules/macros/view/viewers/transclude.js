/*\
title: $:/core/modules/macros/view/viewers/transclude.js
type: application/javascript
module-type: fieldviewer

A viewer that transcludes the tiddler whose title is specified in the viewed field

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var TranscludeViewer = function(viewMacro,tiddler,field,value) {
	this.viewMacro = viewMacro;
	this.tiddler = tiddler;
	this.field = field;
	this.value = value;
};

TranscludeViewer.prototype.render = function() {
	if(this.tiddler && this.viewMacro.params.field && (this.viewMacro.params.field in this.tiddler.fields)) {
		var children = this.viewMacro.wiki.parseTiddler(this.tiddler.fields[this.viewMacro.params.field]).tree,
			childrenClone = [],t;
		for(t=0; t<children.length; t++) {
			childrenClone.push(children[t].clone());
		}
		for(t=0; t<childrenClone.length; t++) {
			childrenClone[t].execute(this.viewMacro.parents,this.viewMacro.tiddlerTitle);
		}
		return $tw.Tree.Element(this.viewMacro.isBlock ? "div" : "span",{},childrenClone);
	}
};

exports.transclude = TranscludeViewer;

})();
