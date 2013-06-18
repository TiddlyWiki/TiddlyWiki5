/*\
title: $:/core/modules/rendertree/renderers/macrocall.js
type: application/javascript
module-type: wikirenderer

Macro call renderer

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Macro call renderer
*/
var MacroCallRenderer = function(renderTree,parentRenderer,parseTreeNode) {
	// Store state information
	this.renderTree = renderTree;
	this.parentRenderer = parentRenderer;
	this.parseTreeNode = parseTreeNode;
	// Find the macro definition
	var macro = this.renderTree.findMacroDefinition(this.parentRenderer,this.parseTreeNode.name);
	// Insert an error message if we couldn't find the macro
	var childTree;
	if(!macro) {
		childTree = [{type: "text", text: "<<Undefined macro: " + this.parseTreeNode.name + ">>"}];
	} else {
		// Substitute the macro parameters
		var text = this.renderTree.substituteParameters(macro,this.parseTreeNode);
		// Parse the text
		childTree = this.renderTree.wiki.parseText("text/vnd.tiddlywiki",text,{parseAsInline: !this.parseTreeNode.isBlock}).tree;
	}
	// Create the renderers for the child nodes
	this.children = this.renderTree.createRenderers(this,childTree);
};

MacroCallRenderer.prototype.renderInDom = function() {
	// Create the element
	this.domNode = this.renderTree.document.createElement(this.parseTreeNode.isBlock ? "div" : "span");
	this.domNode.setAttribute("data-macro-name",this.parseTreeNode.name);
	// Render any child nodes
	var self = this;
	$tw.utils.each(this.children,function(node,index) {
		if(node.renderInDom) {
			self.domNode.appendChild(node.renderInDom());
		}
	});
	// Return the dom node
	return this.domNode;
};

exports.macrocall = MacroCallRenderer

})();
