/*\
title: $:/plugins/tiddlywiki/scroll-stable/stability.js
type: application/javascript
module-type: library

Scroll-stability controller.

A plain behaviour object (NOT a widget): it attaches to a story-wrapper's DOM node and keeps the
scroll position stable across RESIZES of that node — hiding/showing the sidebar changes the story
river's width AND height. The target nearest the TOP of the viewport is kept fixed: the first target
still visible at/below the reference line is chosen (if several are visible, the one nearest the top
viewport edge wins), and its top edge is held at the same viewport position. When that target's own
top has scrolled off above the line (it fills the top of the viewport), the deepest descendant — and
the exact text line — at the reference line is pinned instead, so the element's own width-reflow
can't drift the part you are reading. Adding/removing children (navigation) re-baselines instead of
fighting it.

The elements to keep stable are chosen by a CSS selector (resolved WITHIN the node), read from the
configuration tiddler below; it defaults to the story river's tiddler frames.

Construct with (domNode, widget). Lifecycle is driven by the story-wrapper widget via the behaviour
contract: refresh(changedTiddlers) and destroy().
\*/

"use strict";

var CONFIG_TARGET_SELECTOR = "$:/config/plugins/tiddlywiki/scroll-stable/target-selector",
	DEFAULT_TARGET_SELECTOR = ":scope > .tc-tiddler-frame";

var ScrollStability = function(domNode,widget) {
	this.domNode = domNode;
	this.widget = widget;
	this.document = domNode.ownerDocument;
	this.targetSelector = this.readSelector();
	this.setupStability();
};

ScrollStability.prototype.readSelector = function() {
	return $tw.wiki.getTiddlerText(CONFIG_TARGET_SELECTOR,DEFAULT_TARGET_SELECTOR);
};

// Behaviour contract: react to a refresh cycle. Only the target-selector configuration is relevant
// here — when it changes, rebuild the observers against the new selector and re-baseline.
ScrollStability.prototype.refresh = function(changedTiddlers) {
	if(!changedTiddlers || !changedTiddlers[CONFIG_TARGET_SELECTOR]) { return; }
	var sel = this.readSelector();
	if(sel === this.targetSelector) { return; }
	this._cleanupStability();
	this.targetSelector = sel;
	this.setupStability();
};

// Behaviour contract: teardown.
ScrollStability.prototype.destroy = function() {
	this._cleanupStability();
};

// ── scroll stability ────────────────────────────────────────────────────────

