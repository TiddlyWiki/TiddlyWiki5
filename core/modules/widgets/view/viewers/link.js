/*\
title: $:/core/modules/widgets/view/viewers/link.js
type: application/javascript
module-type: fieldviewer

A viewer for viewing tiddler fields as a link

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var LinkViewer = function(viewWidget,tiddler,field,value) {
	this.viewWidget = viewWidget;
	this.tiddler = tiddler;
	this.field = field;
	this.value = value;
};

LinkViewer.prototype.render = function() {
	var text = this.value === undefined ? "" : this.value;
	// Indicate that we're not generating an element
	this.viewWidget.tag = this.viewWidget.renderer.parseTreeNode.isBlock ? "div" : "span";
	this.viewWidget.attributes = {
		"class": "tw-view-link"
	};
	this.viewWidget.children = this.viewWidget.renderer.renderTree.createRenderers(this.viewWidget.renderer.renderContext,[{
			type: "element",
			tag: "$link",
			attributes: {
				to: {type: "string", value: text}
			},
			children: [{
				type: "text",
				text: text
			}]
		}]);
};

exports.link = LinkViewer;

})();
