/*\
title: $:/plugins/tiddlywiki/scroll-stable/stability.js
type: application/javascript
module-type: library

Scroll-stability controller.

A behaviour object (not a widget) attached to a story-wrapper's DOM node: when the node is resized in
width (toggling the sidebar reflows the river) it holds the reading position fixed. It pins whatever
sits at the reading line, either a target's top edge or the exact text character when the line falls
inside a target, so a width-reflow cannot drift the part you are reading. Adding or removing children
is navigation, so it re-baselines rather than fighting the change.

The pinnable targets are chosen by the CSS selector in the configuration tiddler below, resolved
within the node; it defaults to the story river's tiddler frames.

Construct with (domNode, widget); the story-wrapper widget drives refresh(changedTiddlers) and destroy().
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

// Only the target-selector config affects us; when it changes, rebuild observers and re-baseline.
ScrollStability.prototype.refresh = function(changedTiddlers) {
	if(!changedTiddlers || !changedTiddlers[CONFIG_TARGET_SELECTOR]) { return; }
	var sel = this.readSelector();
	if(sel === this.targetSelector) { return; }
	this._cleanupStability();
	this.targetSelector = sel;
	this.setupStability();
};

ScrollStability.prototype.destroy = function() {
	this._cleanupStability();
};

ScrollStability.prototype.setupStability = function() {
	this._cleaned = false;
	var win = this.document.defaultView;
	// No-op without a live browser window, observers, and a selector (e.g. server-side rendering).
	if(!win || !win.ResizeObserver || !win.MutationObserver || !this.targetSelector) { return; }
	var self = this;
	this.stableWin = win;
	this.anchor = null;          // {el,edge,pos} element edge, or {node,offset,pos} text character
	this.recordTimer = null;
	this.suppressRecordUntil = 0;   // ignore scroll echoes from our own restore until this time
	this.managedScroller = null;    // scroller whose overflow-anchor we overrode
	this.lastChildMutation = 0;
	this.lastW = undefined;
	this.lastH = undefined;
	this.resizeRaf = null;          // coalesces a burst of resize ticks into one restore

	// User scroll re-baselines, debounced so a reflow's own scroll jump is not read as the reading
	// position. Capture phase catches a non-bubbling inner scroller.
	this.onScrollHandler = function() { self.scheduleRecord(); };
	win.addEventListener("scroll",this.onScrollHandler,{capture: true, passive: true});

	// Container resize (sidebar toggle) restores the anchor.
	this.resizeObserver = new win.ResizeObserver(function() { self.scheduleResize(); });
	this.resizeObserver.observe(this.domNode);

	// Child add/remove is navigation, so re-baseline rather than fight it.
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

// Defer to rAF: reading layout and writing scrollTop inside the ResizeObserver callback triggers the
// "ResizeObserver loop completed with undelivered notifications" warning, and rAF also coalesces a
// burst of ticks into one restore.
ScrollStability.prototype.scheduleResize = function() {
	var self = this, win = this.stableWin;
	if(!win) { return; }
	if(!win.requestAnimationFrame) { this.onResize(); return; }
	if(this.resizeRaf) { return; }
	this.resizeRaf = win.requestAnimationFrame(function() {
		self.resizeRaf = null;
		self.onResize();
	});
};

ScrollStability.prototype.onResize = function() {
	var node = this.domNode;
	if(!node || !node.isConnected) { return; }
	var rect = node.getBoundingClientRect(), w = rect.width, h = rect.height;
	if(this.lastW === undefined) { this.lastW = w; this.lastH = h; return; }   // initial observation
	var changed = Math.abs(w - this.lastW) > 0.01 || Math.abs(h - this.lastH) > 0.01;
	// Only a width change reflows the river; the browser's native scroll anchoring handles height-only
	// changes (an image loading, a fold/unfold), so ignore them.
	if(this.lastW === w) { return; }
	this.lastW = w; this.lastH = h;
	if(!changed) { return; }
	// A resize coinciding with a child mutation is navigation, so re-baseline.
	if(this.now() - this.lastChildMutation < 120) { this.recordAnchor(); return; }
	this.restoreAnchor();
};

// The scroll container: the document when it scrolls, else the nearest scrollable ancestor.
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

// Disable the scroller's native scroll anchoring so the browser does not nudge scrollTop against our
// corrections when content above reflows. The previous scroller is released first and the original
// inline value restored on release.
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

// The reading line used to pick the anchor. For the document it is the top edge plus any fixed
// .tc-adjust-top-of-scroll toolbar height, matching the offset core subtracts when scrolling a tiddler
// to the top (utils/dom/scroller.js). For an inner scroller it is the scroller's own top.
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

// Pin whatever is at the reading line, choosing by strict priority:
//   1. BOUNDARY: a target's top sits at the line. Pin that top; an element edge is immune to reflow,
//      and this beats a sub-pixel straddle of the target above (the on-top-tiddler case).
//   2. INSIDE: the line is inside a target whose top scrolled off. Pin the exact text character at the
//      line, since a character keeps its identity through a width-reflow where a wrapped line does not.
//      On a non-text block (image, iframe) pin the same fractional point, so a box that resizes with
//      the river keeps your place.
//   3. GAP: no straddle and the nearest target top is below the line. Pin that top.
//   4. LAST RESORT: scrolled past the last target. Pin its bottom, so the end of the river stays put.
// The pinned value is a raw viewport position that restoreAnchor holds fixed.
ScrollStability.prototype.recordAnchor = function() {
	this.recordTimer = null;
	var node = this.domNode;
	if(!node || !node.isConnected || !this.targetSelector) { this.anchor = null; return; }
	var scroller = this.getScroller(), line = this.refLine(scroller), vpBottom = this.vpBottom(scroller);
	this.manageScroller(scroller.el);
	var targets;
	try { targets = node.querySelectorAll(this.targetSelector); } catch(e) { this.anchor = null; return; }

	// Single pass in document order. EDGE is the ~1px tolerance for treating a target edge as on the
	// line, so sub-pixel rounding at a frame boundary cannot flip the decision.
	var EDGE = 1;
	var straddling = null,       // target the line falls clearly inside
		firstVisibleTop = null,  // first target with a visible top at/below the line
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

	// Tier 1 BOUNDARY: a target top sits at the line; outranks a sub-pixel straddle of the target above.
	if(firstVisibleTop && firstVisibleTop.pos <= line + EDGE) {
		this.anchor = {el: firstVisibleTop.el, edge: "top", pos: firstVisibleTop.pos};
		return;
	}

	// Tier 2 INSIDE: pin the exact character at the line via caret hit-testing; the geometric search is
	// a fallback when the caret APIs are unavailable or the point is over a non-text block. (Node.TEXT_NODE === 3.)
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
			deep = deep.parentElement;   // text did not bracket the line, so pin its element instead
		}
		// The line is on a non-text block. Pin the same fractional point, so a box that resizes with the
		// river's width (e.g. a responsive image) keeps your place; for a fixed-height box the fraction is
		// constant and this is a plain pin.
		var el = (deep && deep.nodeType === 1) ? deep : straddling,
			er = el.getBoundingClientRect(),
			frac = er.height > 0 ? Math.min(1,Math.max(0,(line - er.top) / er.height)) : 0;
		this.anchor = {el: el, edge: "frac", frac: frac, pos: er.top + frac * er.height};
		return;
	}

	// Tier 3 GAP: the nearest target top is below the line, so pin it.
	if(firstVisibleTop) {
		this.anchor = {el: firstVisibleTop.el, edge: "top", pos: firstVisibleTop.pos};
		return;
	}

	// Tier 4 LAST RESORT: scrolled past the last target, so pin its bottom.
	if(lastTarget && lastRect.bottom <= line + 0.5) {
		this.anchor = {el: lastTarget, edge: "bottom", pos: lastRect.bottom};
		return;
	}

	this.anchor = null;
};

// The (node, offset) the browser would place a caret at for point (x, y), across the standard
// caretPositionFromPoint and WebKit caretRangeFromPoint. Null if neither resolves.
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

// True when node sits inside a fixed/sticky ancestor (up to stop): decoupled from scrolling, so
// useless as a reading anchor like a sticky tiddler title.
ScrollStability.prototype.hasDecoupledAncestor = function(node, stop) {
	var win = this.stableWin, el = (node.nodeType === 3) ? node.parentElement : node;
	while(el && el !== stop) {
		var pos = win.getComputedStyle(el).position;
		if(pos === "fixed" || pos === "sticky") { return true; }
		el = el.parentElement;
	}
	return false;
};

// The character at the line inside container, via caret hit-testing. Probe a few x positions (prose in
// the middle, floats at the edges) and take the first landing on real scroll-coupled text. Null if the
// caret APIs are missing or the point is over a non-text block.
ScrollStability.prototype.readingCharAt = function(container, line) {
	var rect = container.getBoundingClientRect();
	if(rect.width <= 0) { return null; }
	var fracs = [0.5, 0.35, 0.65, 0.2, 0.8];
	for(var i = 0; i < fracs.length; i++) {
		var c = this.caretAt(rect.left + rect.width * fracs[i], line);
		if(!c || !c.node || c.node.nodeType !== 3) { continue; }
		if(!container.contains(c.node) || this.hasDecoupledAncestor(c.node, container)) { continue; }
		var rr = this.rangeRectAt(c.node, c.offset);
		// Accept only a caret whose wrapped line brackets the reading line; over a non-text block the
		// browser snaps to the nearest text, which can be far away and drift badly.
		if(rr && rr.top <= line + 2 && rr.bottom >= line - 2) {
			return {node: c.node, offset: c.offset, edge: "top", pos: rr.top};
		}
	}
	return null;
};

// The deepest child node (element or text) whose box spans the reference line: a text node when the
// line falls on rendered text, else the deepest spanning element. Fixed/sticky elements are skipped as
// decoupled from scrolling. Iterative, so a deep DOM cannot blow the stack.
ScrollStability.prototype.deepestAtLine = function(root, line) {
	var win = this.stableWin, current = root, descended = true;
	while(descended) {
		descended = false;
		var kids = current.childNodes;
		for(var i = 0; i < kids.length; i++) {
			var child = kids[i];
			if(child.nodeType === 3) {                       // text node, measure with a Range
				if(this.textNodeSpansLine(child, line)) { return child; }
				continue;
			}
			if(child.nodeType !== 1) { continue; }           // skip comments and processing nodes
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

// True when any wrapped line of the text node contains the reference line; getClientRects yields one
// rect per line box, so a text node spanning several lines is handled correctly.
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

// Client rect of the character at (node, offset). A one-character range is measured because a collapsed
// range often reports no client rects; the offset is clamped to the last character.
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

// The offset in node whose wrapped line straddles the reference line. Character boxes advance
// monotonically down the node, so a binary search is valid and O(log n) for a huge paragraph. Purely
// geometric, so it resolves the same character every time and stays stable across a reflow.
ScrollStability.prototype.textOffsetAtLine = function(node, line) {
	var len = node.length || 0;
	if(len === 0) { return null; }
	var lo = 0, hi = len - 1, ans = -1;
	while(lo <= hi) {
		var mid = (lo + hi) >> 1;
		var rect = this.rangeRectAt(node, mid);
		if(!rect) { lo = mid + 1; continue; }              // unmeasurable (collapsed whitespace), skip
		if(rect.bottom > line + 0.5) { ans = mid; hi = mid - 1; }   // at/below the line
		else { lo = mid + 1; }                                       // still above the line
	}
	return (ans >= 0) ? ans : (len - 1);
};

// Scroll so the pinned edge or character returns to its recorded viewport position. scrollTop
// arithmetic keeps the fractional offset and a second pass absorbs rounding.
ScrollStability.prototype.restoreAnchor = function() {
	var a = this.anchor;
	if(!a) { return; }
	var scroller = this.getScroller(), el = scroller.el;
	// Suppress the scroll events our own scrollTop writes will fire, or they would be read as user
	// scrolling and re-baseline (breaking a hide then show round-trip). Repeated restores during an
	// animated toggle push the window forward across the transition plus the debounce.
	this.suppressRecordUntil = this.now() + 300;
	this.manageScroller(el);
	// Force scroll-behavior auto: a theme's scroll-behavior smooth would animate our write, and the
	// immediate readback across the two-pass loop would see stale values and oscillate.
	var prevBehavior = el.style.scrollBehavior;
	el.style.scrollBehavior = "auto";
	try {
		// Text anchor: re-measure the same character's line top and hold it fixed.
		if(a.node) {
			if(!a.node.isConnected) { this.recordAnchor(); return; }
			for(var p = 0; p < 2; p++) {
				var rrect = this.rangeRectAt(a.node, a.offset);
				if(!rrect) { this.recordAnchor(); return; }   // text gone or replaced, re-baseline
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
		if(this.resizeRaf && this.stableWin.cancelAnimationFrame) { try { this.stableWin.cancelAnimationFrame(this.resizeRaf); } catch(e) {} }
	}
	this.resizeObserver = null;
	this.mutationObserver = null;
	this.onScrollHandler = null;
	this.recordTimer = null;
	this.resizeRaf = null;
	this.anchor = null;
};

exports.ScrollStability = ScrollStability;
