/*\
title: $:/core/modules/rendertree/renderers/entity.js
type: application/javascript
module-type: wikirenderer

Entity renderer

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Entity renderer
*/
var EntityRenderer = function(renderTree,parentRenderer,parseTreeNode) {
	// Store state information
	this.renderTree = renderTree;
	this.parentRenderer = parentRenderer;
	this.parseTreeNode = parseTreeNode;
};

EntityRenderer.prototype.renderInDom = function() {
	return this.renderTree.document.createTextNode($tw.utils.entityDecode(this.parseTreeNode.entity));
};

exports.entity = EntityRenderer

})();
