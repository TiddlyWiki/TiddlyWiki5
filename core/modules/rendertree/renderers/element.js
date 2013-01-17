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
	this.children = this.renderer.renderTree.createRenderers(this.renderer.renderContext,this.renderer.parseTreeNode.children);
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
var ElementRenderer = function(renderTree,renderContext,parseTreeNode) {
	// Store state information
	this.renderTree = renderTree;
	this.renderContext = renderContext;
	this.parseTreeNode = parseTreeNode;
	// Initialise widget classes
	if(!this.widgetClasses) {
		ElementRenderer.prototype.widgetClasses = $tw.modules.applyMethods("widget");
	}
	// Compute our dependencies
	this.dependencies = {};
	var self = this;
	$tw.utils.each(this.parseTreeNode.attributes,function(attribute,name) {
		if(attribute.type === "indirect") {
			var tr = $tw.utils.parseTextReference(attribute.textReference);
			self.dependencies[tr.title ? tr.title : renderContext.tiddlerTitle] = true;
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
	var changedAttributes = {};
	var self = this;
	$tw.utils.each(this.parseTreeNode.attributes,function(attribute,name) {
		if(attribute.type === "indirect") {
			var value = self.renderTree.wiki.getTextReference(attribute.textReference,"",self.renderContext.tiddlerTitle);
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

ElementRenderer.prototype.render = function(type) {
	var isHtml = type === "text/html",
		output = [],attr,a,v;
	if(isHtml) {
		output.push("<",this.widget.tag);
		if(this.widget.attributes) {
			attr = [];
			for(a in this.widget.attributes) {
				attr.push(a);
			}
			attr.sort();
			for(a=0; a<attr.length; a++) {
				v = this.widget.attributes[attr[a]];
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
		if(!this.widget.children || this.widget.children.length === 0) {
			output.push("/");
		}
		output.push(">");
	}
	if(this.widget.children && this.widget.children.length > 0) {
		$tw.utils.each(this.widget.children,function(node) {
			if(node.render) {
				output.push(node.render(type));
			}
		});
		if(isHtml) {
			output.push("</",this.widget.tag,">");
		}
	}
	return output.join("");
};

ElementRenderer.prototype.renderInDom = function() {
	// Check if our widget is providing an element
	if(this.widget.tag) {
		// Create the element
		this.domNode = document.createElement(this.widget.tag);
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
		// Call postRenderInDom if the widget provides it
		if(this.widget.postRenderInDom) {
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
				self.domNode.setAttribute(a,v);
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

ElementRenderer.prototype.getContextTiddlerTitle = function() {
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
ElementRenderer.prototype.checkContextRecursion = function(newRenderContext) {
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

ElementRenderer.prototype.getContextScopeId = function() {
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

exports.element = ElementRenderer

})();
