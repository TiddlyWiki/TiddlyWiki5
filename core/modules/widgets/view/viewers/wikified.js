/*\
title: $:/core/modules/widgets/view/viewers/wikified.js
type: application/javascript
module-type: fieldviewer

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
	// Set the element details
	this.viewWidget.tag = this.viewWidget.renderer.parseTreeNode.isBlock ? "div" : "span";
	this.viewWidget.attributes = {};
	var node = {
			type: "element",
			tag: "$transclude",
			attributes: {
				"class": "tw-view-wikified",
				field: {type: "string", value: this.field}
			},
			isBlock: this.viewWidget.renderer.parseTreeNode.isBlock
		};
	if(this.tiddler && this.tiddler.fields.title) {
		node.attributes.target = {type: "string", value: this.tiddler.fields.title}
	}
	this.viewWidget.children = this.viewWidget.renderer.renderTree.createRenderers(this.viewWidget.renderer.renderContext,[node]);
};

exports.wikified = WikifiedViewer;

})();
