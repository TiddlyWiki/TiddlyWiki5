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
	classes: array of classes to be assigned to the macro

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
		this.classes = options.classes;
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
		dependencies: this.dependencies,
		classes: this.classes
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
	// Execute the macro to generate its node and children, and recursively execute them
	this.child = this.executeMacro.call(this);
};

Macro.prototype.render = function(type) {
	return this.child ? this.child.render(type) : "";
};

Macro.prototype.renderInDom = function(parentDomNode,insertBefore) {
	if(this.child) {
		this.child.renderInDom(parentDomNode,insertBefore);
		this.addEventHandlers();
		this.postRenderInDom();
	}
};

Macro.prototype.addEventHandlers = function() {
	if(this.info.events && this.child) {
		for(var t=0; t<this.info.events.length; t++) {
			// Register this macro node to handle the event via the handleEvent() method
			this.child.domNode.addEventListener(this.info.events[t],this,false);
		}
	}
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
		// Refresh the child node
		if(this.child) {
			this.child.refresh(changes);
		}
	}
};

Macro.prototype.refreshInDom = function(changes) {
	var t,
		self = this;
	// Check if any of the dependencies of this macro node have changed
	if(this.dependencies.hasChanged(changes,this.tiddlerTitle)) {
		// Manually reexecute and rerender this macro
		var parent = this.child.domNode.parentNode,
			nextSibling = this.child.domNode.nextSibling;
		parent.removeChild(this.child.domNode);
		this.execute(this.parents,this.tiddlerTitle);
		this.child.renderInDom(parent,nextSibling);
		this.addEventHandlers();
	} else {
		if(this.child) {
			this.child.refreshInDom(changes);
		}
	}
};

Macro.prototype.addClass = function(className) {
	this.classes = this.classes || [];
	$tw.utils.pushTop(this.classes,className.split(" "));
};

exports.Macro = Macro;

})();
