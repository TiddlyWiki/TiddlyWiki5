/*\
title: $:/core/modules/widgets/view/viewers/htmlwikified.js
type: application/javascript
module-type: newfieldviewer

A viewer for viewing tiddler fields as a textual HTML representation of the wikified text

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var HtmlWikifiedViewer = function(viewWidget,tiddler,field,value) {
	this.viewWidget = viewWidget;
	this.tiddler = tiddler;
	this.field = field;
	this.value = value;
};

HtmlWikifiedViewer.prototype.render = function() {
	// Parse the field text
	var text = this.viewWidget.renderer.renderTree.wiki.new_renderText("text/html","text/vnd.tiddlywiki",this.value);
	// Create a node containing the HTML representation of the field
	var node = {
		type: "element",
		tag: "pre",
		children: [{
			type: "text",
			text: text
		}]
	};
	return this.viewWidget.renderer.renderTree.createRenderers(this.viewWidget.renderer.renderContext,[node]);
};

exports.htmlwikified = HtmlWikifiedViewer;

})();
