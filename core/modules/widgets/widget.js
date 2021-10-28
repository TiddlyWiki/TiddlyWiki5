/*\
title: $:/core/modules/widgets/widget.js
type: application/javascript
module-type: widget

Widget base class

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Create a widget object for a parse tree node
	parseTreeNode: reference to the parse tree node to be rendered
	options: see below
Options include:
	wiki: mandatory reference to wiki associated with this render tree
	parentWidget: optional reference to a parent renderer node for the context chain
	document: optional document object to use instead of global document
*/
var Widget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Initialise widget properties. These steps are pulled out of the constructor so that we can reuse them in subclasses
*/
Widget.prototype.initialise = function(parseTreeNode,options) {
	// Bail if parseTreeNode is undefined, meaning  that the widget constructor was called without any arguments so that it can be subclassed
	if(parseTreeNode === undefined) {
		return;
	}
	options = options || {};
	// Save widget info
	this.parseTreeNode = parseTreeNode;
	this.wiki = options.wiki;
	this.parentWidget = options.parentWidget;
	this.variablesConstructor = function() {};
	this.variablesConstructor.prototype = this.parentWidget ? this.parentWidget.variables : {};
	this.variables = new this.variablesConstructor();
	this.document = options.document;
	this.attributes = {};
	this.children = [];
	this.domNodes = [];
	this.eventListeners = {};
	// Hashmap of the widget classes
	if(!this.widgetClasses) {
		// Get widget classes
		Widget.prototype.widgetClasses = $tw.modules.applyMethods("widget");
		// Process any subclasses
		$tw.modules.forEachModuleOfType("widget-subclass",function(title,module) {
			if(module.baseClass) {
				var baseClass = Widget.prototype.widgetClasses[module.baseClass];
				if(!baseClass) {
					throw "Module '" + title + "' is attemping to extend a non-existent base class '" + module.baseClass + "'";
				}
				var subClass = module.constructor;
				subClass.prototype = new baseClass();
				$tw.utils.extend(subClass.prototype,module.prototype);
				Widget.prototype.widgetClasses[module.name || module.baseClass] = subClass;
			}
		});
	}
};

/*
Render this widget into the DOM
*/
Widget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.execute();
	this.renderChildren(parent,nextSibling);
};

/*
Compute the internal state of the widget
*/
Widget.prototype.execute = function() {
	this.makeChildWidgets();
};

/*
Set the value of a context variable
name: name of the variable
value: value of the variable
params: array of {name:, default:} for each parameter
isMacroDefinition: true if the variable is set via a \define macro pragma (and hence should have variable substitution performed)
*/
Widget.prototype.setVariable = function(name,value,params,isMacroDefinition) {
	this.variables[name] = {value: value, params: params, isMacroDefinition: !!isMacroDefinition};
};

/*
Get the prevailing value of a context variable
name: name of variable
options: see below
Options include
params: array of {name:, value:} for each parameter
defaultValue: default value if the variable is not defined

Returns an object with the following fields:

params: array of {name:,value:} of parameters passed to wikitext variables
text: text of variable, with parameters properly substituted
*/
Widget.prototype.getVariableInfo = function(name,options) {
	options = options || {};
	var actualParams = options.params || [],
		parentWidget = this.parentWidget;
	// Check for the variable defined in the parent widget (or an ancestor in the prototype chain)
	if(parentWidget && name in parentWidget.variables) {
		var variable = parentWidget.variables[name],
			originalValue = variable.value,
			value = originalValue,
			params = this.resolveVariableParameters(variable.params,actualParams);
		// Substitute any parameters specified in the definition
		$tw.utils.each(params,function(param) {
			value = $tw.utils.replaceString(value,new RegExp("\\$" + $tw.utils.escapeRegExp(param.name) + "\\$","mg"),param.value);
		});
		// Only substitute variable references if this variable was defined with the \define pragma
		if(variable.isMacroDefinition) {
			value = this.substituteVariableReferences(value);
		}
		return {
			text: value,
			params: params,
			srcVariable: variable,
			isCacheable: originalValue === value
		};
	}
	// If the variable doesn't exist in the parent widget then look for a macro module
	return {
		text: this.evaluateMacroModule(name,actualParams,options.defaultValue)
	};
};

/*
Simplified version of getVariableInfo() that just returns the text
*/
Widget.prototype.getVariable = function(name,options) {
	return this.getVariableInfo(name,options).text;
};

