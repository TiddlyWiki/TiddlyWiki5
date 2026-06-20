/*\
title: $:/core/modules/widgets/scroll-stable.js
type: application/javascript
module-type: widget

Scroll-stable container widget.

Behaves like an ordinary element widget: it creates a DOM node, renders its children into it (so
children can be freely added and removed — exactly how the story river behaves), and accepts
`class`, `role`, `style.*`, and any other HTML attribute, which are applied to the DOM node.

Additionally it takes a `target-selector` attribute: a CSS selector, resolved WITHIN this widget's
DOM node, for the elements to keep stable (e.g. the tiddler frames). Whenever the container is
RESIZED — hiding/showing the sidebar changes the story river's width AND height — the element at
the top of the viewport is kept fixed: of the targets, the one nearest the top is chosen, and
within it the deepest descendant straddling the reference line (the actual block you are reading)
is anchored, so a width-reflow above it cannot move that block. Adding/removing children
(navigation) re-baselines instead of fighting it.

Attributes
  target-selector  selector (within this node) for the elements to keep stable,
                   e.g. ":scope > .tc-tiddler-frame"
  tag              element to create (default "div")
  class, role, style.*, <any other>  applied to the DOM node

Cleanup (observers + listener) is performed in destroy()/removeChildDomNodes().
\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var ScrollStableWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

ScrollStableWidget.prototype = new Widget();

ScrollStableWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	var domNode = this.document.createElement(this.scrollTag);
	this.domNode = domNode;
	this.assignContainerAttributes(domNode);
	parent.insertBefore(domNode,nextSibling);
	this.renderChildren(domNode,null);   // children added before observers attach → no spurious mutation
	this.domNodes.push(domNode);
	this.setupStability();
};

ScrollStableWidget.prototype.execute = function() {
	this.scrollTag = this.getAttribute("tag","div");
	if(!(/^[a-zA-Z][a-zA-Z0-9-]*$/).test(this.scrollTag)) { this.scrollTag = "div"; }
	this.targetSelector = this.getAttribute("target-selector","");
	this.makeChildWidgets();
};

// Apply every attribute EXCEPT our control attributes (tag, target-selector) to the DOM node.
// Reuses the base assignAttributes, which already handles class / role / style.* / custom
// properties / arbitrary attributes.
ScrollStableWidget.prototype.assignContainerAttributes = function(domNode) {
	var passthrough = Object.create(null);
	$tw.utils.each(this.attributes,function(value,name) {
		if(name !== "tag" && name !== "target-selector") { passthrough[name] = value; }
	});
	this.assignAttributes(domNode,{changedAttributes: passthrough});
};

ScrollStableWidget.prototype.refresh = function(changedTiddlers) {
	var changed = this.computeAttributes();
	if(changed.tag) {
		// Tag name change → rebuild from scratch (rare).
		this.refreshSelf();
		return true;
	}
	var self = this, passthrough = Object.create(null), anyPassthrough = false;
	$tw.utils.each(changed,function(value,name) {
		if(name === "tag") { return; }
		if(name === "target-selector") {
			self.targetSelector = self.getAttribute("target-selector","");
			self.anchor = null;   // re-baseline against the new selector
			return;
		}
		passthrough[name] = value;
		anyPassthrough = true;
	});
	if(anyPassthrough) { this.assignAttributes(this.domNode,{changedAttributes: passthrough}); }
	return this.refreshChildren(changedTiddlers);
};

// ── scroll stability ────────────────────────────────────────────────────────

ScrollStableWidget.prototype.setupStability = function() {
	this._cleaned = false;
	var win = this.document.defaultView;
	// Needs a live browser window with observers and a target selector; otherwise it's just a
	// plain container (e.g. when rendered server-side).
	if(!win || !win.ResizeObserver || !win.MutationObserver || !this.targetSelector) { return; }
	var self = this;
	this.stableWin = win;
	this.anchor = null;          // {el, edge: "top"|"bottom", pos}
	this.recordTimer = null;
	this.lastChildMutation = 0;
	this.lastW = undefined;
	this.lastH = undefined;

	// User scrolled → re-baseline (debounced; never synchronously, so a reflow's own scroll jump
	// can't be mistaken for the reading position). Capture-phase so an inner scroller's
	// non-bubbling scroll events are still seen.
	this.onScrollHandler = function() { self.scheduleRecord(); };
	win.addEventListener("scroll",this.onScrollHandler,{capture: true, passive: true});

	// Container resized (sidebar toggle changes width AND height) → restore the anchor.
	this.resizeObserver = new win.ResizeObserver(function() { self.onResize(); });
	this.resizeObserver.observe(this.domNode);

	// Direct children added/removed (navigation) → re-baseline rather than fight it.
	this.mutationObserver = new win.MutationObserver(function() {
		self.lastChildMutation = (win.performance && win.performance.now) ? win.performance.now() : Date.now();
		self.recordAnchor();
	});
	this.mutationObserver.observe(this.domNode,{childList: true});

	// Initial baseline once the children have laid out.
	if(win.requestAnimationFrame) { win.requestAnimationFrame(function() { self.recordAnchor(); }); }
	else { this.recordAnchor(); }
};

ScrollStableWidget.prototype.now = function() {
	var win = this.stableWin;
	return (win && win.performance && win.performance.now) ? win.performance.now() : Date.now();
};

ScrollStableWidget.prototype.onResize = function() {
	var node = this.domNode;
	if(!node || !node.isConnected) { return; }
	var rect = node.getBoundingClientRect(), w = rect.width, h = rect.height;
	if(this.lastW === undefined) { this.lastW = w; this.lastH = h; return; }   // initial observation
	var changed = Math.abs(w - this.lastW) > 0.01 || Math.abs(h - this.lastH) > 0.01;
	if(this.lastW === w) { return; }
	this.lastW = w; this.lastH = h;
	if(!changed) { return; }
	// A resize that coincides with a child add/remove is navigation — re-baseline, don't fight.
	if(this.now() - this.lastChildMutation < 120) { this.recordAnchor(); return; }
	this.restoreAnchor();
};

// Resolve the scroll container: prefer the document (the common case), else the nearest
// scrollable ancestor of our node.
ScrollStableWidget.prototype.getScroller = function() {
	var doc = this.document, win = this.stableWin;
	var se = doc.scrollingElement || doc.documentElement;
	if(se && se.scrollHeight > se.clientHeight + 1) { return {el: se, isDoc: true}; }
	var el = this.domNode.parentElement;
	while(el && el !== doc.body && el !== doc.documentElement) {
		if(el.scrollHeight > el.clientHeight + 1) {
			var oy = win.getComputedStyle(el).overflowY;
			if(oy === "auto" || oy === "scroll" || oy === "overlay") { return {el: el, isDoc: false}; }
		}
		el = el.parentElement;
	}
	return {el: se, isDoc: true};
};

// Top of the visible area, used only to PICK the anchor target: the top viewport edge (0) for the
// document, or the inner scroller's own top.
ScrollStableWidget.prototype.refLine = function(scroller) {
	return scroller.isDoc ? 0 : scroller.el.getBoundingClientRect().top;
};

// Pick the target nearest the reference line, then anchor the deepest descendant straddling that
// line (the element actually at the viewport top) and remember its RAW viewport edge position —
// the value restoreAnchor holds fixed. Anchoring a descendant (not the whole frame) keeps the gap
// between line and anchor ~0, so a width-reflow above it doesn't move what you're reading.
ScrollStableWidget.prototype.recordAnchor = function() {
	this.recordTimer = null;
	var node = this.domNode;
	if(!node || !node.isConnected || !this.targetSelector) { this.anchor = null; return; }
	var scroller = this.getScroller(), line = this.refLine(scroller);
	var targets;
	try { targets = node.querySelectorAll(this.targetSelector); } catch(e) { this.anchor = null; return; }
	
	var chosen = null;
	var minDistance = Infinity;

	// Determine the height of the scroller for the bounding box test
	var scrollerHeight = scroller.isDoc ? this.stableWin.innerHeight : scroller.el.getBoundingClientRect().height;

	for(var i = 0; i < targets.length; i++) {
		var rect = targets[i].getBoundingClientRect();

		// 1. PRIORITISATION: Does the element currently fill the viewport/scroller completely?
		// The element starts above/on the reference line and ends below/on the visible end.
		if(rect.top <= line && rect.bottom >= (line + scrollerHeight)) {
			chosen = targets[i];
			break; // Immediate termination, as this element dominates the viewport
		}

		// 2. FALLBACK: Calculate the absolute distance from the top edge to the reference line
		var distance = Math.abs(rect.top - line);
		if(distance < minDistance) {
			minDistance = distance;
			chosen = targets[i];
		}
	}

	if(!chosen) { this.anchor = null; return; }
	var crect = chosen.getBoundingClientRect();
	// When the reference line falls WITHIN the chosen frame, anchor the DEEPEST descendant whose
	// box straddles the line — the actual block (paragraph/heading/list-item) you are reading.
	// Its top sits at/just above the line, so the gap between line and anchored edge is ~0; a
	// width-reflow of everything above it is therefore fully absorbed and drift → ~0. (A single
	// FRAME edge can be up to half a frame from the line when you're mid-tiddler, leaving that
	// distance × reflow as residual jump; a descendant cannot.)
	if(crect.top <= line && crect.bottom >= line) {
		var deep = this.deepestAtLine(chosen, line);
		if(deep) {
			this.anchor = {el: deep, edge: "top", pos: deep.getBoundingClientRect().top};
			return;
		}
	}
	// The line is outside the frame (it sits wholly above or below the viewport top): pin
	// whichever frame edge is nearest the line — i.e. the smallest gap, hence the least drift.
	// |top| > bottom means the top has scrolled off-screen and the bottom is the visible edge.
	var topRel = crect.top - line, bottomRel = crect.bottom - line;
	if(Math.abs(topRel) > bottomRel) {
		this.anchor = {el: chosen, edge: "bottom", pos: crect.bottom};
	} else {
		this.anchor = {el: chosen, edge: "top", pos: crect.top};
	}
};

// Descend from `root` into the chain of descendants whose border box vertically contains the
// reference line, returning the deepest one (the specific element rendered at the viewport top).
// position:fixed/sticky elements are skipped — their position is decoupled from the reading flow,
// so they are useless as a stable anchor (a sticky tiddler title stays put as you scroll). If no
// child straddles the line (it lands in a margin/gap between blocks), the current element — whose
// box does span the line — is returned. Iterative, so deep DOM trees can't blow the stack.
ScrollStableWidget.prototype.deepestAtLine = function(root, line) {
	var win = this.stableWin, current = root, descended = true;
	while(descended) {
		descended = false;
		var children = current.children;
		for(var i = 0; i < children.length; i++) {
			var child = children[i];
			var pos = win.getComputedStyle(child).position;
			if(pos === "fixed" || pos === "sticky") { continue; }
			var r = child.getBoundingClientRect();
			if(r.height > 0 && r.top <= line && r.bottom >= line) {
				current = child; descended = true; break;   // descend into the straddling child
			}
		}
	}
	return current;
};

// Scroll so the anchor target's pinned edge (top or bottom, whichever recordAnchor chose) is
// at exactly the raw viewport position it had. scrollTop arithmetic (not scrollBy) keeps the
// fractional offset; a second pass absorbs any rounding.
ScrollStableWidget.prototype.restoreAnchor = function() {
	var a = this.anchor;
	if(!a || !a.el || !a.el.isConnected) { this.recordAnchor(); return; }
	var scroller = this.getScroller();
	for(var pass = 0; pass < 2; pass++) {
		var rect = a.el.getBoundingClientRect();
		var cur = (a.edge === "bottom") ? rect.bottom : rect.top;
		var dy = cur - a.pos;
		if(Math.abs(dy) <= 0.01) { break; }
		scroller.el.scrollTop = scroller.el.scrollTop + dy;
	}
};

ScrollStableWidget.prototype.scheduleRecord = function() {
	var self = this, win = this.stableWin;
	if(!win) { return; }
	if(this.recordTimer) { win.clearTimeout(this.recordTimer); }
	this.recordTimer = win.setTimeout(function() { self.recordAnchor(); },150);
};

// Idempotent teardown of observers and listeners.
ScrollStableWidget.prototype._cleanupStability = function() {
	if(this._cleaned) { return; }
	this._cleaned = true;
	try { if(this.resizeObserver) { this.resizeObserver.disconnect(); } } catch(e) {}
	try { if(this.mutationObserver) { this.mutationObserver.disconnect(); } } catch(e) {}
	if(this.stableWin) {
		if(this.onScrollHandler) {
			try { this.stableWin.removeEventListener("scroll",this.onScrollHandler,{capture: true}); } catch(e) {}
		}
		if(this.recordTimer) { try { this.stableWin.clearTimeout(this.recordTimer); } catch(e) {} }
	}
	this.resizeObserver = null;
	this.mutationObserver = null;
	this.onScrollHandler = null;
	this.recordTimer = null;
	this.anchor = null;
};

ScrollStableWidget.prototype.removeChildDomNodes = function() {
	this._cleanupStability();
	Widget.prototype.removeChildDomNodes.call(this);
};

ScrollStableWidget.prototype.destroy = function(options) {
	this._cleanupStability();
	Widget.prototype.destroy.call(this,options);
};

exports["scroll-stable"] = ScrollStableWidget;
