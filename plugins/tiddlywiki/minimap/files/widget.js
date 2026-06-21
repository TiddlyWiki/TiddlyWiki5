/*\
title: $:/plugins/BurningTreeC/minimap/widget.js
type: application/javascript
module-type: widget

A generic minimap widget, in the style of the CodeMirror 6 minimap.

It renders a vertically-scaled overview of a scroll container's content and a
draggable overlay marking the visible viewport. It is generic: the scroll
container and the elements that make up the map are both selected with CSS
selectors, so it is not tied to any particular layout.

Usage:

	<$minimap
		container=".tc-story-river"
		selector=".tc-tiddler-frame"
		width="120"
		mode="clone"
	/>

Attributes:

	container : CSS selector for the element whose content is mapped. When
	            omitted the nearest scrollable ancestor of the widget is used.
	scroller  : CSS selector for the element that actually scrolls. Defaults to
	            the container. Use this when the container itself does not scroll
	            but an ancestor does.
	selector  : CSS selector (resolved within the container) for the elements
	            that make up the map. Defaults to the container's element
	            children.
	width     : Minimap width in pixels (default 120).
	mode      : "clone" (default) renders scaled clones of the matched elements;
	            "blocks" renders lightweight coloured rectangles.
	class     : Extra class name(s) added to the minimap panel.
	tooltips  : "yes" to give each mapped block a native title tooltip (default
	            "no"). The text is read from the attribute named by
	            tooltipAttribute on the matched element.
	tooltipAttribute : Attribute on the matched element to read the tooltip text
	            from (default "data-tiddler-title").
	blockBorder : On-screen border width in px drawn around each mapped block, for
	            visibility (default 1; 0 disables). The colour is set in CSS via
	            the .tc-minimap-block border-color (overridable with the
	            --tv-minimap-block-border-color custom property).

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var DEFAULT_WIDTH = 120;
var MIN_OVERLAY_HEIGHT = 8;
var RESOLVE_RETRIES = 30;

var MinimapWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

MinimapWidget.prototype = new Widget();

MinimapWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	var doc = this.document;
	// The minimap panel. Height/placement is left to CSS so the widget can be
	// dropped into any layout (sidebar, fixed column, flex child, ...).
	var panel = doc.createElement("div");
	panel.className = "tc-minimap" + (this.minimapClass ? " " + this.minimapClass : "");
	panel.setAttribute("aria-hidden","true");
	panel.style.width = this.minimapWidth + "px";
	// Publish the width as a CSS custom property on the document root so
	// stylesheets (e.g. the story-river spacing) can reserve room for the minimap
	// without hardcoding a value: width: calc(... - var(--tv-minimap-width)).
	this.publishWidth();
	// Inner wrapper - translated vertically to "scroll" the map when the mapped
	// content is taller than the minimap itself.
	var inner = doc.createElement("div");
	inner.className = "tc-minimap-inner";
	// Scaler - holds the (absolutely positioned) blocks/clones at their real
	// coordinates and scales the whole lot down with a single transform.
	var scaler = doc.createElement("div");
	scaler.className = "tc-minimap-scaler";
	inner.appendChild(scaler);
	// Overlay marking the visible viewport. Sits in panel (un-translated)
	// coordinates so it can be dragged independently of the mapped content.
	var overlayContainer = doc.createElement("div");
	overlayContainer.className = "tc-minimap-overlay-container";
	var overlay = doc.createElement("div");
	overlay.className = "tc-minimap-overlay";
	overlayContainer.appendChild(overlay);
	panel.appendChild(inner);
	panel.appendChild(overlayContainer);
	parent.insertBefore(panel,nextSibling);
	this.domNodes.push(panel);
	// Keep references for the geometry/interaction code
	this.panel = panel;
	this.inner = inner;
	this.scaler = scaler;
	this.overlayContainer = overlayContainer;
	this.overlay = overlay;
	// Interaction state
	this.scale = 1;
	this.isDragging = false;
	this.dragStartY = 0;
	this.dragStartTop = 0;
	this.rafPending = false;
	this.rebuildTimer = null;
	this.resolveAttempts = 0;
	// The id of the pointer currently dragging the overlay (null when not dragging).
	this.dragPointerId = null;
	// Whether this widget owns (publishes) the scrollbar-width variable. Decided in
	// attachListeners once the root is known; false until then so no stray writes.
	this.ownsScrollbarVar = false;
	// Cached overlay height used to avoid redundant style writes. Reset here so the
	// first updateView() after a (re-)render always writes the height to the freshly
	// created overlay element - otherwise a refreshSelf() (e.g. on a settings
	// change) would leave the new overlay at height 0 because the cached value still
	// matched the unchanged geometry.
	this._lastOverlayH = null;
	// The mapped elements currently watched for size changes (kept in sync with
	// the rendered set so the map updates live as tiddlers grow/shrink).
	this._observedEls = [];
	// Bind handlers once so we can remove them again
	this.boundScroll = this.onScroll.bind(this);
	this.boundResize = this.onResize.bind(this);
	this.boundPointerDown = this.onPointerDown.bind(this);
	this.boundPointerMove = this.onPointerMove.bind(this);
	this.boundPointerUp = this.onPointerUp.bind(this);
	// Resolve the container/scroller and wire everything up
	this.setup();
};

/*
Compute the internal state of the widget
*/
MinimapWidget.prototype.execute = function() {
	this.containerSelector = this.getAttribute("container","");
	this.scrollerSelector = this.getAttribute("scroller","");
	this.elementSelector = this.getAttribute("selector","");
	this.minimapClass = this.getAttribute("class","");
	this.minimapMode = this.getAttribute("mode","clone");
	// Opt-in tooltips: when "yes", each mapped block gets a native title tooltip
	// read from a (configurable, generic) attribute on the matched element - e.g.
	// data-tiddler-title for TiddlyWiki tiddler frames.
	this.tooltipsEnabled = this.getAttribute("tooltips","no") === "yes";
	this.tooltipAttribute = this.getAttribute("tooltipAttribute","data-tiddler-title");
	// On-screen border width (px) drawn around each mapped block, for visibility.
	// The blocks are inside a scaled container, so the actual border width is
	// compensated by the scale at build time (see rebuild). 0 disables the border.
	var border = parseFloat(this.getAttribute("blockBorder","1"));
	this.blockBorder = (isFinite(border) && border >= 0) ? border : 1;
	var width = parseInt(this.getAttribute("width",""),10);
	this.minimapWidth = (width && width > 0) ? width : DEFAULT_WIDTH;
	// CSS custom property names to publish on the document root (configurable).
	this.widthVariable = this.normaliseCssVar(this.getAttribute("widthVariable","--tv-minimap-width"));
	this.scrollbarVariable = this.normaliseCssVar(this.getAttribute("scrollbarVariable","--tv-minimap-scrollbar-width"));
};