Widget.prototype.resolveVariableParameters = function(formalParams,actualParams) {
	formalParams = formalParams || [];
	actualParams = actualParams || [];
	var nextAnonParameter = 0, // Next candidate anonymous parameter in macro call
		paramInfo, paramValue,
		results = [];
	// Step through each of the parameters in the macro definition
	for(var p=0; p<formalParams.length; p++) {
		// Check if we've got a macro call parameter with the same name
		paramInfo = formalParams[p];
		paramValue = undefined;
		for(var m=0; m<actualParams.length; m++) {
			if(actualParams[m].name === paramInfo.name) {
				paramValue = actualParams[m].value;
			}
		}
		// If not, use the next available anonymous macro call parameter
		while(nextAnonParameter < actualParams.length && actualParams[nextAnonParameter].name) {
			nextAnonParameter++;
		}
		if(paramValue === undefined && nextAnonParameter < actualParams.length) {
			paramValue = actualParams[nextAnonParameter++].value;
		}
		// If we've still not got a value, use the default, if any
		paramValue = paramValue || paramInfo["default"] || "";
		// Store the parameter name and value
		results.push({name: paramInfo.name, value: paramValue});
	}
	return results;
};

Widget.prototype.substituteVariableReferences = function(text) {
	var self = this;
	return (text || "").replace(/\$\(([^\)\$]+)\)\$/g,function(match,p1,offset,string) {
		return self.getVariable(p1,{defaultValue: ""});
	});
};

Widget.prototype.evaluateMacroModule = function(name,actualParams,defaultValue) {
	if($tw.utils.hop($tw.macros,name)) {
		var macro = $tw.macros[name],
			args = [];
		if(macro.params.length > 0) {
			var nextAnonParameter = 0, // Next candidate anonymous parameter in macro call
				paramInfo, paramValue;
			// Step through each of the parameters in the macro definition
			for(var p=0; p<macro.params.length; p++) {
				// Check if we've got a macro call parameter with the same name
				paramInfo = macro.params[p];
				paramValue = undefined;
				for(var m=0; m<actualParams.length; m++) {
					if(actualParams[m].name === paramInfo.name) {
						paramValue = actualParams[m].value;
					}
				}
				// If not, use the next available anonymous macro call parameter
				while(nextAnonParameter < actualParams.length && actualParams[nextAnonParameter].name) {
					nextAnonParameter++;
				}
				if(paramValue === undefined && nextAnonParameter < actualParams.length) {
					paramValue = actualParams[nextAnonParameter++].value;
				}
				// If we've still not got a value, use the default, if any
				paramValue = paramValue || paramInfo["default"] || "";
				// Save the parameter
				args.push(paramValue);
			}
		}
		else for(var i=0; i<actualParams.length; ++i) {
			args.push(actualParams[i].value);
		}
		return (macro.run.apply(this,args) || "").toString();
	} else {
		return defaultValue;
	}
};

/*
Check whether a given context variable value exists in the parent chain
*/
Widget.prototype.hasVariable = function(name,value) {
	var node = this;
	while(node) {
		if($tw.utils.hop(node.variables,name) && node.variables[name].value === value) {
			return true;
		}
		node = node.parentWidget;
	}
	return false;
};

/*
Construct a qualifying string based on a hash of concatenating the values of a given variable in the parent chain
*/
Widget.prototype.getStateQualifier = function(name) {
	this.qualifiers = this.qualifiers || Object.create(null);
	name = name || "transclusion";
	if(this.qualifiers[name]) {
		return this.qualifiers[name];
	} else {
		var output = [],
			node = this;
		while(node && node.parentWidget) {
			if($tw.utils.hop(node.parentWidget.variables,name)) {
				output.push(node.getVariable(name));
			}
			node = node.parentWidget;
		}
		var value = $tw.utils.hashString(output.join(""));
		this.qualifiers[name] = value;
		return value;
	}
};

/*
Compute the current values of the attributes of the widget. Returns a hashmap of the names of the attributes that have changed
*/
Widget.prototype.computeAttributes = function() {
	var changedAttributes = {},
		self = this;
	$tw.utils.each(this.parseTreeNode.attributes,function(attribute,name) {
		var value = self.computeAttribute(attribute);
		if(self.attributes[name] !== value) {
			self.attributes[name] = value;
			changedAttributes[name] = true;
		}
	});
	return changedAttributes;
};

Widget.prototype.computeAttribute = function(attribute) {
	var value;
	if(attribute.type === "filtered") {
		value = this.wiki.filterTiddlers(attribute.filter,this)[0] || "";
	} else if(attribute.type === "indirect") {
		value = this.wiki.getTextReference(attribute.textReference,"",this.getVariable("currentTiddler"));
	} else if(attribute.type === "macro") {
		value = this.getVariable(attribute.value.name,{params: attribute.value.params});
	} else { // String attribute
		value = attribute.value;
	}
	return value;
};

/*
Check for the presence of an attribute
*/
Widget.prototype.hasAttribute = function(name) {
	return $tw.utils.hop(this.attributes,name);
};

