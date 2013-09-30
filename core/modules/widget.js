/*\
title: $:/core/modules/widget.js
type: application/javascript
module-type: new_widget

Widget base class.

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
	tiddlerTitle: title of the tiddler providing the context
	templateTitle: title of the tiddler providing the current template
	macroDefinitions: hashmap of macro definitions
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
	this.variables = options.variables || {};
	this.parentWidget = options.parentWidget;
	this.document = options.document;
	this.attributes = {};
	this.children = [];
	this.domNodes = [];
	// Hashmap of the widget classes
	if(!this.widgetClasses) {
		Widget.prototype.widgetClasses = $tw.modules.applyMethods("new_widget");
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
Get the prevailing value of a context variable
name: name of variable
params: array of {name:, value:} for each parameter
*/
Widget.prototype.getVariable = function(name,params) {
	// Search up the widget tree for the variable name
	var node = this;
	while(node && !$tw.utils.hop(node.variables,name)) {
		node = node.parentWidget;
	}
	if(!node) {
		return undefined;
	}
	// Get the value
	var value = node.variables[name].value;
	// Substitute any parameters specified in the definition
	var defParams = node.variables[name].params;
	if(defParams) {
		var nextAnonParameter = 0; // Next candidate anonymous parameter in macro call
		// Step through each of the parameters in the macro definition
		for(var p=0; p<defParams.length; p++) {
			// Check if we've got a macro call parameter with the same name
			var paramInfo = defParams[p],
				paramValue = undefined;
			for(var m=0; m<params.length; m++) {
				if(params[m].name === paramInfo.name) {
					paramValue = params[m].value;
				}
			}
			// If not, use the next available anonymous macro call parameter
			if(paramValue === undefined && nextAnonParameter < params.length) {
				while(params[nextAnonParameter].name && nextAnonParameter < params.length-1) {
					nextAnonParameter++;
				}
				if(!params[nextAnonParameter].name) {
					paramValue = params[nextAnonParameter].value;
					nextAnonParameter++;
				}
			}
			// If we've still not got a value, use the default, if any
			paramValue = paramValue || paramInfo["default"] || "";
			// Replace any instances of this parameter
			value = value.replace(new RegExp("\\$" + $tw.utils.escapeRegExp(paramInfo.name) + "\\$","mg"),paramValue);
		}
	}
	return value;
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
Compute the current values of the attributes of the widget. Returns a hashmap of the names of the attributes that have changed
*/
Widget.prototype.computeAttributes = function() {
	var changedAttributes = {},
		self = this,
		value;
	$tw.utils.each(this.parseTreeNode.attributes,function(attribute,name) {
		if(attribute.type === "indirect") {
			value = self.wiki.getTextReference(attribute.textReference,"",self.getVariable("tiddlerTitle"));
		} else if(attribute.type === "macro") {
			value = self.getVariable(attribute.value.name,attribute.value.params);
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
	$tw.utils.each(parseTreeNodes || this.parseTreeNode.children,function(childNode) {
		self.children.push(self.makeChildWidget(childNode));
	});
};

/*
Construct the widget object for a parse tree node
*/
Widget.prototype.makeChildWidget = function(parseTreeNode) {
	var WidgetClass = this.widgetClasses[parseTreeNode.type];
	return new WidgetClass(parseTreeNode,{
		wiki: this.wiki,
		variables: {},
		parentWidget: this,
		document: this.document
	});
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
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
Widget.prototype.refresh = function(changedTiddlers) {
	return this.refreshChildren(changedTiddlers);
};

/*
Rebuild a previously rendered widget
*/
Widget.prototype.refreshSelf = function() {
	var nextSibling = this.findNextSibling();
	this.removeChildDomNodes();
	this.execute();
	this.renderChildren(this.parentDomNode,nextSibling);
}

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
Find the next sibling in the DOM to this widget.
*/
Widget.prototype.findNextSibling = function() {
	// Go back up to the first parent with a different parentDomNode. This is the widget that owns the parentDomNode
	var parent = this.parentWidget,
		index = parent.children.indexOf(this);
	while(parent && parent.parentWidget && parent.parentDomNode === this.parentDomNode) {
		index = parent.parentWidget.children.indexOf(parent);
		parent = parent.parentWidget;
	}
	// Find the first DOM node generated by later siblings (or their descendents)
	while(++index < parent.children.length) {
		var domNode = parent.children[index].findFirstDomNode();
		if(domNode) {
			return domNode;
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
	$tw.utils.each(this.children,function(childWidget) {
		childWidget.removeChildDomNodes();
	});
};

exports.widget = Widget;

var TextNodeWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
TextNodeWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
TextNodeWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.execute();
	var textNode = this.document.createTextNode(this.parseTreeNode.text);
	parent.insertBefore(textNode,nextSibling);
	this.domNodes.push(textNode);
};

/*
Compute the internal state of the widget
*/
TextNodeWidget.prototype.execute = function() {
	// Nothing to do for a text node
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
TextNodeWidget.prototype.refresh = function(changedTiddlers) {
	return false;
};

/*
Remove any DOM nodes created by this widget
*/
TextNodeWidget.prototype.removeChildDomNodes = function() {
	$tw.utils.each(this.domNodes,function(domNode) {
		domNode.parentNode.removeChild(domNode);
	});
};

exports.text = TextNodeWidget;

var ViewWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
ViewWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
ViewWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.execute();
	var textNode = this.document.createTextNode(this.text);
	parent.insertBefore(textNode,nextSibling);
	this.domNodes.push(textNode);
};

/*
Compute the internal state of the widget
*/
ViewWidget.prototype.execute = function() {
	// Get parameters from our attributes
	this.viewTitle = this.getAttribute("title",this.getVariable("tiddlerTitle"));
	this.viewField = this.getAttribute("field","text");
	this.viewIndex = this.getAttribute("index");
	this.viewFormat = this.getAttribute("format","text");
	// Get the value to display
	var tiddler = this.wiki.getTiddler(this.viewTitle);
	if(tiddler) {
		if(this.viewField === "text") {
			// Calling getTiddlerText() triggers lazy loading of skinny tiddlers
			this.text = this.wiki.getTiddlerText(this.viewTitle);
		} else {
			this.text = tiddler.fields[this.viewField];
		}
	} else { // Use a special value if the tiddler is missing
		switch(this.viewField) {
			case "title":
				this.text = this.getVariable("tiddlerTitle");
				break;
			case "modified":
			case "created":
				this.text = new Date();
				break;
			default:
				this.text = "";
				break;
		}
	}
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
ViewWidget.prototype.refresh = function(changedTiddlers) {
	return false;
};

/*
Remove any DOM nodes created by this widget
*/
ViewWidget.prototype.removeChildDomNodes = function() {
	$tw.utils.each(this.domNodes,function(domNode) {
		domNode.parentNode.removeChild(domNode);
	});
};

exports.view = ViewWidget;

var ElementWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
ElementWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
ElementWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	var domNode = this.document.createElement(this.parseTreeNode.tag);
	this.assignAttributes(domNode);
	parent.insertBefore(domNode,nextSibling);
	this.renderChildren(domNode,null);
	this.domNodes.push(domNode);
};

/*
Compute the internal state of the widget
*/
ElementWidget.prototype.execute = function() {
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
ElementWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes(),
		hasChangedAttributes = $tw.utils.count(changedAttributes) > 0;
	if(hasChangedAttributes) {
		// Update our attributes
		this.assignAttributes(this.domNodes[0]);
	}
	var hasRefreshed = this.refreshChildren(changedTiddlers);
	return hasRefreshed || hasChangedAttributes;
};

/*
Remove any DOM nodes created by this widget or its children
*/
ElementWidget.prototype.removeChildDomNodes = function() {
	$tw.utils.each(this.domNodes,function(domNode) {
		domNode.parentNode.removeChild(domNode);
	});
};

exports.element = ElementWidget;

var TranscludeWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
TranscludeWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
TranscludeWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent,nextSibling);
};

/*
Compute the internal state of the widget
*/
TranscludeWidget.prototype.execute = function() {
	// Get our parameters
	this.transcludeTitle = this.getAttribute("title",this.getVariable("tiddlerTitle"));
	this.transcludeField = this.getAttribute("field");
	this.transcludeIndex = this.getAttribute("index");
	// Check for recursion
	var recursionMarker = "{" + this.transcludeTitle + "|" + this.transcludeField + "|" + this.transcludeIndex + "}";
	if(this.parentWidget && this.parentWidget.hasVariable("transclusion",recursionMarker)) {
		this.makeChildWidgets([{type: "text", text: "Tiddler recursion error in transclude widget"}]);
		return;
	}
	// Set context variables for recursion detection
	this.setVariable("transclusion",recursionMarker);
	// Parse the text reference
	var parser = this.wiki.new_parseTextReference(
						this.transcludeTitle,
						this.transcludeField,
						this.transcludeIndex,
						{parseAsInline: true}),
		parseTreeNodes = parser ? parser.tree : [];
	// Construct the child widgets
	this.makeChildWidgets(parseTreeNodes);
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
TranscludeWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.title || changedAttributes.field || changedAttributes.index || changedTiddlers[this.transcludeTitle]) {
		this.refreshSelf();
		return true;
	} else {
		return this.refreshChildren(changedTiddlers);		
	}
};

exports.transclude = TranscludeWidget;

var SetVariableWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
SetVariableWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
SetVariableWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent,nextSibling);
};

/*
Compute the internal state of the widget
*/
SetVariableWidget.prototype.execute = function() {
	// Get our parameters
	this.setName = this.getAttribute("name","tiddlerTitle");
	this.setValue = this.getAttribute("value");
	// Set context variable
	this.setVariable(this.setName,this.setValue);
	// Construct the child widgets
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
SetVariableWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.name || changedAttributes.value) {
		this.refreshSelf();
		return true;
	} else {
		return this.refreshChildren(changedTiddlers);		
	}
};