/*
Ensure a CSS custom property name starts with "--" so it can be used both with
setProperty() and var() (accepts "name" or "--name").
*/
MinimapWidget.prototype.normaliseCssVar = function(name) {
	name = (name || "").trim();
	if(!name) {
		return "";
	}
	return name.indexOf("--") === 0 ? name : "--" + name;
};

/*
Find a scrollable ancestor of the given node
*/
MinimapWidget.prototype.findScrollableAncestor = function(node) {
	var doc = this.document,
		win = doc.defaultView || window;
	while(node && node !== doc.body && node.nodeType === 1) {
		var style = win.getComputedStyle(node),
			overflowY = style.overflowY;
		if((overflowY === "auto" || overflowY === "scroll") && node.scrollHeight > node.clientHeight) {
			return node;
		}
		node = node.parentNode;
	}
	return doc.scrollingElement || doc.documentElement;
};

/*
Find the nearest ancestor that is a scroll container (overflow auto/scroll),
regardless of whether it currently overflows. Used to locate the container whose
scrollbar the minimap should clear - that scrollbar may only appear later, so it
must not be gated on the current overflow state.
*/
MinimapWidget.prototype.findScrollContainer = function(node) {
	var doc = this.document,
		win = doc.defaultView || window;
	while(node && node !== doc.body && node.nodeType === 1) {
		var overflowY = win.getComputedStyle(node).overflowY;
		if(overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") {
			return node;
		}
		node = node.parentNode;
	}
	return doc.scrollingElement || doc.documentElement;
};