/*
Get the value of an attribute
*/
Widget.prototype.getAttribute = function(name,defaultText) {
	if($tw.utils.hop(this.attributes,name)) {
		return this.attributes[name];
	} else {
		return defaultText;
	}
};

/*
Assign the computed attributes of the widget to a domNode
options include:
excludeEventAttributes: ignores attributes whose name begins with "on"
*/
Widget.prototype.assignAttributes = function(domNode,options) {
	options = options || {};
	var self = this;
	$tw.utils.each(this.attributes,function(v,a) {
		// Check exclusions
		if(options.excludeEventAttributes && a.substr(0,2) === "on") {
			v = undefined;
		}
		if(v !== undefined) {
			var b = a.split(":");
			// Setting certain attributes can cause a DOM error (eg xmlns on the svg element)
			try {
				if (b.length == 2 && b[0] == "xlink"){
					domNode.setAttributeNS("http://www.w3.org/1999/xlink",b[1],v);
				} else {
					domNode.setAttributeNS(null,a,v);
				}
			} catch(e) {
			}
		}
	});
};

/*
Make child widgets correspondng to specified parseTreeNodes
*/
Widget.prototype.makeChildWidgets = function(parseTreeNodes,options) {
	options = options || {};
	this.children = [];
	var self = this;
	// Create set variable widgets for each variable
	$tw.utils.each(options.variables,function(value,name) {
		var setVariableWidget = {
			type: "set",
			attributes: {
				name: {type: "string", value: name},
				value: {type: "string", value: value}
			},
			children: parseTreeNodes
		};
		parseTreeNodes = [setVariableWidget];
	});
	$tw.utils.each(parseTreeNodes || (this.parseTreeNode && this.parseTreeNode.children),function(childNode) {
		self.children.push(self.makeChildWidget(childNode));
	});
};

/*
Construct the widget object for a parse tree node
options include:
	variables: optional hashmap of variables to wrap around the widget
*/
Widget.prototype.makeChildWidget = function(parseTreeNode,options) {
	options = options || {};
	var WidgetClass = this.widgetClasses[parseTreeNode.type];
	if(!WidgetClass) {
		WidgetClass = this.widgetClasses.text;
		parseTreeNode = {type: "text", text: "Undefined widget '" + parseTreeNode.type + "'"};
	}
	// Create set variable widgets for each variable
	$tw.utils.each(options.variables,function(value,name) {
		var setVariableWidget = {
			type: "set",
			attributes: {
				name: {type: "string", value: name},
				value: {type: "string", value: value}
			},
			children: [
				parseTreeNode
			]
		};
		parseTreeNode = setVariableWidget;
	});
	return new WidgetClass(parseTreeNode,{
		wiki: this.wiki,
		parentWidget: this,
		document: this.document
	});
};

/*
Get the next sibling of this widget
*/
Widget.prototype.nextSibling = function() {
	if(this.parentWidget) {
		var index = this.parentWidget.children.indexOf(this);
		if(index !== -1 && index < this.parentWidget.children.length-1) {
			return this.parentWidget.children[index+1];
		}
	}
	return null;
};

/*
Get the previous sibling of this widget
*/
Widget.prototype.previousSibling = function() {
	if(this.parentWidget) {
		var index = this.parentWidget.children.indexOf(this);
		if(index !== -1 && index > 0) {
			return this.parentWidget.children[index-1];
		}
	}
	return null;
};

/*
Render the children of this widget into the DOM
*/
Widget.prototype.renderChildren = function(parent,nextSibling) {
	var children = this.children;
	for(var i = 0; i < children.length; i++) {
		children[i].render(parent,nextSibling);
	};
};

/*
Add a list of event listeners from an array [{type:,handler:},...]
*/
Widget.prototype.addEventListeners = function(listeners) {
	var self = this;
	$tw.utils.each(listeners,function(listenerInfo) {
		self.addEventListener(listenerInfo.type,listenerInfo.handler);
	});
};

/*
Add an event listener
*/
Widget.prototype.addEventListener = function(type,handler) {
	var self = this;
	if(typeof handler === "string") { // The handler is a method name on this widget
		this.eventListeners[type] = function(event) {
			return self[handler].call(self,event);
		};
	} else { // The handler is a function
		this.eventListeners[type] = function(event) {
			return handler.call(self,event);
		};
	}
};