ScrollStability.prototype.setupStability = function() {
	this._cleaned = false;
	var win = this.document.defaultView;
	// Needs a live browser window with observers and a target selector; otherwise it's a no-op (e.g.
	// when the container is rendered server-side).
	if(!win || !win.ResizeObserver || !win.MutationObserver || !this.targetSelector) { return; }
	var self = this;
	this.stableWin = win;
	this.anchor = null;          // {el, edge:"top"|"bottom", pos} | {node, offset, pos} (text line)
	this.recordTimer = null;
	this.suppressRecordUntil = 0;   // ignore scroll echoes from our own restore until this time
	this.managedScroller = null;    // scroller whose overflow-anchor we have overridden
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

ScrollStability.prototype.now = function() {
	var win = this.stableWin;
	return (win && win.performance && win.performance.now) ? win.performance.now() : Date.now();
};

ScrollStability.prototype.onResize = function() {
	var node = this.domNode;
	if(!node || !node.isConnected) { return; }
	var rect = node.getBoundingClientRect(), w = rect.width, h = rect.height;
	if(this.lastW === undefined) { this.lastW = w; this.lastH = h; return; }   // initial observation
	var changed = Math.abs(w - this.lastW) > 0.01 || Math.abs(h - this.lastH) > 0.01;
	// Only a WIDTH change reflows the river (the case we exist for). A height-only change (an image
	// loading, fold/unfold, a transclusion growing) shifts content too, but the browser's own scroll
	// anchoring handles those — reacting to every height change would mean fighting normal layout.
	if(this.lastW === w) { return; }
	this.lastW = w; this.lastH = h;
	if(!changed) { return; }
	// A resize that coincides with a child add/remove is navigation — re-baseline, don't fight.
	if(this.now() - this.lastChildMutation < 120) { this.recordAnchor(); return; }
	this.restoreAnchor();
};

// Resolve the scroll container: prefer the document (the common case), else the nearest scrollable
// ancestor of our node.
ScrollStability.prototype.getScroller = function() {
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

// Take ownership of the scroller's scroll position by disabling the browser's native scroll anchoring
// on it (overflow-anchor) — otherwise the browser may nudge scrollTop on its own when content above
// reflows, fighting our corrections. Idempotent; if the resolved scroller ever changes, the previous
// one is released first. The original inline value is remembered for teardown.
ScrollStability.prototype.manageScroller = function(el) {
	if(this.managedScroller === el) { return; }
	this.releaseScroller();
	this.managedScroller = el;
	this.prevOverflowAnchor = el.style.overflowAnchor;
	try { el.style.overflowAnchor = "none"; } catch(e) {}
};

ScrollStability.prototype.releaseScroller = function() {
	var el = this.managedScroller;
	if(el) { try { el.style.overflowAnchor = this.prevOverflowAnchor || ""; } catch(e) {} }
	this.managedScroller = null;
	this.prevOverflowAnchor = undefined;
};

// The reading edge — the viewport position used to PICK the anchor target. For the document this is
// the top viewport edge, pushed down by the height of any position:fixed toolbar flagged with
// `.tc-adjust-top-of-scroll`: that is exactly the offset core subtracts when it scrolls a tiddler to
// the "top" (utils/dom/scroller.js), so a tiddler scrolled to the top sits at this line, not at 0.
// When no such toolbar is present the offset is 0. For an inner scroller it is the scroller's own top.
ScrollStability.prototype.refLine = function(scroller) {
	if(!scroller.isDoc) { return scroller.el.getBoundingClientRect().top; }
	var toolbar = this.document.querySelector(".tc-adjust-top-of-scroll");
	return toolbar ? toolbar.offsetHeight : 0;
};

// Bottom of the visible area, used to tell whether a target's top is on screen.
ScrollStability.prototype.vpBottom = function(scroller) {
	if(scroller.isDoc) {
		var doc = this.document;
		return doc.documentElement.clientHeight || this.stableWin.innerHeight;
	}
	var r = scroller.el.getBoundingClientRect();
	return r.top + scroller.el.clientHeight;
};

// Pin whatever is at the top of the viewport — the reading edge. The reference line is that edge, so
// the thing it lands on is the reading position. We choose the anchor by where the line falls, in
// strict priority. The crux is that a target TOP coinciding with the line is a clean frame boundary
// and the most stable anchor of all, so it must outrank a straddle of the target above it; but a
// straddle must still outrank a target top that is FAR BELOW the line (a later tiddler the reader is
// not looking at):
//
// 1. BOUNDARY — a target's top sits essentially AT the line. Pin that top. An element edge is immune
//    to the tiddler's own reflow, and this beats a sub-pixel straddle of the target above (otherwise a
//    tiddler sitting on top drifts on resize).
//
// 2. INSIDE — the line is genuinely in the MIDDLE of a target whose top scrolled off above. Pin the
//    exact TEXT CHARACTER at the line: a character keeps its identity through a width-reflow (a wrapped
//    line is not an element, but a character is), so the reading position itself stays put. When the
//    line falls on a non-text block instead (an image, iframe, video, embed…), pin that box's same
//    FRACTIONAL point, so a box that resizes with the river's width keeps your place.
//
// 3. GAP — no straddle, and the nearest target top is BELOW the line (the line sits in a gap above it).
//    Pin that top.
//
// 4. LAST RESORT — the line is below the bottom of the last target (scrolled past the end, into the
//    tail/below-story area). Pin the BOTTOM of the last target, so the end of the river stays put
//    across a height change. Bottom is only ever used here.
//
// The pinned value is a RAW viewport position; restoreAnchor holds it fixed.
ScrollStability.prototype.recordAnchor = function() {
	this.recordTimer = null;
	var node = this.domNode;
	if(!node || !node.isConnected || !this.targetSelector) { this.anchor = null; return; }
	var scroller = this.getScroller(), line = this.refLine(scroller), vpBottom = this.vpBottom(scroller);
	this.manageScroller(scroller.el);
	var targets;
	try { targets = node.querySelectorAll(this.targetSelector); } catch(e) { this.anchor = null; return; }

	// Single pass, document order (= visual top→bottom), gathering what each tier needs. EDGE is the
	// tolerance (≈1px) for treating a target edge as coinciding with the reading line, so sub-pixel
	// layout rounding at a frame boundary can't flip the decision.
	var EDGE = 1;
	var straddling = null,       // a target the line falls CLEARLY inside (top above, bottom well below)
		firstVisibleTop = null,  // first target whose top is at/below the line and within the viewport
		lastTarget = null, lastRect = null;   // last laid-out target, for the bottom last-resort
	for(var i = 0; i < targets.length; i++) {
		var r = targets[i].getBoundingClientRect();
		if(r.height <= 0) { continue; }
		lastTarget = targets[i]; lastRect = r;
		if(r.top < line - 0.5) {
			if(r.bottom > line + EDGE) { straddling = targets[i]; }   // line clearly inside this target
		} else if(firstVisibleTop === null && r.top < vpBottom) {
			firstVisibleTop = {el: targets[i], pos: r.top};           // topmost target with a visible top
		}
	}

	// Tier 1 — BOUNDARY: a target top sits essentially at the line. Pin it; this outranks a sub-pixel
	// straddle of the target above (the on-top-tiddler case).
	if(firstVisibleTop && firstVisibleTop.pos <= line + EDGE) {
		this.anchor = {el: firstVisibleTop.el, edge: "top", pos: firstVisibleTop.pos};
		return;
	}

	// Tier 2 — INSIDE: the line is in the middle of a straddling target → pin the exact reading
	// CHARACTER at the line. The browser's own caret hit-testing maps the reading point to the nearest
	// text position; between the point and that caret there is no other line of text (only the same
	// wrapped line or non-reflowing margin/padding), so holding it fixed keeps the reading edge put
	// through any width-reflow, whatever the line lands on (text, gaps between blocks, whitespace,
	// inline markup). The geometric search is only a fallback for when the caret APIs are unavailable
	// or the point is over a non-text block (e.g. an image). (Node.TEXT_NODE === 3.)
	if(straddling) {
		var ca = this.readingCharAt(straddling, line);
		if(ca) { this.anchor = ca; return; }
		var deep = this.deepestAtLine(straddling, line);
		if(deep && deep.nodeType === 3) {
			var off = this.textOffsetAtLine(deep, line);
			if(off !== null) {
				var trect = this.rangeRectAt(deep, off);
				// Accept only when the character's wrapped line really brackets the reading line.
				if(trect && trect.top <= line + 2 && trect.bottom >= line - 2) {
					this.anchor = {node: deep, offset: off, edge: "top", pos: trect.top};
					return;
				}
			}
			deep = deep.parentElement;   // text didn't bracket the line → pin its element instead
		}
		// The line is on a non-text block — an image, iframe, video, embed, canvas, or a gap between
		// blocks. Pin it PROPORTIONALLY: such a box can change height with the river's width (a responsive
		// image/iframe grows when the sidebar hides), so holding the SAME fractional point at the reading
		// line keeps your place, where pinning its top would let the point you're looking at drift. For a
		// fixed-height box the fraction is constant, so this degrades to a plain pin.
		var el = (deep && deep.nodeType === 1) ? deep : straddling,
			er = el.getBoundingClientRect(),
			frac = er.height > 0 ? Math.min(1,Math.max(0,(line - er.top) / er.height)) : 0;
		this.anchor = {el: el, edge: "frac", frac: frac, pos: er.top + frac * er.height};
		return;
	}

	// Tier 3 — GAP: the nearest target top is below the line (line sits in a gap above it) → pin it.
	if(firstVisibleTop) {
		this.anchor = {el: firstVisibleTop.el, edge: "top", pos: firstVisibleTop.pos};
		return;
	}

	// Tier 4 — LAST RESORT: scrolled past the end (line below the last target) → pin its bottom.
	if(lastTarget && lastRect.bottom <= line + 0.5) {
		this.anchor = {el: lastTarget, edge: "bottom", pos: lastRect.bottom};
		return;
	}

	this.anchor = null;
};

// The (textNode, offset) the browser would place a caret at for the viewport point (x, y), across the
// two API spellings (caretPositionFromPoint — standard; caretRangeFromPoint — WebKit). Null if neither
// resolves a node.
ScrollStability.prototype.caretAt = function(x, y) {
	var doc = this.document;
	try {
		if(doc.caretPositionFromPoint) {
			var cp = doc.caretPositionFromPoint(x, y);
			if(cp && cp.offsetNode) { return {node: cp.offsetNode, offset: cp.offset}; }
		} else if(doc.caretRangeFromPoint) {
			var cr = doc.caretRangeFromPoint(x, y);
			if(cr) { return {node: cr.startContainer, offset: cr.startOffset}; }
		}
	} catch(e) {}
	return null;
};

// True when `node` sits inside a position:fixed/sticky element (up to `stop`) — content decoupled from
// scrolling, useless as a reading anchor (e.g. a sticky tiddler title).
ScrollStability.prototype.hasDecoupledAncestor = function(node, stop) {
	var win = this.stableWin, el = (node.nodeType === 3) ? node.parentElement : node;
	while(el && el !== stop) {
		var pos = win.getComputedStyle(el).position;
		if(pos === "fixed" || pos === "sticky") { return true; }
		el = el.parentElement;
	}
	return false;
};

// Find the exact reading CHARACTER at the line inside `container` via the browser's caret hit-testing.
// Probe a few x positions across the width (prose sits in the middle; floats/margins at the edges) and
// take the first that lands on real, scroll-coupled text. Returns {node, offset, edge:"top", pos} or
// null (caret APIs missing, or the point is over a non-text block such as an image).
ScrollStability.prototype.readingCharAt = function(container, line) {
	var rect = container.getBoundingClientRect();
	if(rect.width <= 0) { return null; }
	var fracs = [0.5, 0.35, 0.65, 0.2, 0.8];
	for(var i = 0; i < fracs.length; i++) {
		var c = this.caretAt(rect.left + rect.width * fracs[i], line);
		if(!c || !c.node || c.node.nodeType !== 3) { continue; }
		if(!container.contains(c.node) || this.hasDecoupledAncestor(c.node, container)) { continue; }
		var rr = this.rangeRectAt(c.node, c.offset);
		// Only accept a caret whose own wrapped line actually brackets the reading line. Over a non-text
		// block (e.g. a tall image) the browser snaps the point to the NEAREST text, which can be far
		// above/below with reflowing content in between — pinning that would drift badly.
		if(rr && rr.top <= line + 2 && rr.bottom >= line - 2) {
			return {node: c.node, offset: c.offset, edge: "top", pos: rr.top};
		}
	}
	return null;
};

// Descend from `root` through the chain of child NODES — elements AND text nodes — whose box
// vertically contains the reference line, returning the deepest such node. The result is a TEXT
// NODE whenever the line falls on rendered text (the strongest anchor: a character keeps its
// identity through a width-reflow), otherwise the deepest element whose box spans the line (the
// line landed in a gap/margin, or on an image/empty block). position:fixed/sticky elements are
// skipped — their position is decoupled from the reading flow, so they're useless as an anchor (a
// sticky tiddler title stays put as you scroll). Iterative, so deep DOM trees can't blow the stack.
ScrollStability.prototype.deepestAtLine = function(root, line) {
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
ScrollStability.prototype.textNodeSpansLine = function(node, line) {
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
ScrollStability.prototype.rangeRectAt = function(node, offset) {
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
ScrollStability.prototype.textOffsetAtLine = function(node, line) {
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
ScrollStability.prototype.restoreAnchor = function() {
	var a = this.anchor;
	if(!a) { return; }
	var scroller = this.getScroller(), el = scroller.el;
	// We are about to move scrollTop ourselves; mark a window in which the resulting scroll events must
	// NOT be mistaken for the user scrolling (which would re-baseline and break a hide↔show round-trip).
	// Repeated restores during an animated sidebar toggle keep pushing this forward, covering the whole
	// transition plus the scheduleRecord debounce after it settles.
	this.suppressRecordUntil = this.now() + 300;
	this.manageScroller(el);
	// Our corrections must be INSTANT and exact. If a theme (or user CSS) set `scroll-behavior: smooth`
	// on the scroller, a scrollTop write would animate — and we read the position straight back across a
	// two-pass loop and across resize ticks, so the readback would see stale values and oscillate. Force
	// `auto` for the duration, restoring the inline value afterwards.
	var prevBehavior = el.style.scrollBehavior;
	el.style.scrollBehavior = "auto";
	try {
		// Range anchor (a text offset): re-measure the SAME character's line top and hold it fixed.
		if(a.node) {
			if(!a.node.isConnected) { this.recordAnchor(); return; }
			for(var p = 0; p < 2; p++) {
				var rrect = this.rangeRectAt(a.node, a.offset);
				if(!rrect) { this.recordAnchor(); return; }   // text gone/replaced → re-baseline
				var rdy = rrect.top - a.pos;
				if(Math.abs(rdy) <= 0.01) { break; }
				el.scrollTop = el.scrollTop + rdy;
			}
			return;
		}
		// Element anchor: hold the pinned edge (top | bottom | fractional point).
		if(!a.el || !a.el.isConnected) { this.recordAnchor(); return; }
		for(var pass = 0; pass < 2; pass++) {
			var rect = a.el.getBoundingClientRect();
			var cur = (a.edge === "bottom") ? rect.bottom :
				(a.edge === "frac") ? (rect.top + a.frac * rect.height) : rect.top;
			var dy = cur - a.pos;
			if(Math.abs(dy) <= 0.01) { break; }
			el.scrollTop = el.scrollTop + dy;
		}
	} finally {
		el.style.scrollBehavior = prevBehavior;
	}
};

ScrollStability.prototype.scheduleRecord = function() {
	var self = this, win = this.stableWin;
	if(!win) { return; }
	if(this.recordTimer) { win.clearTimeout(this.recordTimer); }
	this.recordTimer = win.setTimeout(function() {
		self.recordTimer = null;
		// Swallow scroll echoes from our own restore; only genuine user scrolling re-baselines.
		if(self.now() < self.suppressRecordUntil) { return; }
		self.recordAnchor();
	},150);
};

// Idempotent teardown of observers and listeners.
ScrollStability.prototype._cleanupStability = function() {
	if(this._cleaned) { return; }
	this._cleaned = true;
	this.releaseScroller();   // restore the scroller's native overflow-anchor
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

exports.ScrollStability = ScrollStability;
