/*\
title: $:/core/modules/widgets/story-wrapper.js
type: application/javascript
module-type: widget

Story-wrapper container widget.

Renders its children into a container element, then exposes that element through the
`th-story-wrapper-dom` hook (domNode, widget) so plugins can attach behaviour to the story river
without altering its markup. A handler may register a behaviour object, a plain object with optional
refresh(changedTiddlers) and destroy() methods whose lifecycle this widget drives. Every registered
handler runs and each wrapper instance keeps its own behaviour list, so plugins attach independently.

Attributes: tag (element, default div); name (reflected onto the element as data-story-wrapper-name);
class, role, style.* and any other HTML attribute are passed through to the element.
\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var StoryWrapperWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

StoryWrapperWidget.prototype = new Widget();

StoryWrapperWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	var domNode = this.document.createElementNS(this.namespace,this.wrapperTag);
	this.domNode = domNode;
	this.assignWrapperAttributes(domNode,this.attributes);
	this.assignWrapperName(domNode);
	parent.insertBefore(domNode,nextSibling);
	this.renderChildren(domNode,null);   // children exist before behaviours attach, so an observer sees no spurious initial mutation
	this.domNodes.push(domNode);
	this.behaviours = [];
	$tw.hooks.invokeHook("th-story-wrapper-dom",domNode,this);
};

StoryWrapperWidget.prototype.execute = function() {
	var tag = this.getAttribute("tag","div");
	// Match element.js: a hostile tag like "script" must not become a live element.
	if($tw.config.htmlUnsafeElements.indexOf(tag) !== -1) { tag = "safe-" + tag; }
	tag = tag.replace(/[^0-9a-zA-Z\-]/mg,"");
	this.wrapperTag = tag || "div";
	// Mirror element.js namespace selection; set before makeChildWidgets so descendants inherit it.
	var XHTML_NAMESPACE = "http://www.w3.org/1999/xhtml",
		tagNamespaces = {
			svg: "http://www.w3.org/2000/svg",
			math: "http://www.w3.org/1998/Math/MathML",
			body: XHTML_NAMESPACE
		};
	this.namespace = tagNamespaces[this.wrapperTag];
	if(this.namespace) {
		this.setVariable("namespace",this.namespace);
	} else if(this.hasAttribute("xmlns")) {
		this.namespace = this.getAttribute("xmlns");
		this.setVariable("namespace",this.namespace);
	} else {
		this.namespace = this.getVariable("namespace",{defaultValue: XHTML_NAMESPACE});
	}
	this.makeChildWidgets();
};

StoryWrapperWidget.prototype.registerBehaviour = function(behaviour) {
	if(behaviour) { (this.behaviours || (this.behaviours = [])).push(behaviour); }
};

// tag selects the element and name is reflected by assignWrapperName, so neither is a passthrough attribute.
StoryWrapperWidget.prototype.assignWrapperAttributes = function(domNode,source) {
	var passthrough = Object.create(null), any = false;
	$tw.utils.each(source,function(value,key) {
		if(key !== "tag" && key !== "name") { passthrough[key] = value; any = true; }
	});
	if(any) { this.assignAttributes(domNode,{changedAttributes: passthrough}); }
};

// name is not a valid attribute on an arbitrary element, so expose it as data-story-wrapper-name for plugins to target.
StoryWrapperWidget.prototype.assignWrapperName = function(domNode) {
	var name = this.getAttribute("name");
	if(name) { domNode.setAttribute("data-story-wrapper-name",name); }
	else { domNode.removeAttribute("data-story-wrapper-name"); }
};

StoryWrapperWidget.prototype.refresh = function(changedTiddlers) {
	var changed = this.computeAttributes();
	if(changed.tag) {
		// A tag change means a different element, so rebuild from scratch.
		this.refreshSelf();
		return true;
	}
	this.assignWrapperAttributes(this.domNode,changed);
	if(changed.name) { this.assignWrapperName(this.domNode); }
	var behaviours = this.behaviours || [];
	for(var i = 0; i < behaviours.length; i++) {
		if(typeof behaviours[i].refresh === "function") { behaviours[i].refresh(changedTiddlers); }
	}
	return this.refreshChildren(changedTiddlers);
};

// The base destroy() calls onDestroy() exactly once, so behaviours are torn down here.
StoryWrapperWidget.prototype.onDestroy = function() {
	var behaviours = this.behaviours || [];
	for(var i = 0; i < behaviours.length; i++) {
		if(typeof behaviours[i].destroy === "function") {
			try { behaviours[i].destroy(); } catch(e) {}
		}
	}
	this.behaviours = [];
};

exports["story-wrapper"] = StoryWrapperWidget;
