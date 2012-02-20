/*\
title: js/Renderer.js

Renderer objects 

\*/
(function(){

/*jshint node: true, browser: true */
"use strict";

var utils = require("./Utils.js"),
	Dependencies = require("./Dependencies.js").Dependencies;

var Node = function(children) {
	if(this instanceof Node) {
		this.children = children;
	} else {
		return new Node(children);
	}
};

Node.prototype.clone = function() {
	// By default we don't actually clone nodes, we just re-use them (we do clone macros and elements)
	return this;
};

Node.prototype.execute = function(parents,tiddler) {
};

Node.prototype.render = function(type) {
};

Node.prototype.renderInDom = function(domNode) {
};

Node.prototype.refresh = function(changes) {
};

Node.prototype.refreshInDom = function(changes) {
};

/*
Construct a renderer node representing a macro invocation
	macroName: name of the macro
	params: a hashmap of parameters (each can be a string, or a fn(tiddler,store,utils) for evaluated parameters)
	children: optional array of child nodes
	store: reference to the WikiStore associated with this macro
*/
var MacroNode = function(macroName,srcParams,children,store,dependencies) {
	if(this instanceof MacroNode) {
		// Save the details
		this.macroName = macroName;
		this.macro = store.macros[macroName];
		this.srcParams = srcParams;
		this.children = children;
		this.store = store;
		// Evaluate the dependencies
		if(dependencies) {
			this.dependencies = dependencies;
		} else {
			this.dependencies = new Dependencies();
			if(srcParams && this.macro) {
				if(this.macro.dependentAll) {
					this.dependencies.dependentAll = true;
				}
				for(var m in this.macro.params) {
					var paramInfo = this.macro.params[m];
					if(m in srcParams) {
						if(paramInfo.type === "tiddler") {
							if(typeof srcParams[m] === "function") {
								this.dependencies.dependentAll = true;
							} else {
								this.dependencies.addDependency(srcParams[m],paramInfo.skinny);
							}
						}
					}
				}
			}
		}
	} else {
		return new MacroNode(macroName,srcParams,children,store,dependencies);
	}
};

MacroNode.prototype = new Node();
MacroNode.prototype.constructor = MacroNode;

MacroNode.prototype.clone = function() {
	return new MacroNode(this.macroName,this.srcParams,this.cloneChildren(),this.store,this.dependencies);
};

MacroNode.prototype.cloneChildren = function() {
	var childClones;
	if(this.children) {
		childClones = [];
		for(var t=0; t<this.children.length; t++) {
			childClones.push(this.children[t].clone());
		}
	}
	return childClones;
};

MacroNode.prototype.execute = function(parents,tiddler) {
	// Evaluate macro parameters to get their values
	this.params = {};
	for(var p in this.srcParams) {
		if(typeof this.srcParams[p] === "function") {
			this.params[p] = this.srcParams[p](tiddler,this.store,utils);
		} else {
			this.params[p] = this.srcParams[p];
		}
	}
	// Save the context tiddler
	this.tiddlerTitle = tiddler ? tiddler.title : null;
	// Save a reference to the array of parents
	this.parents = parents || [];
	// Render the macro to get its content
	this.content = this.macro.execute(this,tiddler,this.store);
};

MacroNode.prototype.render = function(type) {
	var output = [];
	for(var t=0; t<this.content.length; t++) {
		output.push(this.content[t].render(type));
	}
	return output.join("");
};

MacroNode.prototype.renderInDom = function(domNode,insertBefore) {
	// Create the wrapper node for the macro
	var macroContainer = document.createElement(this.macro.wrapperTag || "span");
	this.domNode = macroContainer;
	if(insertBefore) {
		domNode.insertBefore(macroContainer,insertBefore);	
	} else {
		domNode.appendChild(macroContainer);
	}
	// Add some debugging information to it
	macroContainer.setAttribute("data-tw-macro",this.macroName);
	// Add event handlers to the node
	var self = this,
		dispatchMacroEvent = function(event) {
			self.macro.events[event.type](event,self);
		};
	for(var e in this.macro.events) {
		macroContainer.addEventListener(e,dispatchMacroEvent,false);
	}
	// Render the content of the macro
	for(var t=0; t<this.content.length; t++) {
		this.content[t].renderInDom(macroContainer);
	}
};

MacroNode.prototype.refresh = function(changes) {
	var t,
		self = this;
	// Check if any of the dependencies of this macro node have changed
	if(this.dependencies.hasChanged(changes)) {
		// Re-execute the macro if so
		var tiddler = this.store.getTiddler(this.tiddlerTitle);
		this.execute(this.parents,tiddler);
	} else {
		// Refresh any children
		for(t=0; t<this.content.length; t++) {
			this.content[t].refresh(changes);
		}
	}
};

MacroNode.prototype.refreshInDom = function(changes) {
	var t,
		self = this;
	// Check if any of the dependencies of this macro node have changed
	if(this.dependencies.hasChanged(changes)) {
		// Ask the macro to rerender itself if it can
		var tiddler = this.store.getTiddler(this.tiddlerTitle);
		if(this.macro.refresh) {
			this.macro.refresh(changes,this,tiddler,this.store);
		} else {
			// Manually reexecute and rerender this macro
			while(this.domNode.hasChildNodes()) {
				this.domNode.removeChild(this.domNode.firstChild);
			}
			this.execute(this.parents,tiddler);
			for(t=0; t<this.content.length; t++) {
				this.content[t].renderInDom(this.domNode);
			}
		}
	} else {
		// Refresh any children
		for(t=0; t<this.content.length; t++) {
			this.content[t].refreshInDom(changes);
		}
	}
};

var ElementNode = function(type,attributes,children) {
	if(this instanceof ElementNode) {
		this.type = type;
		this.attributes = attributes;
		this.children = children;
	} else {
		return new ElementNode(type,attributes,children);
	}
};

ElementNode.prototype = new Node();
ElementNode.prototype.constructor = ElementNode;

ElementNode.prototype.clone = function() {
	var childClones;
	if(this.children) {
		childClones = [];
		for(var t=0; t<this.children.length; t++) {
			childClones.push(this.children[t].clone());
		}
	}
	return new ElementNode(this.type,this.attributes,childClones);
};

ElementNode.prototype.execute = function(parents,tiddler) {
	if(this.children) {
		for(var t=0; t<this.children.length; t++) {
			this.children[t].execute(parents,tiddler);
		}
	}
};

ElementNode.prototype.render = function(type) {
	var isHtml = type === "text/html",
		output = [];
	if(isHtml) {
		output.push("<",this.type);
		if(this.attributes) {
			for(var a in this.attributes) {
				var v = this.attributes[a];
				if(v !== undefined) {
					if(v instanceof Array) {
						v = v.join(" ");
					} else if(typeof v === "object") {
						var s = [];
						for(var p in v) {
							s.push(p + ":" + v[p] + ";");
						}
						v = s.join("");
					}
					output.push(" ",a,"='",utils.htmlEncode(v),"'");
				}
			}
		}
		output.push(">");
	}
	if(this.children) {
		for(var t=0; t<this.children.length; t++) {
			output.push(this.children[t].render(type));
		}
		if(isHtml) {
			output.push("</",this.type,">");
		}
	}
	return output.join("");
};

ElementNode.prototype.renderInDom = function(domNode) {
	var element = document.createElement(this.type);
	if(this.attributes) {
		for(var a in this.attributes) {
			var v = this.attributes[a];
			if(v !== undefined) {
				if(v instanceof Array) { // Ahem, could there be arrays other than className?
					element.className = v.join(" "); 
				} else if (typeof v === "object") { // ...or objects other than style?
					for(var p in v) {
						element.style[p] = v[p];
					}
				} else {
					element.setAttribute(a,v);
				}
			}
		}
	}
	domNode.appendChild(element);
	if(this.children) {
		for(var t=0; t<this.children.length; t++) {
			this.children[t].renderInDom(element);
		}
	}
};

ElementNode.prototype.refresh = function(changes) {
	if(this.children) {
		for(var t=0; t<this.children.length; t++) {
			this.children[t].refresh(changes);
		}
	}
};

ElementNode.prototype.refreshInDom = function(changes) {
	if(this.children) {
		for(var t=0; t<this.children.length; t++) {
			this.children[t].refreshInDom(changes);
		}
	}
};

var TextNode = function(text) {
	if(this instanceof TextNode) {
		this.text = text;
	} else {
		return new TextNode(text);
	}
};

TextNode.prototype = new Node();
TextNode.prototype.constructor = TextNode;

TextNode.prototype.render = function(type) {
	return type === "text/html" ? utils.htmlEncode(this.text) : this.text;
};

TextNode.prototype.renderInDom = function(domNode) {
	domNode.appendChild(document.createTextNode(this.text));	
};

var EntityNode = function(entity) {
	if(this instanceof EntityNode) {
		this.entity = entity;
	} else {
		return new EntityNode(entity);	
	}
};

EntityNode.prototype = new Node();
EntityNode.prototype.constructor = EntityNode;

EntityNode.prototype.render = function(type) {
	return type === "text/html" ? this.entity : utils.entityDecode(this.entity);
};

EntityNode.prototype.renderInDom = function(domNode) {
	domNode.appendChild(document.createTextNode(utils.entityDecode(this.entity)));
};

var RawNode = function(html) {
	if(this instanceof RawNode) {
		this.html = html;
	} else {
		return new RawNode(html);	
	}
};

RawNode.prototype = new Node();
RawNode.prototype.constructor = RawNode;

RawNode.prototype.render = function(type) {
	return this.html;
};

RawNode.prototype.renderInDom = function(domNode) {
	var div = document.createElement("div");
	div.innerHTML = this.html;
	domNode.appendChild(div);	
};

/*
Static method to construct a label
*/
var LabelNode = function(type,value,classes) {
    classes = (classes || []).slice(0);
    classes.push("label");
    return new ElementNode("span",{
        "class": classes,
		"data-tw-label-type": type
    },value);
};

/*
Static method to construct a split label
*/
var SplitLabelNode = function(type,left,right,classes) {
	classes = (classes || []).slice(0);
	classes.push("splitLabel");
	return new ElementNode("span",{
		"class": classes
	},[
		new ElementNode("span",{
			"class": ["splitLabelLeft"],
			"data-tw-label-type": type
		},left),
		new ElementNode("span",{
			"class": ["splitLabelRight"]
		},right)
	]);
};

/*
Static method to construct a slider
*/
var SliderNode = function(type,label,tooltip,isOpen,children) {
	var attributes = {
		"class": "tw-slider",
		"data-tw-slider-type": type
	};
	if(tooltip) {
		attributes.alt = tooltip;
		attributes.title = tooltip;
	}
	return new ElementNode("span",
		attributes,
		[
			new ElementNode("a",
				{
					"class": ["tw-slider-label"]
				},[
					new TextNode(label)
				]
			),
			new ElementNode("div",
				{
					"class": ["tw-slider-body"],
					"style": {"display": isOpen ? "block" : "none"}
				},
				children
			)
		]
	);
};

var Renderer = {
	MacroNode: MacroNode,
	ElementNode: ElementNode,
	TextNode: TextNode,
	EntityNode: EntityNode,
	LabelNode: LabelNode,
	SplitLabelNode: SplitLabelNode,
	SliderNode: SliderNode
};

exports.Renderer = Renderer;

})();
