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
	// Widget classes
	if(!this.widgetClasses) {
		WidgetRenderer.prototype.widgetClasses = $tw.modules.applyMethods("widget");
	}
	// Compute our attributes
	this.attributes = {};
	this.computeAttributes();
	// Create the widget object
	var WidgetClass = this.widgetClasses[this.parseTreeNode.tag];
	if(WidgetClass) {
		this.widget = new WidgetClass(this);
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
	if(this.widget) {
		if(this.widget.render) {
			return this.widget.render(type);
		} else if(this.widget.children) {
			var output = [];
			$tw.utils.each(this.widget.children,function(node) {
				if(node.render) {
					output.push(node.render(type));
				}
			});
			return output.join("");
		}
	}
};

WidgetRenderer.prototype.renderInDom = function() {
	var self = this;
	// Create the wrapper element
	this.domNode = document.createElement(this.parseTreeNode.isBlock ? "div" : "span");
	this.domNode.setAttribute("data-widget-type",this.parseTreeNode.tag);
	this.domNode.setAttribute("data-widget-attr",JSON.stringify(this.attributes));
	// Render the widget if we've got one
	if(this.widget) {
		if(this.widget.renderInDom) {
			this.widget.renderInDom(this.domNode);
		} else if(this.widget.children) {
			// Render any child nodes
			$tw.utils.each(this.widget.children,function(node) {
				if(node.renderInDom) {
					self.domNode.appendChild(node.renderInDom());
				}
			});
		}
		// Attach any event handlers
		if(this.widget.getEventListeners) {
			$tw.utils.addEventListeners(this.domNode,this.widget.getEventListeners());
		}
	}
	// Call the postRenderInDom hook if the widget has one
	if(this.widget && this.widget.postRenderInDom) {
		this.widget.postRenderInDom();
	}
	// Return the dom node
	return this.domNode;
};

WidgetRenderer.prototype.refreshInDom = function(changedTiddlers) {
	// Update our attributes
	var changedAttributes = this.computeAttributes();
	// Refresh the widget
	if(this.widget && this.widget.refreshInDom) {
		this.widget.refreshInDom(changedAttributes,changedTiddlers);
	}
};

WidgetRenderer.prototype.getContextTiddlerTitle = function() {
	var context = this.renderContext;
	while(context) {
		if($tw.utils.hop(context,"tiddlerTitle")) {
			return context.tiddlerTitle;
		}
		context = context.parentContext;
	}
	return undefined;
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

WidgetRenderer.prototype.getContextScopeId = function() {
	var guidBits = [],
		context = this.renderContext;
	while(context) {
		$tw.utils.each(context,function(field,name) {
			if(name !== "parentContext") {
				guidBits.push(name + ":" + field + ";");
			}
		});
		guidBits.push("-");
		context = context.parentContext;
	}
	return $tw.utils.toBase64(guidBits.join(""));
};


exports.widget = WidgetRenderer

})();