/*
Resolve the container and scroller elements, then build the map. Retries for a
few animation frames because the target may not be laid out (or may not yet
exist) when the widget first renders.
*/
MinimapWidget.prototype.setup = function() {
	var self = this,
		doc = this.document;
	if(this.containerSelector) {
		this.container = doc.querySelector(this.containerSelector);
	} else {
		this.container = this.findScrollableAncestor(this.parentDomNode);
	}
	if(this.container && this.scrollerSelector) {
		this.scroller = doc.querySelector(this.scrollerSelector) || this.container;
	} else if(this.container) {
		// Default the scroller to the nearest scrollable ancestor of the
		// container (which may be the container itself). The content container
		// (e.g. .tc-story-river) is frequently NOT the element that scrolls - an
		// ancestor (the page) is - so reading scrollTop from the container would
		// leave the overlay out of sync with the actual scrolling.
		this.scroller = this.findScrollableAncestor(this.container);
	}
	// The scroll container the minimap itself is placed inside (e.g. the sidebar).
	// Its scrollbar width is published so stylesheets can position the minimap
	// just clear of that scrollbar. Resolved by overflow style (not current
	// overflow state) so we still pick it when its scrollbar appears later.
	this.hostScroller = this.findScrollContainer(this.parentDomNode);
	if(!this.container || !this.scroller || !this.panel) {
		// The target elements aren't in the DOM yet - retry on the next frame for a
		// little while (they may not exist or be laid out when we first render).
		if(this.resolveAttempts < RESOLVE_RETRIES) {
			this.resolveAttempts += 1;
			var win = doc.defaultView || window;
			this.resolveRaf = win.requestAnimationFrame(function() {
				self.setup();
			});
		}
		return;
	}
	// Attach as soon as the elements exist, even if the panel is currently hidden
	// (e.g. the window started below the sidebar breakpoint, where the minimap is
	// display:none). rebuild() early-returns while hidden, and the ResizeObserver on
	// the panel then fires a rebuild the moment it becomes visible again - without
	// this, a wiki opened narrow would never wire up its observers and the minimap
	// would stay empty until toggled off and on.
	this.attachListeners();
	this.rebuild();
};

MinimapWidget.prototype.getWindow = function() {
	var doc = this.document;
	return doc.defaultView || window;
};

/*
Publish (or clear) the minimap width as a CSS custom property (named by the
widthVariable attribute) on the document's root element, so stylesheets can size
around it.
*/
MinimapWidget.prototype.publishWidth = function(clear) {
	var doc = this.document,
		root = doc.documentElement;
	if(!root || !root.style || !this.widthVariable) {
		return;
	}
	if(clear) {
		root.style.removeProperty(this.widthVariable);
	} else {
		root.style.setProperty(this.widthVariable,this.minimapWidth + "px");
	}
};

/*
Is the scroller the document's root scrolling element? The root scrolls
differently from an overflow container: scroll events fire on the window/document
(not the element) and the element's own bounding rect moves with the scroll.
*/
MinimapWidget.prototype.isRootScroller = function() {
	var doc = this.document;
	return this.scroller === doc.scrollingElement ||
		this.scroller === doc.documentElement ||
		this.scroller === doc.body;
};

/*
The element that fires scroll events for the scroller (the window for a root
scroller, otherwise the scroller element itself).
*/
MinimapWidget.prototype.getScrollEventTarget = function() {
	return this.isRootScroller() ? this.getWindow() : this.scroller;
};

/*
Height of any position:fixed toolbar that overlays the top of the page (marked
with the `tc-adjust-top-of-scroll` class, e.g. a sticky menubar). Content scrolls
underneath it, so the usable viewport - and therefore the overlay's height, the
overlay's position and the targets we scroll to - must be offset by this height,
matching TiddlyWiki's own PageScroller.scrollIntoView. The toolbar is fixed to the
viewport, so it only applies when the page itself is the scroller.
*/
MinimapWidget.prototype.getTopOffset = function() {
	if(!this.isRootScroller()) {
		return 0;
	}
	var bar = this.document.querySelector(".tc-adjust-top-of-scroll");
	return bar ? bar.offsetHeight : 0;
};

MinimapWidget.prototype.attachListeners = function() {
	var self = this,
		win = this.getWindow();
	this.scrollEventTarget = this.getScrollEventTarget();
	this.scrollEventTarget.addEventListener("scroll",this.boundScroll,{passive: true});
	win.addEventListener("resize",this.boundResize);
	// Pointer events (mouse/touch/pen). Pointer capture during a drag delivers all
	// move/up events to the panel even when the pointer leaves it, so no
	// window-level listeners are needed.
	this.panel.addEventListener("pointerdown",this.boundPointerDown);
	this.panel.addEventListener("pointermove",this.boundPointerMove);
	this.panel.addEventListener("pointerup",this.boundPointerUp);
	this.panel.addEventListener("pointercancel",this.boundPointerUp);
	// Rebuild when the mapped content changes size or when elements are added
	// or removed (e.g. tiddlers opened/closed in the story river).
	if(typeof win.ResizeObserver === "function") {
		this.resizeObserver = new win.ResizeObserver(this.scheduleRebuild.bind(this));
		this.resizeObserver.observe(this.scroller);
		if(this.container !== this.scroller) {
			this.resizeObserver.observe(this.container);
		}
		// Also observe the panel so that hiding/showing the minimap (e.g. toggling
		// a sidebar it lives in) re-triggers a rebuild when it becomes visible.
		if(this.panel !== this.scroller && this.panel !== this.container) {
			this.resizeObserver.observe(this.panel);
		}
		// Dedicated, lightweight observer for the host scroll container: its size
		// (and scrollbar) changing only needs the scrollbar variable republished,
		// not a full re-clone of the mapped content.
		if(this.hostScroller) {
			this.scrollbarObserver = new win.ResizeObserver(function() {
				self.publishScrollbarWidth();
			});
			this.scrollbarObserver.observe(this.hostScroller);
		}
	}
	// Decide whether this widget owns the scrollbar-width variable. If it is already
	// present on the root, something else is managing it (in the bundled plugin, the
	// always-on startup module that keeps it measured even while the minimap is
	// hidden) - so defer to that owner and never write it, to avoid two writers and
	// to avoid clearing the always-present value on destroy. If it is absent (a
	// generic standalone <$minimap> with no startup module), take ownership and
	// publish/maintain it ourselves.
	var doc = this.document,
		root = doc.documentElement;
	this.ownsScrollbarVar = !!(this.scrollbarVariable && root && root.style &&
		!root.style.getPropertyValue(this.scrollbarVariable));
	// Publish the width and scrollbar variables now that everything is resolved.
	this.publishWidth();
	this.publishScrollbarWidth();
	if(typeof win.MutationObserver === "function") {
		this.mutationObserver = new win.MutationObserver(this.scheduleRebuild.bind(this));
		this.mutationObserver.observe(this.container,{childList: true, subtree: true});
	}
};

