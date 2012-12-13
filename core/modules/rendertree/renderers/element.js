/*\
title: $:/core/modules/rendertree/renderers/element.js
type: application/javascript
module-type: wikirenderer

Element renderer

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Element renderer
*/
var ElementRenderer = function(renderTree,renderContext,parseTreeNode) {
	// Store state information
	this.renderTree = renderTree;
	this.renderContext = renderContext;
	this.parseTreeNode = parseTreeNode;
	// Compute our dependencies
	this.dependencies = {};
	var self = this;
	$tw.utils.each(this.parseTreeNode.attributes,function(attribute,name) {
		if(attribute.type === "indirect") {
			var tr = $tw.utils.parseTextReference(attribute.textReference);
			if(tr.title) {
				self.dependencies[tr.title] = true;
			} else {
				self.dependencies[renderContext.tiddlerTitle] = true;
			}
		}
	});
	// Compute our attributes
	this.computeAttributes();
	// Create the renderers for the child nodes
	this.children = this.renderTree.createRenderers(this.renderContext,this.parseTreeNode.children);
};

ElementRenderer.prototype.computeAttributes = function() {
	this.attributes = {};
	var self = this;
	$tw.utils.each(this.parseTreeNode.attributes,function(attribute,name) {
		if(attribute.type === "indirect") {
			self.attributes[name] = self.renderTree.wiki.getTextReference(attribute.textReference,self.renderContext.tiddlerTitle);
		} else { // String attribute
			self.attributes[name] = attribute.value;
		}
	});
};

ElementRenderer.prototype.render = function(type) {
	var isHtml = type === "text/html",
		output = [],attr,a,v;
	if(isHtml) {
		output.push("<",this.parseTreeNode.tag);
		if(this.attributes) {
			attr = [];
			for(a in this.attributes) {
				attr.push(a);
			}
			attr.sort();
			for(a=0; a<attr.length; a++) {
				v = this.attributes[attr[a]];
				if(v !== undefined) {
					if($tw.utils.isArray(v)) {
						v = v.join(" ");
					} else if(typeof v === "object") {
						var s = [];
						for(var p in v) {
							s.push(p + ":" + v[p] + ";");
						}
						v = s.join("");
					}
					output.push(" ",attr[a],"='",$tw.utils.htmlEncode(v),"'");
				}
			}
		}
		if(!this.children || this.children.length === 0) {
			output.push("/");
		}
		output.push(">");
	}
	if(this.children && this.children.length > 0) {
		$tw.utils.each(this.children,function(node) {
			if(node.render) {
				output.push(node.render(type));
			}
		});
		if(isHtml) {
			output.push("</",this.parseTreeNode.tag,">");
		}
	}
	return output.join("");
};

ElementRenderer.prototype.renderInDom = function() {
	// Create the element
	this.domNode = document.createElement(this.parseTreeNode.tag);
	// Assign the attributes
	this.assignAttributes();
	// Render any child nodes
	var self = this;
	$tw.utils.each(this.children,function(node) {
		if(node.renderInDom) {
			self.domNode.appendChild(node.renderInDom());
		}
	});
	// Assign any specified event handlers
	$tw.utils.addEventListeners(this.domNode,this.parseTreeNode.events);
	// Return the dom node
	return this.domNode;
};

ElementRenderer.prototype.assignAttributes = function() {
	var self = this;
	$tw.utils.each(this.attributes,function(v,a) {
		if(v !== undefined) {
			if($tw.utils.isArray(v)) { // Ahem, could there be arrays other than className?
				self.domNode.className = v.join(" "); 
			} else if (typeof v === "object") { // ...or objects other than style?
				for(var p in v) {
					self.domNode.style[$tw.utils.unHyphenateCss(p)] = v[p];
				}
			} else {
				self.domNode.setAttribute(a,v);
			}
		}
	});
};

ElementRenderer.prototype.refreshInDom = function(changes) {
	// Check if any of our dependencies have changed
	if($tw.utils.checkDependencies(this.dependencies,changes)) {
		// Update our attributes
		this.computeAttributes();
		this.assignAttributes();
	}
	// Refresh any child nodes
	$tw.utils.each(this.children,function(node) {
		if(node.refreshInDom) {
			node.refreshInDom(changes);
		}
	});
};

exports.element = ElementRenderer

})();