/*
Dispatch an event to a widget. If the widget doesn't handle the event then it is also dispatched to the parent widget
*/
Widget.prototype.dispatchEvent = function(event) {
	event.widget = event.widget || this;
	// Dispatch the event if this widget handles it
	var listener = this.eventListeners[event.type];
	if(listener) {
		// Don't propagate the event if the listener returned false
		if(!listener(event)) {
			return false;
		}
	}
	// Dispatch the event to the parent widget
	if(this.parentWidget) {
		return this.parentWidget.dispatchEvent(event);
	}
	return true;
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
Widget.prototype.refresh = function(changedTiddlers) {
	return this.refreshChildren(changedTiddlers);
};

/*
Rebuild a previously rendered widget
*/
Widget.prototype.refreshSelf = function() {
	var nextSibling = this.findNextSiblingDomNode();
	this.removeChildDomNodes();
	this.render(this.parentDomNode,nextSibling);
};

/*
Refresh all the children of a widget
*/
Widget.prototype.refreshChildren = function(changedTiddlers) {
	var children = this.children,
		refreshed = false;
	for (var i = 0; i < children.length; i++) {
		refreshed = children[i].refresh(changedTiddlers) || refreshed;
	}
	return refreshed;
};

/*
Find the next sibling in the DOM to this widget. This is done by scanning the widget tree through all next siblings and their descendents that share the same parent DOM node
*/
Widget.prototype.findNextSiblingDomNode = function(startIndex) {
	// Refer to this widget by its index within its parents children
	var parent = this.parentWidget,
		index = startIndex !== undefined ? startIndex : parent.children.indexOf(this);
if(index === -1) {
	throw "node not found in parents children";
}
	// Look for a DOM node in the later siblings
	while(++index < parent.children.length) {
		var domNode = parent.children[index].findFirstDomNode();
		if(domNode) {
			return domNode;
		}
	}
	// Go back and look for later siblings of our parent if it has the same parent dom node
	var grandParent = parent.parentWidget;
	if(grandParent && parent.parentDomNode === this.parentDomNode) {
		index = grandParent.children.indexOf(parent);
		if(index !== -1) {
			return parent.findNextSiblingDomNode(index);
		}
	}
	return null;
};

/*
Find the first DOM node generated by a widget or its children
*/
Widget.prototype.findFirstDomNode = function() {
	// Return the first dom node of this widget, if we've got one
	if(this.domNodes.length > 0) {
		return this.domNodes[0];
	}
	// Otherwise, recursively call our children
	for(var t=0; t<this.children.length; t++) {
		var domNode = this.children[t].findFirstDomNode();
		if(domNode) {
			return domNode;
		}
	}
	return null;
};

/*
Remove any DOM nodes created by this widget or its children
*/
Widget.prototype.removeChildDomNodes = function() {
	// If this widget has directly created DOM nodes, delete them and exit. This assumes that any child widgets are contained within the created DOM nodes, which would normally be the case
	if(this.domNodes.length > 0) {
		$tw.utils.each(this.domNodes,function(domNode) {
			domNode.parentNode.removeChild(domNode);
		});
		this.domNodes = [];
	} else {
		// Otherwise, ask the child widgets to delete their DOM nodes
		$tw.utils.each(this.children,function(childWidget) {
			childWidget.removeChildDomNodes();
		});
	}
};

/*
Invoke the action widgets that are descendents of the current widget.
*/
Widget.prototype.invokeActions = function(triggeringWidget,event) {
	var handled = false;
	// For each child widget
	for(var t=0; t<this.children.length; t++) {
		var child = this.children[t],
			childIsActionWidget = !!child.invokeAction,
			actionRefreshPolicy = child.getVariable("tv-action-refresh-policy"); // Default is "once"
		// Refresh the child if required
		if(childIsActionWidget || actionRefreshPolicy === "always") {
			child.refreshSelf();
		}
		// Invoke the child if it is an action widget
		if(childIsActionWidget) {
			if(child.invokeAction(triggeringWidget,event)) {
				handled = true;
			}
		}
		// Propagate through through the child if it permits it
		if(child.allowActionPropagation() && child.invokeActions(triggeringWidget,event)) {
			handled = true;
		}
	}
	return handled;
};

/*
Invoke the action widgets defined in a string
*/
Widget.prototype.invokeActionString = function(actions,triggeringWidget,event,variables) {
	actions = actions || "";
	var parser = this.wiki.parseText("text/vnd.tiddlywiki",actions,{
			parentWidget: this,
			document: this.document
		}),
		widgetNode = this.wiki.makeWidget(parser,{
			parentWidget: this,
			document: this.document,
			variables: variables
		});
	var container = this.document.createElement("div");
	widgetNode.render(container,null);
	return widgetNode.invokeActions(this,event);
};

/*
Execute action tiddlers by tag
*/
Widget.prototype.invokeActionsByTag = function(tag,event,variables) {
	var self = this;
	$tw.utils.each(self.wiki.filterTiddlers("[all[shadows+tiddlers]tag[" + tag + "]!has[draft.of]]"),function(title) {
		self.invokeActionString(self.wiki.getTiddlerText(title),self,event,variables);
	});
};

Widget.prototype.allowActionPropagation = function() {
	return true;
};

exports.widget = Widget;

})();