/*
Reconcile which mapped elements are observed for size changes: observe newly
added ones, unobserve removed ones. Only observing *new* elements (rather than
re-observing all every rebuild) avoids a feedback loop, since observe() fires an
initial callback.
*/
MinimapWidget.prototype.observeElements = function(elements) {
	if(!this.resizeObserver) {
		return;
	}
	var current = [];
	for(var i = 0; i < elements.length; i++) {
		current.push(elements[i].el);
	}
	for(var o = 0; o < this._observedEls.length; o++) {
		if(current.indexOf(this._observedEls[o]) === -1) {
			this.resizeObserver.unobserve(this._observedEls[o]);
		}
	}
	for(var n = 0; n < current.length; n++) {
		if(this._observedEls.indexOf(current[n]) === -1) {
			this.resizeObserver.observe(current[n]);
		}
	}
	this._observedEls = current;
};

/*
Collect the elements that make up the map, measured relative to the scroller's
scroll content.
*/
MinimapWidget.prototype.collectElements = function() {
	var nodes;
	if(this.elementSelector) {
		nodes = this.container.querySelectorAll(this.elementSelector);
	} else {
		nodes = this.container.children;
	}
	var scrollTop = this.scroller.scrollTop,
		scrollLeft = this.scroller.scrollLeft,
		result = [];
	// Reference point that an element's content position is measured from. For a
	// root scroller the "viewport" top is 0; for an overflow container it is the
	// container's (border-box) top in viewport coordinates. (Using the root's own
	// bounding rect would be wrong - it moves with the scroll.)
	var refTop = 0,
		refLeft = 0;
	if(!this.isRootScroller()) {
		var scrollerRect = this.scroller.getBoundingClientRect();
		refTop = scrollerRect.top;
		refLeft = scrollerRect.left;
	}
	for(var i = 0; i < nodes.length; i++) {
		var el = nodes[i],
			rect = el.getBoundingClientRect();
		result.push({
			el: el,
			top: rect.top - refTop + scrollTop,
			left: rect.left - refLeft + scrollLeft,
			width: rect.width,
			height: rect.height
		});
	}
	return result;
};

/*
Prepare a freshly cloned subtree for the map: strip ids (to avoid duplicates),
remove nodes that would load resources, and replace iframes with a static
snapshot (cloneNode does not reproduce an iframe's document).
*/
MinimapWidget.prototype.processClone = function(original, clone) {
	if(clone.removeAttribute) {
		clone.removeAttribute("id");
	}
	// Drop nodes that would load/run resources. Iframes are handled separately.
	var drop = clone.querySelectorAll ? clone.querySelectorAll("script,object,embed") : [];
	for(var i = drop.length - 1; i >= 0; i--) {
		if(drop[i].parentNode) {
			drop[i].parentNode.removeChild(drop[i]);
		}
	}
	// Replace each iframe with a snapshot. The cloned and original trees have the
	// same structure, so iframes line up by index.
	if(original.querySelectorAll && clone.querySelectorAll) {
		var origFrames = original.querySelectorAll("iframe"),
			cloneFrames = clone.querySelectorAll("iframe");
		for(var f = 0; f < cloneFrames.length && f < origFrames.length; f++) {
			this.replaceIframe(origFrames[f],cloneFrames[f]);
		}
	}
	var withId = clone.querySelectorAll ? clone.querySelectorAll("[id]") : [];
	for(var j = 0; j < withId.length; j++) {
		withId[j].removeAttribute("id");
	}
	return clone;
};

