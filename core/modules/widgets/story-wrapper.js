/*\
title: $:/core/modules/widgets/story-wrapper.js
type: application/javascript
module-type: widget

Story-wrapper container widget.

A generic container: it creates a DOM node, renders its children into it (so children can be freely
added and removed — exactly how the story river behaves), and passes `class`, `role`, `style.*` and
any other HTML attribute through to that node. It does nothing scroll- or story-specific itself.

Its purpose is to be an EXTENSION POINT. Once its DOM node exists and the children are laid in, it
invokes the `th-story-wrapper-dom` hook, passing (domNode, widget). A plugin's handler can tweak the
node directly (one-shot, exactly like element.js's `th-dom-rendering-element`) and/or register a
long-lived BEHAVIOUR via `widget.registerBehaviour(behaviour)`. A behaviour is a plain object with
optional `refresh(changedTiddlers)` and `destroy()` methods; the widget drives their lifecycle.

Composition is inherent: TiddlyWiki runs EVERY handler registered for a hook, so any number of
plugins can attach to the same wrapper and all keep working. And because the widget passes itself to
the hook, EACH INSTANCE of the wrapper gets its own independent list of behaviours — a second
story-wrapper elsewhere is handled the same way without interfering with the first.

Attributes
  tag                            element to create (default "div")
  class, role, style.*, <any>    passed through to the DOM node
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
	var domNode = this.document.createElement(this.wrapperTag);
	this.domNode = domNode;
	this.assignWrapperAttributes(domNode,this.attributes);
	parent.insertBefore(domNode,nextSibling);
	this.renderChildren(domNode,null);   // children present before behaviours attach → no spurious mutation
	this.domNodes.push(domNode);
	// Extension point: plugins may tweak the node and/or register behaviours bound to it.
	this.behaviours = [];
	$tw.hooks.invokeHook("th-story-wrapper-dom",domNode,this);
};

StoryWrapperWidget.prototype.execute = function() {
	var tag = this.getAttribute("tag","div");
	// Neuter blacklisted elements and restrict to safe characters, exactly as element.js does.
	if($tw.config.htmlUnsafeElements.indexOf(tag) !== -1) { tag = "safe-" + tag; }
	tag = tag.replace(/[^0-9a-zA-Z\-]/mg,"");
	this.wrapperTag = tag || "div";
	this.makeChildWidgets();
};

// Register a behaviour object whose lifecycle this widget will drive. `behaviour` may implement
// refresh(changedTiddlers) and destroy(); both are optional.
StoryWrapperWidget.prototype.registerBehaviour = function(behaviour) {
	if(behaviour) { (this.behaviours || (this.behaviours = [])).push(behaviour); }
};

// Apply every attribute in `source` EXCEPT `tag` to the DOM node, reusing the base assignAttributes
// (which handles class / role / style.* / custom properties / arbitrary attributes).
StoryWrapperWidget.prototype.assignWrapperAttributes = function(domNode,source) {
	var passthrough = Object.create(null), any = false;
	$tw.utils.each(source,function(value,name) {
		if(name !== "tag") { passthrough[name] = value; any = true; }
	});
	if(any) { this.assignAttributes(domNode,{changedAttributes: passthrough}); }
};

StoryWrapperWidget.prototype.refresh = function(changedTiddlers) {
	var changed = this.computeAttributes();
	if(changed.tag) {
		// Tag name change → rebuild from scratch (rare).
		this.refreshSelf();
		return true;
	}
	this.assignWrapperAttributes(this.domNode,changed);
	// Let each behaviour react to this refresh cycle (e.g. re-baseline on a relevant tiddler change).
	var behaviours = this.behaviours || [];
	for(var i = 0; i < behaviours.length; i++) {
		if(typeof behaviours[i].refresh === "function") { behaviours[i].refresh(changedTiddlers); }
	}
	return this.refreshChildren(changedTiddlers);
};

// The base destroy() calls onDestroy() exactly once (covering both destroy and the legacy
// removeChildDomNodes path), so behaviours are torn down here.
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
