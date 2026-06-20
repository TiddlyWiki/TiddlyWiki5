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
RESIZED — hiding/showing the sidebar changes the story river's width AND height — the target nearest
the TOP of the viewport is kept fixed: the first target still visible at/below the reference line is
chosen (if several are visible, the one nearest the top viewport edge wins), and its top edge is
held at the same viewport position. When that target's own top has scrolled off above the line (it
fills the top of the viewport), the deepest descendant — and the exact text line — at the reference
line is pinned instead, so the element's own width-reflow can't drift the part you are reading.
Adding/removing children (navigation) re-baselines instead of fighting it.

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
	this.anchor = null;          // {el, edge:"top", pos} | {node, offset, pos} (text line)
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

// Keep stable the TOP of the target nearest the top of the viewport.
//
// PREFERRED — pin a target's own top: the topmost target whose top edge is VISIBLE (at or below the
// reference line, and above the viewport bottom). That is the tiddler the reader scrolled to; in
// document order (= visual top→bottom) the first such target is the one nearest the top viewport
// edge. Holding its top fixed means a width-reflow of everything above it (the whole story river
// rewrapping) cannot move it — so a tiddler you scrolled into view stays put. This is preferred over
// the text anchor below: when a frame boundary is on screen, the boundary is the thing to keep.
//
// FALLBACK — pin the text line: when NO target top is visible the reference line is INSIDE a target
// whose top has scrolled off above the viewport (a tall tiddler filling the top). Descend to the
// deepest node at the line and, when it is a text node, pin the exact CHARACTER on the wrapped line
// straddling the line — a character keeps its identity through a reflow (a wrapped line is not an
// element, but a character is), so the reading position itself stays put. (Falls back to the deepest
// element's / the tiddler's own top for a non-text block.) The pinned value is a RAW viewport
// position; restoreAnchor holds it fixed.
ScrollStableWidget.prototype.recordAnchor = function() {
	this.recordTimer = null;
	var node = this.domNode;
	if(!node || !node.isConnected || !this.targetSelector) { this.anchor = null; return; }
	var win = this.stableWin, doc = this.document;
	var scroller = this.getScroller(), line = this.refLine(scroller);
	var vpBottom = line + (scroller.isDoc ? (doc.documentElement.clientHeight || win.innerHeight) : scroller.el.clientHeight);
	var targets;
	try { targets = node.querySelectorAll(this.targetSelector); } catch(e) { this.anchor = null; return; }

	// Walk targets top→bottom. PREFER the first whose top edge is visible at/below the reference line
	// (pin that top). While scanning past the targets above the line, remember the one that STRADDLES
	// it (top above, box still spanning the line) for the fallback if no visible top turns up.
	var straddling = null;
	for(var i = 0; i < targets.length; i++) {
		var r = targets[i].getBoundingClientRect();
		if(r.height <= 0) { continue; }
		if(r.top >= line - 0.5) {                  // top is at/below the reference line
			if(r.top < vpBottom) {                 // …and within the viewport → pin this tiddler's top
				this.anchor = {el: targets[i], edge: "top", pos: r.top};
				return;
			}
			break;                                 // first top already below the viewport → none qualifies
		}
		if(r.bottom > line) { straddling = targets[i]; }   // top above the line but box still spans it
	}

	// FALLBACK: the line is inside `straddling` (top scrolled off above). Pin the exact text character
	// at the line; Node.TEXT_NODE === 3.
	if(!straddling) { this.anchor = null; return; }
	var deep = this.deepestAtLine(straddling, line);
	if(deep && deep.nodeType === 3) {
		var off = this.textOffsetAtLine(deep, line);
		if(off !== null) {
			var trect = this.rangeRectAt(deep, off);
			if(trect) { this.anchor = {node: deep, offset: off, edge: "top", pos: trect.top}; return; }
		}
	} else if(deep) {
		this.anchor = {el: deep, edge: "top", pos: deep.getBoundingClientRect().top};
		return;
	}
	this.anchor = {el: straddling, edge: "top", pos: straddling.getBoundingClientRect().top};
};

