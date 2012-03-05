/*\
title: js/Renderer.js

Renderer objects 

\*/
(function(){

/*jshint node: true, browser: true */
"use strict";

var utils = require("./Utils.js"),
	ArgParser = require("./ArgParser.js").ArgParser,
	Dependencies = require("./Dependencies.js").Dependencies,
	esprima = require("esprima");

// Intialise the renderer object
var Renderer = function(nodes,dependencies,store) {
	this.nodes = nodes;
	this.dependencies = dependencies;
	this.store = store;
};

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

Node.prototype.execute = 
Node.prototype.render =
Node.prototype.renderInDom =
Node.prototype.refresh =
Node.prototype.refreshInDom = function() {
	// All these methods are no-ops by default
};

/*
Construct a renderer node representing a macro invocation
	macroName: name of the macro
	srcParams: a hashmap of parameters (each can be a string, or a fn(tiddler,store,utils) for evaluated parameters)
	children: optional array of child nodes
	store: reference to the WikiStore associated with this macro
*/
var MacroNode = function(macroName,srcParams,children,store,dependencies) {
	if(this instanceof MacroNode) {
		// Save the details
		this.macroName = macroName;
		this.macro = store.macros[macroName];
		this.children = children;
		this.store = store;
		this.srcParams = typeof srcParams === "string" ? this.parseMacroParamString(srcParams) : srcParams;
		// Evaluate the dependencies
		if(dependencies) {
			this.dependencies = dependencies;
		} else {
			this.dependencies = new Dependencies();
			if(this.srcParams && this.macro) {
				if(this.macro.dependentAll) {
					this.dependencies.dependentAll = true;
				}
				for(var m in this.macro.params) {
					var paramInfo = this.macro.params[m];
					if(m in this.srcParams && paramInfo.type === "tiddler") {
						if(typeof this.srcParams[m] === "function") {
							this.dependencies.dependentAll = true;
						} else {
							this.dependencies.addDependency(this.srcParams[m],!paramInfo.skinny);
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

MacroNode.prototype.parseMacroParamString = function(paramString) {
	/*jslint evil: true */
	var params = {},
		args = new ArgParser(paramString,{defaultName: "anon", cascadeDefaults: this.macro.cascadeDefaults}),
		self = this,
		insertParam = function(name,arg) {
			if(arg.evaluated) {
				params[name] = eval(esprima.generate( // (function(tiddler,store,utils) {return {paramOne: 1};})
					{
						"type": "Program",
						"body": [
							{
								"type": "ExpressionStatement",
								"expression": {
									"type": "FunctionExpression",
									"id": null,
									"params": [
										{
											"type": "Identifier",
											"name": "tiddler"
										},
										{
											"type": "Identifier",
											"name": "store"
										},
										{
											"type": "Identifier",
											"name": "utils"
										}
									],
									"body": {
										"type": "BlockStatement",
										"body": [
											{
												"type": "ReturnStatement",
												"argument": esprima.parse("(" + arg.string + ")").body[0].expression
											}
										]
									}
								}
							}
						]
					}
				));
			} else {
				params[name] = arg.string;
			}
		};
	for(var m in this.macro.params) {
		var param = this.macro.params[m],
			arg;
		if("byPos" in param && args.byPos[param.byPos] && (args.byPos[param.byPos].n === "anon" || args.byPos[param.byPos].n === m)) {
			arg = args.byPos[param.byPos].v;
			insertParam(m,arg);
		} else {
			arg = args.getValueByName(m);
			if(!arg && param.byName === "default") {
				arg = args.getValueByName("anon");
			}
			if(arg) {
				insertParam(m,arg);
			}
		}
	}
	return params;
};

MacroNode.prototype.hasParameter = function(name) {
	return this.params.hasOwnProperty(name);
};

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
	this.content = this.macro.execute.call(this);
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
			self.macro.events[event.type].call(self,event);
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
		if(this.macro.refreshInDom) {
			this.macro.refreshInDom.call(this,changes);
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
	this.domNode = element;
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
	this.domNode = document.createTextNode(this.text);
	domNode.appendChild(this.domNode);
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
	this.domNode = document.createTextNode(utils.entityDecode(this.entity));
	domNode.appendChild(this.domNode);
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
	this.domNode = document.createElement("div");
	this.domNode.innerHTML = this.html;
	domNode.appendChild(this.domNode);	
};

/*
Static method to construct an error message
*/
var ErrorNode = function(text) {
	return new ElementNode("span",{
		"class": ["label","label-important"]
	},[
		new TextNode(text)
	]);
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

Renderer.MacroNode = MacroNode;
Renderer.ElementNode = ElementNode;
Renderer.TextNode = TextNode;
Renderer.EntityNode = EntityNode;
Renderer.ErrorNode = ErrorNode;
Renderer.LabelNode = LabelNode;
Renderer.SplitLabelNode = SplitLabelNode;

exports.Renderer = Renderer;

})();
