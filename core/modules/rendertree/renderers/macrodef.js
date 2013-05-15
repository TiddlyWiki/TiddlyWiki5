/*\
title: $:/core/modules/rendertree/renderers/macrodef.js
type: application/javascript
module-type: wikirenderer

Macro definition renderer

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Macro definition renderer
*/
var MacroDefRenderer = function(renderTree,parentRenderer,parseTreeNode) {
	// Store state information
	this.renderTree = renderTree;
	this.parentRenderer = parentRenderer;
	this.parseTreeNode = parseTreeNode;
	// Save the macro definition into the context of the rendertree
	this.renderTree.context.macroDefinitions = this.renderTree.context.macroDefinitions || {};
	this.renderTree.context.macroDefinitions[this.parseTreeNode.name] = this.parseTreeNode;
};

exports.macrodef = MacroDefRenderer

})();
