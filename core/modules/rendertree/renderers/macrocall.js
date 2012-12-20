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
var MacroCallRenderer = function(renderTree,renderContext,parseTreeNode) {
	// Store state information
	this.renderTree = renderTree;
	this.renderContext = renderContext;
	this.parseTreeNode = parseTreeNode;
	// Find the macro definition
	var macro,childTree;
	if($tw.utils.hop(this.renderTree.parser.macroDefinitions,this.parseTreeNode.name)) {
		macro = this.renderTree.parser.macroDefinitions[this.parseTreeNode.name];
	}
	// Insert an error message if we couldn't find the macro
	if(!macro) {
		childTree = [{type: "text", text: "<<Undefined macro: " + this.parseTreeNode.name + ">>"}];
	} else {
		// Substitute the macro parameters
		var text = this.substituteParameters(macro.text,this.parseTreeNode,macro);
		// Parse the text
		childTree = this.renderTree.wiki.new_parseText("text/vnd.tiddlywiki",text,{parseAsInline: !this.parseTreeNode.isBlock}).tree;
	}
	// Create the renderers for the child nodes
	this.children = this.renderTree.createRenderers(this.renderContext,childTree);
};

/*
Expand the parameters in a block of text
*/
MacroCallRenderer.prototype.substituteParameters = function(text,macroCallParseTreeNode,macroDefinition) {
	var nextAnonParameter = 0; // Next candidate anonymous parameter in macro call
	// Step through each of the parameters in the macro definition
	for(var p=0; p<macroDefinition.params.length; p++) {
		// Check if we've got a macro call parameter with the same name
		var paramInfo = macroDefinition.params[p],
			paramValue = undefined;
		for(var m=0; m<macroCallParseTreeNode.params.length; m++) {
			if(macroCallParseTreeNode.params[m].name === paramInfo.name) {
				paramValue = macroCallParseTreeNode.params[m].value;
			}
		}
		// If not, use the next available anonymous macro call parameter
		if(!paramValue && macroCallParseTreeNode.params.length > 0) {
			while(macroCallParseTreeNode.params[nextAnonParameter].name && nextAnonParameter < macroCallParseTreeNode.params.length-1) {
				nextAnonParameter++;
			}
			if(!macroCallParseTreeNode.params[nextAnonParameter].name) {
				paramValue = macroCallParseTreeNode.params[nextAnonParameter].value;
				nextAnonParameter++;
			}
		}
		// If we've still not got a value, use the default, if any
		paramValue = paramValue || paramInfo["default"] || "";
		// Replace any instances of this parameter
		text = text.replace(new RegExp("\\$" + $tw.utils.escapeRegExp(paramInfo.name) + "\\$","mg"),paramValue);
	}
	return text;
};

MacroCallRenderer.prototype.render = function(type) {
	var output = [];
	$tw.utils.each(this.children,function(node) {
		if(node.render) {
			output.push(node.render(type));
		}
	});
	return output.join("");
};

MacroCallRenderer.prototype.renderInDom = function() {
	// Create the element
	this.domNode = document.createElement(this.parseTreeNode.isBlock ? "div" : "span");
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