/*
Replace a cloned <iframe> with a div snapshot. For a same-origin iframe (e.g.
TiddlyWiki's framed text editor, or a local embed) the iframe's document body is
cloned in so its content is shown. For a cross-origin iframe the browser forbids
reading the content, so a correctly-sized blank placeholder is used instead -
which still preserves the layout height so the surrounding tiddler doesn't
collapse.
*/
MinimapWidget.prototype.replaceIframe = function(origIframe,cloneIframe) {
	var doc = this.document;
	if(!cloneIframe.parentNode) {
		return;
	}
	var rect = origIframe.getBoundingClientRect(),
		repl = doc.createElement("div");
	repl.className = "tc-minimap-iframe";
	// Carry over the iframe's own class/style so margins and sizing are preserved
	var cls = cloneIframe.getAttribute("class");
	if(cls) {
		repl.className += " " + cls;
	}
	repl.setAttribute("style",cloneIframe.getAttribute("style") || "");
	repl.style.width = rect.width + "px";
	repl.style.height = rect.height + "px";
	repl.style.overflow = "hidden";
	repl.style.boxSizing = "border-box";
	try {
		var idoc = origIframe.contentDocument;
		if(idoc && idoc.body) {
			var bodyClone = idoc.body.cloneNode(true);
			// Drop scripts from the snapshot
			var snapScripts = bodyClone.querySelectorAll ? bodyClone.querySelectorAll("script") : [];
			for(var s = snapScripts.length - 1; s >= 0; s--) {
				if(snapScripts[s].parentNode) {
					snapScripts[s].parentNode.removeChild(snapScripts[s]);
				}
			}
			// Sync live form values (textarea/input) - cloneNode captures the
			// default value, not text typed since load, so copy it across.
			this.syncFieldValues(idoc.body,bodyClone);
			repl.appendChild(bodyClone);
		} else {
			repl.className += " tc-minimap-iframe-blank";
		}
	} catch(e) {
		// Cross-origin: keep the sized placeholder
		repl.className += " tc-minimap-iframe-blank";
	}
	cloneIframe.parentNode.replaceChild(repl,cloneIframe);
};

/*
Copy live <textarea>/<input>/<select> values from a source subtree onto the
matching (same structure, same order) elements of a cloned subtree.
*/
MinimapWidget.prototype.syncFieldValues = function(source,clone) {
	if(!source.querySelectorAll || !clone.querySelectorAll) {
		return;
	}
	var sel = "textarea,input,select",
		src = source.querySelectorAll(sel),
		dst = clone.querySelectorAll(sel);
	for(var i = 0; i < src.length && i < dst.length; i++) {
		var sNode = src[i],
			dNode = dst[i];
		if(dNode.tagName === "TEXTAREA") {
			// Render the live text by setting it as the textarea's content
			dNode.textContent = sNode.value;
		} else if(dNode.tagName === "INPUT") {
			dNode.setAttribute("value",sNode.value);
		}
	}
};

