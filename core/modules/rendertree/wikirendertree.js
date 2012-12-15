/*\
title: $:/core/modules/rendertree/wikirendertree.js
type: application/javascript
module-type: global

Wiki text render tree

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Create a render tree object for a parse tree
*/
var WikiRenderTree = function(parser,options) {
	this.parser = parser;
	this.wiki = options.wiki;
};

/*
Generate the full render tree for this parse tree
	renderContext: see below
An renderContext consists of these fields:
	tiddlerTitle: title of the tiddler providing the context
	parentContext: reference back to previous context in the stack
*/
WikiRenderTree.prototype.execute = function(renderContext) {
	this.rendererTree = this.createRenderers(renderContext,this.parser.tree);
};

/*
Create an array of renderers for an array of parse tree nodes
*/
WikiRenderTree.prototype.createRenderers = function(renderContext,parseTreeNodes) {
	var rendererNodes = [];
	if(parseTreeNodes) {
		for(var t=0; t<parseTreeNodes.length; t++) {
			rendererNodes.push(this.createRenderer(renderContext,parseTreeNodes[t]));
		}
	}
	return rendererNodes;
};	

/*
Create a renderer node for a parse tree node
*/
WikiRenderTree.prototype.createRenderer = function(renderContext,parseTreeNode) {
	var RenderNodeClass = this.parser.vocabulary.rendererClasses[parseTreeNode.type];
	return new RenderNodeClass(this,renderContext,parseTreeNode);
};

/*
Render as a string
*/
WikiRenderTree.prototype.render = function(type) {
	var output = [];
	$tw.utils.each(this.rendererTree,function(node) {
		if(node.render) {
			output.push(node.render(type));
		}
	});
	return output.join("");
};

/*
Render to the DOM
*/
WikiRenderTree.prototype.renderInDom = function(container) {
	this.container = container;
	$tw.utils.each(this.rendererTree,function(node) {
		if(node.renderInDom) {
			container.appendChild(node.renderInDom());
		}
	});
};

/*
Update the DOM rendering in the light of a set of changes
*/
WikiRenderTree.prototype.refreshInDom = function(changes) {
	$tw.utils.each(this.rendererTree,function(node) {
		if(node.refreshInDom) {
			node.refreshInDom(changes);
		}
	});
};

exports.WikiRenderTree = WikiRenderTree;

})();
