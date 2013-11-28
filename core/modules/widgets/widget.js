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
	variables: optional hashmap of context variables (see below)
	parentWidget: optional reference to a parent renderer node for the context chain
	document: optional document object to use instead of global document
Context variables include:
	currentTiddler: title of the tiddler providing the context
*/
var Widget = function(parseTreeNode,options) {
	if(arguments.length > 0) {
		this.initialise(parseTreeNode,options);
	}
};

/*
Initialise widget properties. These steps are pulled out of the constructor so that we can reuse them in subclasses
*/
Widget.prototype.initialise = function(parseTreeNode,options) {
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
		Widget.prototype.widgetClasses = $tw.modules.applyMethods("widget");
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
*/
Widget.prototype.setVariable = function(name,value,params) {
	this.variables[name] = {value: value, params: params};
};

/*
Get the prevailing value of a context variable
name: name of variable
options: see below
Options include
params: array of {name:, value:} for each parameter
defaultValue: default value if the variable is not defined
*/
Widget.prototype.getVariable = function(name,options) {
	options = options || {};
	var actualParams = options.params || [];
	// If the variable doesn't exist then look for a macro module
	if(!(name in this.variables)) {
		return this.evaluateMacroModule(name,actualParams,options.defaultValue);
	}
	var variable = this.variables[name],
		value = variable.value || "";
	// Substitute any parameters specified in the definition
	value = this.substituteVariableParameters(value,variable.params,actualParams);
	value = this.substituteVariableReferences(value);
	return value;
};

Widget.prototype.substituteVariableParameters = function(text,formalParams,actualParams) {
	if(formalParams) {
		var nextAnonParameter = 0, // Next candidate anonymous parameter in macro call
			paramInfo, paramValue;
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
			// Replace any instances of this parameter
			text = text.replace(new RegExp("\\$" + $tw.utils.escapeRegExp(paramInfo.name) + "\\$","mg"),paramValue);
		}
	}
	return text;
};

Widget.prototype.substituteVariableReferences = function(text) {
	var self = this;
	return text.replace(/\$\(([^\)\$]+)\)\$/g,function(match,p1,offset,string) {
		return self.getVariable(p1,{defaultValue: ""});
	});
};

Widget.prototype.evaluateMacroModule = function(name,actualParams,defaultValue) {
	if($tw.utils.hop($tw.macros,name)) {
		var macro = $tw.macros[name],
			args = [];
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
		return macro.run.apply(this,args)
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
	name = name || "transclusion";
	var output = [],
		node = this;
	while(node) {
		if($tw.utils.hop(node.variables,name)) {
			output.push(node.getVariable(name));
		}
		node = node.parentWidget;
	}
	return "{" + $tw.utils.hashString(output.join("")) + "}";
};

/*
Compute the current values of the attributes of the widget. Returns a hashmap of the names of the attributes that have changed
*/
Widget.prototype.computeAttributes = function() {
	var changedAttributes = {},
		self = this,
		value;
	$tw.utils.each(this.parseTreeNode.attributes,function(attribute,name) {
		if(attribute.type === "indirect") {
			value = self.wiki.getTextReference(attribute.textReference,"",self.getVariable("currentTiddler"));
		} else if(attribute.type === "macro") {
			value = self.getVariable(attribute.value.name,{params: attribute.value.params});
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
*/
Widget.prototype.assignAttributes = function(domNode) {
	var self = this;
	$tw.utils.each(this.attributes,function(v,a) {
		if(v !== undefined) {
			// Setting certain attributes can cause a DOM error (eg xmlns on the svg element)
			try {
				domNode.setAttributeNS(null,a,v);
			} catch(e) {
			}
		}
	});
};

/*
Make child widgets correspondng to specified parseTreeNodes
*/
Widget.prototype.makeChildWidgets = function(parseTreeNodes) {
	this.children = [];
	var self = this;
	$tw.utils.each(parseTreeNodes || (this.parseTreeNode && this.parseTreeNode.children),function(childNode) {
		self.children.push(self.makeChildWidget(childNode));
	});
};

/*
Construct the widget object for a parse tree node
*/
Widget.prototype.makeChildWidget = function(parseTreeNode) {
	var WidgetClass = this.widgetClasses[parseTreeNode.type];
	if(!WidgetClass) {
		WidgetClass = this.widgetClasses["text"];
		parseTreeNode = {type: "text", text: "Undefined widget '" + parseTreeNode.type + "'"};
	}
	return new WidgetClass(parseTreeNode,{
		wiki: this.wiki,
		variables: {},
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
	$tw.utils.each(this.children,function(childWidget) {
		childWidget.render(parent,nextSibling);
	});
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
		}

	}
};

/*
Dispatch an event to a widget. If the widget doesn't handle the event then it is also dispatched to the parent widget
*/
Widget.prototype.dispatchEvent = function(event) {
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
	var self = this,
		refreshed = false;
	$tw.utils.each(this.children,function(childWidget) {
		refreshed = childWidget.refresh(changedTiddlers) || refreshed;
	});
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
		return parent.findNextSiblingDomNode(index);
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

exports.widget = Widget;

})();