/*
(Re)build the contents of the map from the current DOM, then update positions.
This is the expensive path; it only runs on layout/structure changes, not on
every scroll.
*/
MinimapWidget.prototype.rebuild = function() {
	if(!this.container || !this.scroller || !this.panel) {
		return;
	}
	// Don't rebuild while the container or the minimap is hidden/collapsed: the
	// measurements would be zero and poison the scale. The ResizeObserver will
	// fire again - and re-run the rebuild - once everything is visible.
	if(this.container.clientWidth === 0 || this.scroller.clientHeight === 0 || this.panel.clientHeight === 0) {
		return;
	}
	var doc = this.document,
		elements = this.collectElements();
	// Keep each mapped element observed for size changes, so the map updates live
	// as a tiddler grows or shrinks (typing in an editor, images loading,
	// folding). The container/scroller's own box size doesn't change when a child
	// frame grows - only its scrollHeight does, which ResizeObserver ignores - so
	// the elements themselves must be observed.
	this.observeElements(elements);
	// Scale to the width actually occupied by the mapped elements rather than to
	// the full container width. The matched elements (e.g. tiddler frames) are
	// often centred with horizontal margins; mapping the whole container width
	// would leave them narrow and offset. Using their bounding box - and shifting
	// off the left margin - makes the widest element fill the minimap while
	// preserving each element's aspect ratio (uniform scale).
	var minLeft = Infinity,
		maxRight = -Infinity,
		minTop = Infinity,
		maxBottom = -Infinity;
	for(var k = 0; k < elements.length; k++) {
		minLeft = Math.min(minLeft, elements[k].left);
		maxRight = Math.max(maxRight, elements[k].left + elements[k].width);
		minTop = Math.min(minTop, elements[k].top);
		maxBottom = Math.max(maxBottom, elements[k].top + elements[k].height);
	}
	if(!isFinite(minLeft) || maxRight <= minLeft) {
		minLeft = 0;
		maxRight = this.scroller.clientWidth || this.scroller.offsetWidth || 1;
	}
	if(!isFinite(minTop) || maxBottom <= minTop) {
		minTop = 0;
		maxBottom = this.scroller.scrollHeight || 1;
	}
	// The map's vertical axis spans the extent actually occupied by the matched
	// elements - not the scroller's full scrollHeight, which may include a header
	// offset, bottom padding or gaps with no matched elements. Mapping the full
	// scrollHeight would leave large empty regions and let scrolling translate
	// the content off into blank space.
	this._contentTop = minTop;
	this._contentBottom = maxBottom;
	var contentWidth = maxRight - minLeft;
	this.scale = this.minimapWidth / contentWidth;
	this.scaler.style.width = contentWidth + "px";
	this.scaler.style.transform = "scale(" + this.scale + ")";
	// Clear previous content
	while(this.scaler.firstChild) {
		this.scaler.removeChild(this.scaler.firstChild);
	}
	for(var i = 0; i < elements.length; i++) {
		var info = elements[i],
			block = doc.createElement("div");
		block.className = "tc-minimap-block";
		block.style.position = "absolute";
		block.style.top = (info.top - minTop) + "px";
		block.style.left = (info.left - minLeft) + "px";
		block.style.width = info.width + "px";
		block.style.height = info.height + "px";
		block.style.margin = "0";
		block.style.pointerEvents = "none";
		// Border for visibility. Width is compensated by the scale so it renders at
		// the configured on-screen pixel width despite the scaled parent; colour
		// comes from CSS (.tc-minimap-block border-color). box-sizing keeps the
		// border inside the measured block so it doesn't shift positions.
		if(this.blockBorder > 0 && this.scale > 0) {
			block.style.boxSizing = "border-box";
			block.style.borderStyle = "solid";
			block.style.borderWidth = (this.blockBorder / this.scale) + "px";
		}
		// Optional tooltip from a configurable attribute on the matched element.
		// A native title needs hover, so re-enable pointer events on this block
		// (the clone inside stays inert; clicks still bubble to the panel and
		// scroll-to-position because the block isn't the overlay).
		if(this.tooltipsEnabled && this.tooltipAttribute && info.el.getAttribute) {
			var tip = info.el.getAttribute(this.tooltipAttribute);
			if(tip) {
				block.title = tip;
				block.style.pointerEvents = "auto";
			}
		}
		if(this.minimapMode === "clone") {
			var clone = this.processClone(info.el,info.el.cloneNode(true));
			clone.style.margin = "0";
			clone.style.width = info.width + "px";
			clone.style.boxSizing = "border-box";
			clone.style.pointerEvents = "none";
			block.appendChild(clone);
		} else {
			block.className += " tc-minimap-block-filled";
		}
		this.scaler.appendChild(block);
	}
	this.measure();
	this.updateView();
};

/*
Cheap path: reposition the inner content and the overlay to reflect the current
scroll position. Runs on every scroll (throttled to animation frames).
*/
MinimapWidget.prototype.updateView = function() {
	if(!this.scroller || !this.panel) {
		return;
	}
	// Only the scroll position is read here (the cheap, per-frame path). Every
	// other measurement is cached by measure() at rebuild/resize time, so
	// scrolling never forces a reflow of the (potentially large, absolutely
	// positioned) minimap.
	var scrollTop = this.scroller.scrollTop,
		clientH = this._clientH || 0,
		// A fixed top toolbar covers the top of the viewport, so the usable
		// (visible) viewport starts that much lower and is that much shorter.
		topOffset = this._topOffset || 0,
		visibleH = Math.max(0, clientH - topOffset),
		scale = this.scale,
		contentTop = this._contentTop || 0,
		contentBottom = this._contentBottom || 0,
		mapViewH = this._mapViewH || 0,
		// Total scaled height of the mapped elements
		mapContentH = (contentBottom - contentTop) * scale,
		// The viewport (overlay), anchored to the actual scroll position within
		// the element extent - sized and positioned for the usable viewport, so it
		// marks what is actually visible below the toolbar.
		overlayH = Math.max(MIN_OVERLAY_HEIGHT, Math.min(visibleH * scale, mapViewH)),
		overlayTopMap = (scrollTop + topOffset - contentTop) * scale,
		panelTravel = Math.max(0, mapViewH - overlayH),
		translate,
		overlayTop,
		// The range the overlay top actually moves within. Drag mapping must use
		// this same range so dragging matches wheel scrolling.
		overlayTravel;
	if(mapContentH <= mapViewH) {
		// All mapped content fits in the panel: don't translate, just slide the
		// overlay over the static content. The overlay only travels across the
		// filled region (mapContentH - overlayH), not the whole panel, otherwise
		// dragging would feel slow and the overlay would detach from the content.
		translate = 0;
		overlayTravel = Math.max(0, mapContentH - overlayH);
		overlayTop = Math.min(Math.max(0, overlayTopMap), overlayTravel);
	} else {
		// Content taller than the panel: translate the inner content so the
		// overlay tracks the scroll position while staying inside the panel.
		overlayTravel = panelTravel;
		var progressDenom = Math.max(0, mapContentH - overlayH),
			progress = progressDenom > 0 ? overlayTopMap / progressDenom : 0;
		progress = Math.min(Math.max(progress, 0), 1);
		overlayTop = progress * overlayTravel;
		translate = overlayTop - overlayTopMap;
	}
	this.inner.style.transform = "translateY(" + translate + "px)";
	// Position the overlay with a compositor transform (changing `top` would
	// trigger layout) and only write its height when it actually changes.
	this.overlay.style.transform = "translateY(" + overlayTop + "px)";
	if(overlayH !== this._lastOverlayH) {
		this.overlay.style.height = overlayH + "px";
		this._lastOverlayH = overlayH;
	}
	// Cache values used by the interaction handlers
	this._overlayTop = overlayTop;
	this._overlayH = overlayH;
	this._overlayTravel = overlayTravel;
	this._translate = translate;
};

