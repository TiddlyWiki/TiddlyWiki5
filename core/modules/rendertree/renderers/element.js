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
Element widget. A degenerate widget that renders ordinary HTML elements
*/
var ElementWidget = function(renderer) {
	this.renderer = renderer;
	this.tag = this.renderer.parseTreeNode.tag;
	this.attributes = this.renderer.attributes;
	this.children = this.renderer.renderTree.createRenderers(this.renderer,this.renderer.parseTreeNode.children);
	this.events = this.renderer.parseTreeNode.events;
};

ElementWidget.prototype.refreshInDom = function(changedAttributes,changedTiddlers) {
	// Check if any of our attribute dependencies have changed
	if($tw.utils.count(changedAttributes) > 0) {
		// Update our attributes
		this.renderer.assignAttributes();
	}
	// Refresh any child nodes
	$tw.utils.each(this.children,function(node) {
		if(node.refreshInDom) {
			node.refreshInDom(changedTiddlers);
		}
	});
};

/*
Element renderer
*/
var ElementRenderer = function(renderTree,parentRenderer,parseTreeNode) {
	// Store state information
	this.renderTree = renderTree;
	this.parentRenderer = parentRenderer;
	this.parseTreeNode = parseTreeNode;
	// Initialise widget classes
	if(!this.widgetClasses) {
		ElementRenderer.prototype.widgetClasses = $tw.modules.applyMethods("widget");
	}
	// Select the namespace for the tag
	var tagNameSpaces = {
		svg: "http://www.w3.org/2000/svg"
	};
	this.namespace = tagNameSpaces[this.parseTreeNode.tag];
	if(this.namespace) {
		this.context = this.context || {};
		this.context.namespace = this.namespace;
	} else {
		this.namespace = this.renderTree.getContextVariable(this.parentRenderer,"namespace","http://www.w3.org/1999/xhtml");
	}
	// Get the context tiddler title
	this.tiddlerTitle = this.renderTree.getContextVariable(this.parentRenderer,"tiddlerTitle");
	// Compute our dependencies
	this.dependencies = {};
	var self = this;
	$tw.utils.each(this.parseTreeNode.attributes,function(attribute,name) {
		if(attribute.type === "indirect") {
			var tr = $tw.utils.parseTextReference(attribute.textReference);
			self.dependencies[tr.title ? tr.title : self.tiddlerTitle] = true;
		}
	});
	// Compute our attributes
	this.attributes = {};
	this.computeAttributes();
	// Create the parasite widget object if required
	if(this.parseTreeNode.tag.charAt(0) === "$") {
		// Choose the class
		var WidgetClass = this.widgetClasses[this.parseTreeNode.tag.substr(1)];
		// Instantiate the widget
		if(WidgetClass) {
			this.widget = new WidgetClass(this);
		} else {
			WidgetClass = this.widgetClasses.error;
			if(WidgetClass) {
				this.widget = new WidgetClass(this,"Unknown widget '<" + this.parseTreeNode.tag + ">'");
			}
		}
	}
	// If we haven't got a widget, use the generic HTML element widget
	if(!this.widget) {
		this.widget = new ElementWidget(this);
	}
};

ElementRenderer.prototype.computeAttributes = function() {
	var changedAttributes = {},
		self = this,
		value;
	$tw.utils.each(this.parseTreeNode.attributes,function(attribute,name) {
		if(attribute.type === "indirect") {
			value = self.renderTree.wiki.getTextReference(attribute.textReference,"",self.tiddlerTitle);
		} else if(attribute.type === "macro") {
			// Get the macro definition
			var macro = self.renderTree.findMacroDefinition(self.parentRenderer,attribute.value.name);
			if(!macro) {
				value = "";
			} else {
				// Substitute the macro parameters
				value = self.renderTree.substituteParameters(macro,attribute.value);
				// Parse the text and render it as text
				value = self.renderTree.wiki.renderText("text/plain","text/vnd.tiddlywiki",value,self.context);
			}
		} else { // String attribute
			value = attribute.value;
		}
		// Check whether the attribute has changed
		if(self.attributes[name] !== value) {
			self.attributes[name] = value;
			changedAttributes[name] = true;
		}
	});
	return changedAttributes;
};

ElementRenderer.prototype.hasAttribute = function(name) {
	return $tw.utils.hop(this.attributes,name);
};

ElementRenderer.prototype.getAttribute = function(name,defaultValue) {
	if($tw.utils.hop(this.attributes,name)) {
		return this.attributes[name];
	} else {
		return defaultValue;
	}
};

ElementRenderer.prototype.renderInDom = function() {
	// Check if our widget is providing an element
	if(this.widget.tag) {
		// Create the element
		this.domNode = this.renderTree.document.createElementNS(this.namespace,this.widget.tag);
		// Assign any specified event handlers
		$tw.utils.addEventListeners(this.domNode,this.widget.events);
		// Assign the attributes
		this.assignAttributes();
		// Render any child nodes
		var self = this;
		$tw.utils.each(this.widget.children,function(node) {
			if(node.renderInDom) {
				self.domNode.appendChild(node.renderInDom());
			}
		});
		// Call postRenderInDom if the widget provides it and we're in the browser
		if($tw.browser && this.widget.postRenderInDom) {
			this.widget.postRenderInDom();
		}
		// Return the dom node
		return this.domNode;
	} else {
		// If we're not generating an element, just render our first child
		return this.widget.children[0].renderInDom();
	}
};

ElementRenderer.prototype.assignAttributes = function() {
	var self = this;
	$tw.utils.each(this.widget.attributes,function(v,a) {
		if(v !== undefined) {
			if($tw.utils.isArray(v)) { // Ahem, could there be arrays other than className?
				self.domNode.className = v.join(" "); 
			} else if (typeof v === "object") { // ...or objects other than style?
				for(var p in v) {
					self.domNode.style[$tw.utils.unHyphenateCss(p)] = v[p];
				}
			} else {
				// Setting certain attributes can cause a DOM error (eg xmlns on the svg element)
				try {
					self.domNode.setAttributeNS(null,a,v);
				} catch(e) {
				}
			}
		}
	});
};

ElementRenderer.prototype.refreshInDom = function(changedTiddlers) {
	// Update our attributes if required
	var changedAttributes = {};
	if($tw.utils.checkDependencies(this.dependencies,changedTiddlers)) {
		changedAttributes = this.computeAttributes();
	}
	// Check if the widget has a refreshInDom method
	if(this.widget.refreshInDom) {
		// Let the widget refresh itself
		this.widget.refreshInDom(changedAttributes,changedTiddlers);
	} else {
		// If not, assign the attributes and refresh any child nodes
		this.assignAttributes();
		$tw.utils.each(this.widget.children,function(node) {
			if(node.refreshInDom) {
				node.refreshInDom(changedTiddlers);
			}
		});
	}
};

exports.element = ElementRenderer

})();