// Descend from `root` through the chain of child NODES — elements AND text nodes — whose box
// vertically contains the reference line, returning the deepest such node. The result is a TEXT
// NODE whenever the line falls on rendered text (the strongest anchor: a character keeps its
// identity through a width-reflow), otherwise the deepest element whose box spans the line (the
// line landed in a gap/margin, or on an image/empty block). position:fixed/sticky elements are
// skipped — their position is decoupled from the reading flow, so they're useless as an anchor (a
// sticky tiddler title stays put as you scroll). Iterative, so deep DOM trees can't blow the stack.
ScrollStableWidget.prototype.deepestAtLine = function(root, line) {
	var win = this.stableWin, current = root, descended = true;
	while(descended) {
		descended = false;
		var kids = current.childNodes;
		for(var i = 0; i < kids.length; i++) {
			var child = kids[i];
			if(child.nodeType === 3) {                       // text node — measure with a Range
				if(this.textNodeSpansLine(child, line)) { return child; }
				continue;
			}
			if(child.nodeType !== 1) { continue; }           // skip comments / processing nodes
			var pos = win.getComputedStyle(child).position;
			if(pos === "fixed" || pos === "sticky") { continue; }
			var r = child.getBoundingClientRect();
			if(r.height > 0 && r.top <= line && r.bottom >= line) {
				current = child; descended = true; break;   // descend into the straddling element
			}
		}
	}
	return current;
};

// True when any wrapped line of the text node's rendered content vertically contains the reference
// line. selectNodeContents + getClientRects yields one rect per line box, so an inline text node
// that spans several lines is handled correctly.
ScrollStableWidget.prototype.textNodeSpansLine = function(node, line) {
	if(!node.length) { return false; }
	try {
		var range = this.document.createRange();
		range.selectNodeContents(node);
		var rects = range.getClientRects();
		for(var i = 0; i < rects.length; i++) {
			var r = rects[i];
			if(r.height > 0 && r.top <= line && r.bottom >= line) { return true; }
		}
	} catch(e) {}
	return false;
};

// Client rect of the character at (node, offset) — i.e. the top of the wrapped text line that
// character sits on. A ONE-character range is measured because a collapsed range often reports no
// client rects; the end of the node is clamped to its last character. Returns null on any failure.
ScrollStableWidget.prototype.rangeRectAt = function(node, offset) {
	try {
		var range = this.document.createRange(), len = node.length || 0;
		if(len === 0) { range.selectNode(node); }
		else if(offset < len) { range.setStart(node, offset); range.setEnd(node, offset + 1); }
		else { range.setStart(node, len - 1); range.setEnd(node, len); }
		var rects = range.getClientRects();
		return (rects && rects.length) ? rects[0] : null;
	} catch(e) { return null; }
};

// The character offset in `node` whose wrapped line straddles the reference line: the smallest
// offset whose character box BOTTOM is below the line (i.e. the first character on the line that
// contains the line, or the first character below it when the line lands in a gap). Character boxes
// advance monotonically DOWN the node, so a binary search over offsets is valid and O(log n) even
// for a huge paragraph. This is a purely GEOMETRIC mapping — no hit-testing — so it resolves to the
// same character every time and stays pixel-stable across a width-reflow. Returns null for an empty
// node; clamps to the last character when the line is below all of the node's text.
ScrollStableWidget.prototype.textOffsetAtLine = function(node, line) {
	var len = node.length || 0;
	if(len === 0) { return null; }
	var lo = 0, hi = len - 1, ans = -1;
	while(lo <= hi) {
		var mid = (lo + hi) >> 1;
		var rect = this.rangeRectAt(node, mid);
		if(!rect) { lo = mid + 1; continue; }              // unmeasurable (collapsed whitespace) → skip
		if(rect.bottom > line + 0.5) { ans = mid; hi = mid - 1; }   // at/below the straddling line
		else { lo = mid + 1; }                                       // still above the line
	}
	return (ans >= 0) ? ans : (len - 1);
};

// Scroll so the anchor target's pinned TOP (or the pinned text line) is at exactly the raw viewport
// position it had. scrollTop arithmetic (not scrollBy) keeps the fractional offset; a second pass
// absorbs any rounding.
ScrollStableWidget.prototype.restoreAnchor = function() {
	var a = this.anchor;
	if(!a) { return; }
	var scroller = this.getScroller();
	// Range anchor (a text offset): re-measure the SAME character's line top and hold it fixed.
	if(a.node) {
		if(!a.node.isConnected) { this.recordAnchor(); return; }
		for(var p = 0; p < 2; p++) {
			var rrect = this.rangeRectAt(a.node, a.offset);
			if(!rrect) { this.recordAnchor(); return; }   // text gone/replaced → re-baseline
			var rdy = rrect.top - a.pos;
			if(Math.abs(rdy) <= 0.01) { break; }
			scroller.el.scrollTop = scroller.el.scrollTop + rdy;
		}
		return;
	}
	// Element anchor: hold the pinned edge (top|bottom).
	if(!a.el || !a.el.isConnected) { this.recordAnchor(); return; }
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
