/*\
title: $:/core/modules/widgets/paragraph.js
type: application/javascript
module-type: widget

Paragraph widget

The parser cannot tell whether a run of widgets will produce block content, because a
transclusion or a macro call resolves nothing until it renders. So instead of deciding at
parse time it emits this widget, which renders its children into a paragraph and unwraps
them again if what came out turned out to be block. A browser closes an open <p> before a
<div>, so keeping the paragraph there would build a DOM that differs from the markup.

The paragraph is created first and removed afterwards, rather than the children being
rendered somewhere else and moved in, so that the common case costs no extra element and
leaves the DOM in the order it was already built.

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var ParagraphWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
ParagraphWidget.prototype = new Widget();

ParagraphWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	var domNode = this.document.createElement("p");
	parent.insertBefore(domNode,nextSibling);
	this.renderChildren(domNode,null);
	if(containsBlockElement(domNode.childNodes) || !hasContent(domNode.childNodes)) {
		this.unwrap(parent,domNode);
	} else {
		this.decorate(domNode);
		this.domNodes.push(domNode);
		this.wrappedInParagraph = true;
	}
};

/*
A styleblock decorates whatever parseBlock returned, so @@.myClass around a <div> arrives
here as a class on the paragraph and has to travel to whatever replaces it. Merged rather
than assigned, because a node lifted out of the paragraph keeps its own class and style
*/
ParagraphWidget.prototype.decorate = function(domNode) {
	var className = this.getAttribute("class"),
		style = this.getAttribute("style");
	if(className) {
		// Idempotent, because a lifted node is decorated again whenever its own widget
		// re-assigns its attributes and drops ours
		var present = ($tw.utils.trim(domNode.getAttribute("class") || "")).split(/\s+/),
			adding = [];
		$tw.utils.each(className.split(/\s+/),function(name) {
			if(name && !present.includes(name)) {
				adding.push(name);
			}
		});
		if(adding.length) {
			domNode.setAttribute("class",present.concat(adding).join(" ").replace(/^\s+/,""));
		}
	}
	if(style) {
		// A later declaration wins in CSS, so the node's own style is appended after ours
		var existingStyle = domNode.getAttribute("style") || "";
		if(!existingStyle.includes(style)) {
			domNode.setAttribute("style",existingStyle ? style + ";" + existingStyle : style);
		}
	}
};

/*
A run can mix inline content with a block element, as a typed transclusion does when it
renders text either side of a <pre>. Dropping the paragraph outright would leave that text
bare, so the run is split the way a browser splits it instead
*/
ParagraphWidget.prototype.unwrap = function(parent,domNode) {
	var self = this,
		currentParagraph = null;
	// A stretch holding nothing but whitespace is not worth a paragraph of its own. This
	// runs for every stretch, not only the last one, or the gaps between block elements
	// would each acquire an empty paragraph
	var flush = function() {
		if(currentParagraph && !hasContent(currentParagraph.childNodes)) {
			// Lift the content out before discarding the wrapper, or the stretch is
			// deleted along with it
			while(currentParagraph.firstChild) {
				var lifted = currentParagraph.firstChild;
				currentParagraph.removeChild(lifted);
				parent.insertBefore(lifted,currentParagraph);
				self.domNodes.push(lifted);
			}
			parent.removeChild(currentParagraph);
			self.domNodes.splice(self.domNodes.indexOf(currentParagraph),1);
		}
		currentParagraph = null;
	};
	while(domNode.firstChild) {
		var node = domNode.firstChild;
		domNode.removeChild(node);
		if(isBlockNode(node)) {
			flush();
			parent.insertBefore(node,domNode);
			self.decorate(node);
			self.domNodes.push(node);
		} else {
			if(!currentParagraph) {
				currentParagraph = self.document.createElement("p");
				parent.insertBefore(currentParagraph,domNode);
				self.decorate(currentParagraph);
				self.domNodes.push(currentParagraph);
			}
			currentParagraph.appendChild(node);
		}
	}
	flush();
	parent.removeChild(domNode);
	// Every descendant that rendered straight into the paragraph cached it as its parent
	// node, and pass throughs such as $vars put that node arbitrarily deep. Leaving those
	// stale makes a later refreshSelf render into the discarded paragraph, which is how
	// the sidebar search dropdown stopped opening: no error, just invisible output
	reparent(this,domNode,parent);
	this.wrappedInParagraph = false;
};