/*
Cache the geometry that only changes on rebuild/resize, so the per-frame scroll
path (updateView) doesn't have to read it (and force a reflow) every frame.
*/
MinimapWidget.prototype.measure = function() {
	if(!this.scroller || !this.panel) {
		return;
	}
	this._clientH = this.scroller.clientHeight;
	this._mapViewH = this.panel.clientHeight;
	this._topOffset = this.getTopOffset();
	this.publishScrollbarWidth();
};

/*
Publish the host scroll container's vertical scrollbar width as a CSS custom
property (named by the scrollbarVariable attribute), so a stylesheet can offset
the minimap just clear of the scrollbar of whatever container it lives in.

Only writes when this widget owns the variable (see attachListeners): if something
else already manages it - the always-on startup module in the bundled plugin - we
must not write or clear it, so the value stays present and accurate at all times.
*/
MinimapWidget.prototype.publishScrollbarWidth = function(clear) {
	var doc = this.document,
		root = doc.documentElement;
	if(!root || !root.style || !this.scrollbarVariable || !this.ownsScrollbarVar) {
		return;
	}
	if(clear) {
		root.style.removeProperty(this.scrollbarVariable);
		return;
	}
	var host = this.hostScroller,
		width = host ? Math.max(0, host.offsetWidth - host.clientWidth) : 0;
	root.style.setProperty(this.scrollbarVariable,width + "px");
};

MinimapWidget.prototype.onScroll = function() {
	var self = this,
		win = this.getWindow();
	if(this.rafPending) {
		return;
	}
	this.rafPending = true;
	win.requestAnimationFrame(function() {
		self.rafPending = false;
		self.updateView();
	});
};

MinimapWidget.prototype.onResize = function() {
	// Update the scrollbar variable immediately (cheap); the rebuild is debounced.
	this.publishScrollbarWidth();
	this.scheduleRebuild();
};

/*
Debounced rebuild - coalesces bursts of mutations/resizes into a single rebuild.
*/
MinimapWidget.prototype.scheduleRebuild = function() {
	var self = this,
		win = this.getWindow();
	if(this.rebuildTimer) {
		win.clearTimeout(this.rebuildTimer);
	}
	this.rebuildTimer = win.setTimeout(function() {
		self.rebuildTimer = null;
		self.rebuild();
	},100);
};

MinimapWidget.prototype.onPointerDown = function(event) {
	// Primary button/contact only (ignore right/middle click and secondary touches).
	if(event.button > 0) {
		return;
	}
	if(event.target === this.overlay) {
		// Begin dragging the overlay. Capture the pointer so move/up keep arriving
		// at the panel even if the pointer strays outside it during the drag.
		this.isDragging = true;
		this.dragPointerId = event.pointerId;
		this.dragStartY = event.clientY;
		this.dragStartTop = this._overlayTop || 0;
		this.panel.classList.add("tc-minimap-active");
		if(this.panel.setPointerCapture) {
			try {
				this.panel.setPointerCapture(event.pointerId);
			} catch(e) {
				// Ignore - capture is an optimisation, not required for correctness
			}
		}
		event.preventDefault();
		return;
	}
	// Click on the map body: scroll so the clicked position is centred in the
	// usable viewport (the part visible below any fixed top toolbar)
	var panelRect = this.panel.getBoundingClientRect(),
		panelY = event.clientY - panelRect.top,
		// Map panel coordinates back to scroll-content coordinates
		contentY = (panelY - (this._translate || 0)) / this.scale + (this._contentTop || 0),
		clientH = this.scroller.clientHeight,
		topOffset = this._topOffset || 0,
		target = contentY - (clientH + topOffset) / 2;
	this.scrollTo(target);
};

