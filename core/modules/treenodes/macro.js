/*\
title: $:/core/modules/treenodes/macro.js
type: application/javascript
module-type: treenode

Macro node, used as the base class for macros

\*/
(function(){

/*jshint node: true, browser: true */
/*global $tw: false */
"use strict";

var Node = require("./node.js").Node;

/*
Construct a renderer node representing a macro invocation
	macroName: name of the macro
	options: see below

The options available are:

	srcParams: a string or a hashmap of parameters (each can be a string, or a fn(tiddler,wiki) for evaluated parameters)
	content: optional array of child nodes
	wiki: reference to the WikiStore associated with this macro
	dependencies: optional Dependencies object representing the dependencies of this macro
	isBlock: true if this macro is being used as an HTML block

Note that the dependencies will be evaluated if not provided.
*/
var Macro = function(macroName,options) {
	options = options || {};
	var MacroClass = options.wiki ? options.wiki.macros[macroName] : null; // Get the macro class
	if(this instanceof Macro) {
		// Save the details
		this.macroName = macroName;
		this.srcParams = options.srcParams || {};
		this.content = options.content || [];
		this.wiki = options.wiki;
		this.dependencies = options.dependencies;
		this.isBlock = options.isBlock;
		// Parse the macro parameters if required
		if(typeof this.srcParams === "string") {
			this.srcParams = this.parseMacroParamString(this.srcParams);
		}
		// Evaluate the dependencies if required
		if(macroName && !this.dependencies) {
			this.dependencies = this.evaluateDependencies();
		}
		// Get a reference to the static information about this macro
		if(MacroClass) {
			this.MacroClass = MacroClass;
			this.info = MacroClass.prototype.info;
		}
	} else {
		// If Macro() has been called without 'new' then instantiate the right macro class
		if(!MacroClass) {
			throw "Unknown macro '" + macroName + "'";
		}
		return new MacroClass(macroName,options);
	}
};

Macro.prototype = new Node();
Macro.prototype.constructor = Macro;

/*
Evaluate the dependencies of this macro invocation. If the macro provides an `evaluateDependencies` method
then it is invoked to evaluate the dependencies. Otherwise it generates the dependencies based on the
macro parameters provided
*/
Macro.prototype.evaluateDependencies = function() {
	// Figure out the dependencies from the metadata and parameters
	var dependencies = new $tw.Dependencies();
	if(this.info.dependentAll) {
		dependencies.dependentAll = true;
	}
	if(this.info.dependentOnContextTiddler) {
		dependencies.dependentOnContextTiddler = true;
	}
	for(var m in this.info.params) {
		var paramInfo = this.info.params[m];
		if(m in this.srcParams && paramInfo.type === "tiddler") {
			if(typeof this.srcParams[m] === "function") {
				dependencies.dependentAll = true;
			} else {
				dependencies.addDependency(this.srcParams[m],!paramInfo.skinny);
			}
		}
	}
	return dependencies;
};

Macro.prototype.parseMacroParamString = function(paramString) {
	/*jslint evil: true */
	var params = {},
		args = new $tw.utils.ArgParser(paramString,{defaultName: "anon", cascadeDefaults: this.info.cascadeDefaults}),
		self = this,
		insertParam = function(name,arg) {
			if(arg.evaluated) {
				params[name] = eval("(function(tiddler,wiki) {return " + arg.string + ";})");
			} else {
				params[name] = arg.string;
			}
		};
	for(var m in this.info.params) {
		var param = this.info.params[m],
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

Macro.prototype.hasParameter = function(name) {
	return $tw.utils.hop(this.params,name);
};

Macro.prototype.cloneContent = function() {
	var contentClones = [];
	for(var t=0; t<this.content.length; t++) {
		contentClones.push(this.content[t].clone());
	}
	return contentClones;
};

Macro.prototype.clone = function() {
	return new this.MacroClass(this.macroName,{
		srcParams: this.srcParams,
		content: this.cloneContent(),
		wiki: this.wiki,
		isBlock: this.isBlock,
		dependencies: this.dependencies
	});
};

Macro.prototype.execute = function(parents,tiddlerTitle) {
	parents = parents || [];
	// Evaluate macro parameters to get their values
	this.params = {};
	var tiddler = this.wiki.getTiddler(tiddlerTitle);
	if(!tiddler) {
		tiddler = {title: tiddlerTitle};
	}
	for(var p in this.srcParams) {
		if(typeof this.srcParams[p] === "function") {
			this.params[p] = this.srcParams[p](tiddler.fields,this.wiki);
		} else {
			this.params[p] = this.srcParams[p];
		}
	}
	// Save the context info for use when we're refreshing it
	this.tiddlerTitle = tiddlerTitle;
	this.parents = parents;
	// Execute the macro to generate its children, and recursively execute them
	this.children = this.executeMacro.call(this);
};

Macro.prototype.render = function(type) {
	var output = [];
	for(var t=0; t<this.children.length; t++) {
		output.push(this.children[t].render(type));
	}
	return output.join("");
};

Macro.prototype.renderInDom = function(parentDomNode,insertBefore) {
	// Create the wrapper node for the macro
	var domNode = document.createElement(this.isBlock ? "div" : "span");
	this.domNode = domNode;
	if(insertBefore) {
		parentDomNode.insertBefore(domNode,insertBefore);	
	} else {
		parentDomNode.appendChild(domNode);
	}
	// Add some debugging information to it
	domNode.setAttribute("data-tw-macro",this.macroName);
	// Ask the macro to add event handlers to the node
	this.addEventHandlers();
	// Render the content of the macro
	for(var t=0; t<this.children.length; t++) {
		this.children[t].renderInDom(domNode);
	}
	this.postRenderInDom();
};

Macro.prototype.addEventHandlers = function() {
	if(this.info.events) {
		for(var t=0; t<this.info.events.length; t++) {
			// Register this macro node to handle the event via the handleEvent() method
			this.domNode.addEventListener(this.info.events[t],this,false);
		}
	}
};

Macro.prototype.broadcastEvent = function(event) {
	if(!this.handleEvent(event)) {
		return false;
	}
	for(var t=0; t<this.children.length; t++) {
		if(!this.children[t].broadcastEvent(event)) {
			return false;
		}
	}
	return true;
};

Macro.prototype.postRenderInDom = function() {
	// Do nothing, individual macros can override
};

Macro.prototype.refresh = function(changes) {
	var t,
		self = this;
	// Check if any of the dependencies of this macro node have changed
	if(this.dependencies.hasChanged(changes,this.tiddlerTitle)) {
		// Re-execute the macro if so
		this.execute(this.parents,this.tiddlerTitle);
	} else {
		// Refresh any children
		for(t=0; t<this.children.length; t++) {
			this.children[t].refresh(changes);
		}
	}
};

Macro.prototype.refreshInDom = function(changes) {
	var t,
		self = this;
	// Check if any of the dependencies of this macro node have changed
	if(this.dependencies.hasChanged(changes,this.tiddlerTitle)) {
		// Manually reexecute and rerender this macro
		while(this.domNode.hasChildNodes()) {
			this.domNode.removeChild(this.domNode.firstChild);
		}
		this.execute(this.parents,this.tiddlerTitle);
		for(t=0; t<this.children.length; t++) {
			this.children[t].renderInDom(this.domNode);
		}
	} else {
		// Refresh any children
		for(t=0; t<this.children.length; t++) {
			this.children[t].refreshInDom(changes);
		}
	}
};

exports.Macro = Macro;

})();
