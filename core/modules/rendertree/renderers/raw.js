/*\
title: $:/core/modules/rendertree/renderers/raw.js
type: application/javascript
module-type: wikirenderer

Raw HTML renderer

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Raw HTML renderer
*/
var RawRenderer = function(renderTree,parentRenderer,parseTreeNode) {
	// Store state information
	this.renderTree = renderTree;
	this.parentRenderer = parentRenderer;
	this.parseTreeNode = parseTreeNode;
};

RawRenderer.prototype.renderInDom = function() {
	var domNode = this.renderTree.document.createElement("div");
	domNode.innerHTML = this.parseTreeNode.html;
	return domNode;
};

exports.raw = RawRenderer

})();
