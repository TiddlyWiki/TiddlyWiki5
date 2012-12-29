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
var MacroDefRenderer = function(renderTree,renderContext,parseTreeNode) {
	// Store state information
	this.renderTree = renderTree;
	this.renderContext = renderContext;
	this.parseTreeNode = parseTreeNode;
	// Save the macro definition into the render context
	this.renderContext.macroDefinitions = this.renderContext.macroDefinitions || {};
	this.renderContext.macroDefinitions[this.parseTreeNode.name] = this.parseTreeNode;
};

exports.macrodef = MacroDefRenderer

})();
