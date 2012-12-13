/*\
title: $:/core/modules/widgets/view/viewers/link.js
type: application/javascript
module-type: newfieldviewer

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
	var parseTree = [];
	if(this.value === undefined) {
		parseTree.push({type: "text", text: ""});
	} else {
		parseTree.push({
			type: "widget",
			tag: "link",
			attributes: {
				to: {type: "string", value: this.value}
			},
			children: [{
				type: "text",
				text: this.value
			}]
		})
	}
	return this.viewWidget.renderer.renderTree.createRenderers(this.viewWidget.renderer.renderContext,parseTree);
};

exports.link = LinkViewer;

})();
