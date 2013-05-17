/*\
title: $:/core/modules/rendertree/renderers/text.js
type: application/javascript
module-type: wikirenderer

Text renderer

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Text renderer
*/
var TextRenderer = function(renderTree,parentRenderer,parseTreeNode) {
	// Store state information
	this.renderTree = renderTree;
	this.parentRenderer = parentRenderer;
	this.parseTreeNode = parseTreeNode;
};

TextRenderer.prototype.renderInDom = function() {
	return this.renderTree.document.createTextNode(this.parseTreeNode.text);
};

exports.text = TextRenderer

})();