MinimapWidget.prototype.onPointerMove = function(event) {
	if(!this.isDragging || (this.dragPointerId !== null && event.pointerId !== this.dragPointerId)) {
		return;
	}
	event.preventDefault();
	var travel = this._overlayTravel || 0,
		delta = event.clientY - this.dragStartY,
		newTop = Math.min(Math.max(0, this.dragStartTop + delta), travel),
		frac = travel > 0 ? newTop / travel : 0,
		clientH = this.scroller.clientHeight,
		// A fixed top toolbar shortens the usable viewport, and content lands that
		// much lower; mirror the overlay maths in updateView so dragging tracks it.
		topOffset = this._topOffset || 0,
		// Map the overlay's travel onto the scroll range covered by the elements
		contentTop = this._contentTop || 0,
		contentBottom = this._contentBottom || 0,
		scrollRange = Math.max(0, (contentBottom - contentTop) - (clientH - topOffset));
	this.scrollTo(contentTop + frac * scrollRange - topOffset);
};

MinimapWidget.prototype.onPointerUp = function(event) {
	if(!this.isDragging) {
		return;
	}
	if(event && this.dragPointerId !== null && event.pointerId !== this.dragPointerId) {
		return;
	}
	this.isDragging = false;
	if(this.panel.releasePointerCapture && this.dragPointerId !== null) {
		try {
			this.panel.releasePointerCapture(this.dragPointerId);
		} catch(e) {
			// Ignore - the pointer may already have been released
		}
	}
	this.dragPointerId = null;
	this.panel.classList.remove("tc-minimap-active");
};

MinimapWidget.prototype.scrollTo = function(top) {
	var maxScroll = Math.max(0, this.scroller.scrollHeight - this.scroller.clientHeight);
	this.scroller.scrollTop = Math.min(Math.max(0, top), maxScroll);
	// The scroll listener updates the view; update immediately too so dragging
	// feels responsive even if the scroll event is throttled.
	this.updateView();
};

/*
Selectively refreshes the widget if needed.
*/
MinimapWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.container || changedAttributes.scroller || changedAttributes.selector ||
		changedAttributes.width || changedAttributes.mode || changedAttributes["class"] ||
		changedAttributes.widthVariable || changedAttributes.scrollbarVariable ||
		changedAttributes.tooltips || changedAttributes.tooltipAttribute ||
		changedAttributes.blockBorder) {
		// Tear down listeners/observers first: refreshSelf() re-renders but does not
		// call destroy(), so they would otherwise leak (and keep firing).
		this.detachListeners();
		this.refreshSelf();
		return true;
	}
	return false;
};

/*
Remove all event listeners, observers and pending timers/frames. Used both by
onDestroy and before a refreshSelf() re-render - the base widget's refreshSelf()
does not call destroy(), so without this each re-render (e.g. on a settings
change) would leak the previous listeners and observers.
*/
MinimapWidget.prototype.detachListeners = function() {
	var win = this.getWindow();
	if(this.resolveRaf) {
		win.cancelAnimationFrame(this.resolveRaf);
		this.resolveRaf = null;
	}
	if(this.rebuildTimer) {
		win.clearTimeout(this.rebuildTimer);
		this.rebuildTimer = null;
	}
	if(this.scrollEventTarget) {
		this.scrollEventTarget.removeEventListener("scroll",this.boundScroll);
		this.scrollEventTarget = null;
	}
	if(this.panel) {
		this.panel.removeEventListener("pointerdown",this.boundPointerDown);
		this.panel.removeEventListener("pointermove",this.boundPointerMove);
		this.panel.removeEventListener("pointerup",this.boundPointerUp);
		this.panel.removeEventListener("pointercancel",this.boundPointerUp);
	}
	win.removeEventListener("resize",this.boundResize);
	if(this.resizeObserver) {
		this.resizeObserver.disconnect();
		this.resizeObserver = null;
	}
	if(this.scrollbarObserver) {
		this.scrollbarObserver.disconnect();
		this.scrollbarObserver = null;
	}
	if(this.mutationObserver) {
		this.mutationObserver.disconnect();
		this.mutationObserver = null;
	}
};

/*
Cleanup - called by the base widget's destroy().
*/
MinimapWidget.prototype.onDestroy = function() {
	this.publishWidth(true);
	this.publishScrollbarWidth(true);
	this.detachListeners();
};

exports.minimap = MinimapWidget;
