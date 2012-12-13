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
var EntityRenderer = function(renderTree,renderContext,parseTreeNode) {
	// Store state information
	this.renderTree = renderTree;
	this.renderContext = renderContext;
	this.parseTreeNode = parseTreeNode;
};

EntityRenderer.prototype.render = function(type) {
	return type === "text/html" ? this.parseTreeNode.entity : $tw.utils.entityDecode(this.parseTreeNode.entity);
};

EntityRenderer.prototype.renderInDom = function() {
	return document.createTextNode($tw.utils.entityDecode(this.parseTreeNode.entity));
};

exports.entity = EntityRenderer

})();
