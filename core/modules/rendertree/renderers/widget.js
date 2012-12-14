/*\
title: $:/core/modules/rendertree/renderers/widget.js
type: application/javascript
module-type: wikirenderer

Widget renderer.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Widget renderer
*/
var WidgetRenderer = function(renderTree,renderContext,parseTreeNode) {
	// Store state information
	this.renderTree = renderTree;
	this.renderContext = renderContext;
	this.parseTreeNode = parseTreeNode;
	// Compute the default dependencies
	this.dependencies = {};
	var self = this;
	$tw.utils.each(this.parseTreeNode.attributes,function(attribute,name) {
		if(attribute.type === "indirect") {
			var tr = self.renderTree.wiki.parseTextReference(attribute.textReference);
			if(tr.title) {
				self.dependencies[tr.title] = true;
			} else {
				self.dependencies[renderContext.tiddlerTitle] = true;
			}
		}
	});
	// Compute our attributes
	this.attributes = {};
	this.computeAttributes();
	// Create the widget object
	var WidgetClass = this.renderTree.parser.vocabulary.widgetClasses[this.parseTreeNode.tag];
	if(WidgetClass) {
		this.widget = new WidgetClass();
		this.widget.init(this);
	} else {
		// Error if we couldn't find the widget
		this.children = this.renderTree.createRenderers(this.renderContext,[
				{type: "text", text: "Unknown widget type '" + this.parseTreeNode.tag + "'"}
			]);
	}
};

WidgetRenderer.prototype.computeAttributes = function() {
	var changedAttributes = {};
	var self = this;
	$tw.utils.each(this.parseTreeNode.attributes,function(attribute,name) {
		if(attribute.type === "indirect") {
			var value = self.renderTree.wiki.getTextReference(attribute.textReference,self.renderContext.tiddlerTitle);
			if(self.attributes[name] !== value) {
				self.attributes[name] = value;
				changedAttributes[name] = true;
			}
		} else { // String attribute
			if(self.attributes[name] !== attribute.value) {
				self.attributes[name] = attribute.value;
				changedAttributes[name] = true;
			}
		}
	});
	return changedAttributes;
};

WidgetRenderer.prototype.hasAttribute = function(name) {
	return $tw.utils.hop(this.attributes,name);
};

WidgetRenderer.prototype.getAttribute = function(name,defaultValue) {
	if($tw.utils.hop(this.attributes,name)) {
		return this.attributes[name];
	} else {
		return defaultValue;
	}
};

WidgetRenderer.prototype.render = function(type) {
	// Render the widget if we've got one
	if(this.widget && this.widget.render) {
		return this.widget.render(type);
	}
};

WidgetRenderer.prototype.renderInDom = function() {
	// Create the wrapper element
	this.domNode = document.createElement("widget");
	this.domNode.setAttribute("data-widget-type",this.parseTreeNode.tag);
	this.domNode.setAttribute("data-widget-attr",JSON.stringify(this.attributes));
	// Render the widget if we've got one
	if(this.widget) {
		this.widget.renderInDom(this.domNode);
		// Attach any event handlers
		if(this.widget.getEventListeners) {
			$tw.utils.addEventListeners(this.domNode,this.widget.getEventListeners());
		}
	}
	// Return the dom node
	return this.domNode;
};

WidgetRenderer.prototype.refreshInDom = function(changedTiddlers) {
	// Refresh if the widget cleared the depencies hashmap to indicate that it should always be refreshed, or if any of our dependencies have changed
	if(!this.dependencies || $tw.utils.checkDependencies(this.dependencies,changedTiddlers)) {
		// Update our attributes
		var changedAttributes = this.computeAttributes();
		// Refresh the widget
		if(this.widget && this.widget.refreshInDom) {
			this.widget.refreshInDom(changedAttributes,changedTiddlers);
			return;
		}
	}
	// If the widget itself didn't need refreshing, just refresh any child nodes
	var self = this;
	$tw.utils.each(this.children,function(node,index) {
		if(node.refreshInDom) {
			node.refreshInDom(changedTiddlers);
		}
	});
};

WidgetRenderer.prototype.getContextTiddlerTitle = function() {
	return this.renderContext ? this.renderContext.tiddlerTitle : undefined;
};

/*
Check for render context recursion by returning true if the members of a proposed new render context are already present in the render context chain
*/
WidgetRenderer.prototype.checkContextRecursion = function(newRenderContext) {
	var context = this.renderContext;
	while(context) {
		var match = true;
		for(var member in newRenderContext) {
			if($tw.utils.hop(newRenderContext,member)) {
				if(newRenderContext[member] && newRenderContext[member] !== context[member]) {
					match = false;
				}
			}
		}
		if(match) {
			return true;
		}
		context = context.parentContext;
	}
	return false;
};

exports.widget = WidgetRenderer

})();