/*
Repoint every widget in the subtree that rendered into oldNode at wherever its own nodes
actually ended up
*/
function reparent(widget,oldNode,fallback) {
	$tw.utils.each(widget.children,function(child) {
		if(child.parentDomNode === oldNode) {
			var ownNode = child.domNodes && child.domNodes[0];
			child.parentDomNode = (ownNode && ownNode.parentNode) || fallback;
		}
		reparent(child,oldNode,fallback);
	});
}

/*
The DOM nodes the children currently hold, in tree order. A widget that owns none of its
own, such as $vars, contributes whatever its own children hold
*/
function collectDomNodes(widget) {
	var nodes = [];
	$tw.utils.each(widget.children,function(child) {
		if(child.domNodes && child.domNodes.length) {
			nodes.push.apply(nodes,child.domNodes);
		} else {
			nodes.push.apply(nodes,collectDomNodes(child));
		}
	});
	return nodes;
}

/*
Whether a paragraph earns its place. Metadata such as <style> draws nothing wherever it
sits, so it does not count. Everything else does, even when it looks empty, because an
attribute alone can give an element a box: <span style="width:1em;background:LightPink">
holds no text and is a visible colour swatch
*/
function hasContent(nodes) {
	for(var t=0; t<nodes.length; t++) {
		var node = nodes[t];
		if(node.nodeType === 1 && !$tw.config.htmlMetadataElements.includes((node.tagName || "").toLowerCase())) {
			return true;
		}
		if(node.nodeType === 3 && /\S/.test(node.textContent || "")) {
			return true;
		}
	}
	return false;
}

/*
Whether this node must sit outside a paragraph, either because its own start tag closes
one or because it holds an element that would
*/
function isBlockNode(node) {
	var tag = (node.tagName || "").toLowerCase();
	if(tag && $tw.config.htmlParagraphClosingElements.includes(tag)) {
		return true;
	}
	return !!(node.childNodes && node.childNodes.length && containsBlockElement(node.childNodes));
}

ParagraphWidget.prototype.execute = function() {
	this.makeChildWidgets();
};

/*
A child can change from inline to block between refreshes, for example a $list whose
filter starts matching a tiddler that opens with a heading, so the decision has to be
retaken. Re-rendering is the only way to move the nodes into or out of the paragraph
*/
ParagraphWidget.prototype.refresh = function(changedTiddlers) {
	if(this.refreshChildren(changedTiddlers)) {
		// Ask the children what they hold now: the cached list goes stale as soon as one
		// of them re-renders
		var nodes = this.wrappedInParagraph ? this.domNodes[0].childNodes : collectDomNodes(this),
			shouldWrap = !containsBlockElement(nodes) && hasContent(nodes);
		if(shouldWrap !== this.wrappedInParagraph) {
			this.refreshSelf();
		} else if(!this.wrappedInParagraph) {
			// A node lifted out of the paragraph belongs to the child that rendered it, and
			// that child replaces its own class and style wholesale when its attributes
			// change, taking the styleblock's with them. So put ours back
			var self = this;
			$tw.utils.each(nodes,function(node) {
				if(node.nodeType === 1 && node.parentNode === self.parentDomNode) {
					self.decorate(node);
				}
			});
		}
		return true;
	}
	return false;
};

/*
Whether any of these nodes, at any depth, is an element whose start tag would close an
open paragraph. Depth matters because a browser closes the paragraph before a <div> even
when it is written inside inline markup, as in <p><strong><div>
*/
function containsBlockElement(nodes) {
	for(var t=0; t<nodes.length; t++) {
		var node = nodes[t],
			tag = (node.tagName || "").toLowerCase();
		if(tag && $tw.config.htmlParagraphClosingElements.includes(tag)) {
			return true;
		}
		if(node.childNodes && node.childNodes.length && containsBlockElement(node.childNodes)) {
			return true;
		}
	}
	return false;
}

exports.paragraph = ParagraphWidget;