exports.setvariable = SetVariableWidget;

/*
The list widget creates list element sub-widgets that reach back into the list widget for their configuration
*/

var ListWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
ListWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
ListWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent,nextSibling);
};

/*
Compute the internal state of the widget
*/
ListWidget.prototype.execute = function() {
	// Get our attributes
	this.preserveCurrentTiddler = this.getAttribute("preserveCurrentTiddler","no") === "yes";
	// Compose the list elements
	var list = this.getTiddlerList(),
		members = [],
		self = this;
	$tw.utils.each(list,function(title,index) {
		members.push({type: "listitem", itemTitle: title, children: self.parseTreeNode.children})
	});
	// Construct the child widgets
	this.makeChildWidgets(members);
};

ListWidget.prototype.getTiddlerList = function() {
	var defaultFilter = "[!is[system]sort[title]]";
	return this.wiki.filterTiddlers(this.getAttribute("filter",defaultFilter),this.getVariable("tiddlerTitle"));
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
ListWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.name || changedAttributes.value) {
		this.refreshSelf();
		return true;
	} else {
		return this.refreshChildren(changedTiddlers);		
	}
};

exports.list = ListWidget;

var ListItemWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
ListItemWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
ListItemWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent,nextSibling);
};

/*
Compute the internal state of the widget
*/
ListItemWidget.prototype.execute = function() {
	// Set the current list item title
	this.setVariable("listItem",this.parseTreeNode.itemTitle);
	// Construct the child widgets
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
ListItemWidget.prototype.refresh = function(changedTiddlers) {
	return this.refreshChildren(changedTiddlers);
};

exports.listitem = ListItemWidget;

})();
