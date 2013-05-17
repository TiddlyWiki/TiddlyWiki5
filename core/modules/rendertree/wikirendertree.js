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
	parser: reference to the parse tree to be rendered
	options: see below
Options include:
	wiki: mandatory reference to wiki associated with this render tree
	context: optional hashmap of context variables (see below)
	parentRenderer: optional reference to a parent renderer node for the context chain
	document: optional document object to use instead of global document
Context variables include:
	tiddlerTitle: title of the tiddler providing the context
	templateTitle: title of the tiddler providing the current template
	macroDefinitions: hashmap of macro definitions
*/
var WikiRenderTree = function(parser,options) {
	this.parser = parser;
	this.wiki = options.wiki;
	this.context = options.context || {};
	this.parentRenderer = options.parentRenderer;
	this.document = options.document || (typeof(document) === "object" ? document : null);
	// Hashmap of the renderer classes
	if(!this.rendererClasses) {
		WikiRenderTree.prototype.rendererClasses = $tw.modules.applyMethods("wikirenderer");
	}
};

/*
Generate the full render tree for this parse tree
*/
WikiRenderTree.prototype.execute = function() {
	this.rendererTree = this.createRenderers(this,this.parser.tree);
};

/*
Create an array of renderers for an array of parse tree nodes
*/
WikiRenderTree.prototype.createRenderers = function(parentRenderer,parseTreeNodes) {
	var rendererNodes = [];
	if(parseTreeNodes) {
		for(var t=0; t<parseTreeNodes.length; t++) {
			rendererNodes.push(this.createRenderer(parentRenderer,parseTreeNodes[t]));
		}
	}
	return rendererNodes;
};	

/*
Create a renderer node for a parse tree node
*/
WikiRenderTree.prototype.createRenderer = function(parentRenderer,parseTreeNode) {
	var RenderNodeClass = this.rendererClasses[parseTreeNode.type];
	return new RenderNodeClass(this,parentRenderer,parseTreeNode);
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

/*
Find the value of a given context variable for a particular renderer node
*/
WikiRenderTree.prototype.getContextVariable = function(renderer,name,defaultValue) {
	while(renderer) {
		if($tw.utils.hop(renderer.context,name)) {
			return renderer.context[name];
		}
		renderer = renderer.parentRenderer;
	};
	return defaultValue;
};

/*
Check for render context recursion from a particular renderer node by returning true if the members of a proposed new render context are already present in the render context chain
*/
WikiRenderTree.prototype.checkContextRecursion = function(renderer,newContext) {
	while(renderer) {
		var context = renderer.context;
		if(context) {
			var match = true;
			for(var member in newContext) {
				if($tw.utils.hop(context,member)) {
					if(newContext[member] !== context[member]) {
						match = false;
					}
				} else {
					match = false;
				}
			}
			if(match) {
				return true;
			}
		}
		renderer = renderer.parentRenderer;
	}
	return false;
};

WikiRenderTree.prototype.getContextScopeId = function(renderer) {
	var guidBits = [];
	while(renderer) {
		if(renderer.context) {
			$tw.utils.each(renderer.context,function(field,name) {
				guidBits.push(name + ":" + field + ";");
			});
			guidBits.push("-");
		}
		renderer = renderer.parentRenderer;
	}
	return guidBits.join("");
};

/*
Find a named macro definition
*/
WikiRenderTree.prototype.findMacroDefinition = function(renderer,name) {
	while(renderer) {
		if(renderer.context && renderer.context.macroDefinitions && renderer.context.macroDefinitions[name]) {
			return renderer.context.macroDefinitions[name];
		}
		renderer = renderer.parentRenderer;
	}
	return undefined;
};

exports.WikiRenderTree = WikiRenderTree;

})();
