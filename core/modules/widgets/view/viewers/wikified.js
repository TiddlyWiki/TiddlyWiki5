/*\
title: $:/core/modules/widgets/view/viewers/wikified.js
type: application/javascript
module-type: newfieldviewer

A viewer for viewing tiddler fields as wikified text

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var WikifiedViewer = function(viewWidget,tiddler,field,value) {
	this.viewWidget = viewWidget;
	this.tiddler = tiddler;
	this.field = field;
	this.value = value;
};

WikifiedViewer.prototype.render = function() {
	var parseTree;
	// If we're viewing the text field of a tiddler then we'll transclude it
	if(this.tiddler && this.field === "text") {
		parseTree = [{
			type: "widget",
			tag: "transclude",
			attributes: {
				target: {type: "string", value: this.tiddler.fields.title}
			}
		}];
	} else {
		parseTree = this.viewWidget.renderer.renderTree.wiki.new_parseText("text/vnd.tiddlywiki",this.value).tree;
	}
	return this.viewWidget.renderer.renderTree.createRenderers(this.viewWidget.renderer.renderContext,parseTree);
};

exports.wikified = WikifiedViewer;

})();
