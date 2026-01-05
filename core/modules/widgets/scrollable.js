/*\
title: $:/core/modules/widgets/scrollable.js
type: application/javascript
module-type: widget

Scrollable widget

\*/

"use strict";

var DEBOUNCE_INTERVAL = 100; // Delay after last scroll event before updating the bound tiddler

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var ScrollableWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
ScrollableWidget.prototype = new Widget();

ScrollableWidget.prototype.cancelScroll = function() {
	if(this.idRequestFrame) {
		this.cancelAnimationFrame.call(window,this.idRequestFrame);
		this.idRequestFrame = null;
	}
};

/*
Handle a scroll event
*/
ScrollableWidget.prototype.handleScrollEvent = function(event) {
	// Pass the scroll event through if our offsetsize is larger than our scrollsize
	if(this.outerDomNode.scrollWidth <= this.outerDomNode.offsetWidth && this.outerDomNode.scrollHeight <= this.outerDomNode.offsetHeight && this.fallthrough === "yes") {
		return true;
	}
	var options = {};
	if($tw.utils.hop(event.paramObject,"animationDuration")) {
		options.animationDuration = event.paramObject.animationDuration;
	}
	if(event.paramObject && event.paramObject.selector) {
		this.scrollSelectorIntoView(null,event.paramObject.selector,null,options);
	} else {
		this.scrollIntoView(event.target,null,options);
	}
	return false; // Handled event
};

/*
Scroll an element into view
*/
ScrollableWidget.prototype.scrollIntoView = function(element,callback,options) {
	var duration = $tw.utils.hop(options,"animationDuration") ? parseInt(options.animationDuration) : $tw.utils.getAnimationDuration(),
		srcWindow = element ? element.ownerDocument.defaultView : window;
	this.cancelScroll();
	this.startTime = Date.now();
	var scrollPosition = {
		x: this.outerDomNode.scrollLeft,
		y: this.outerDomNode.scrollTop
	};
	// Get the client bounds of the element and adjust by the scroll position
	var scrollableBounds = this.outerDomNode.getBoundingClientRect(),
		clientTargetBounds = element.getBoundingClientRect(),
		bounds = {
			left: clientTargetBounds.left + scrollPosition.x - scrollableBounds.left,
			top: clientTargetBounds.top + scrollPosition.y - scrollableBounds.top,
			width: clientTargetBounds.width,
			height: clientTargetBounds.height
		};
	// We'll consider the horizontal and vertical scroll directions separately via this function
	var getEndPos = function(targetPos,targetSize,currentPos,currentSize) {
			// If the target is already visible then stay where we are
			if(targetPos >= currentPos && (targetPos + targetSize) <= (currentPos + currentSize)) {
				return currentPos;
			// If the target is above/left of the current view, then scroll to its top/left
			} else if(targetPos <= currentPos) {
				return targetPos;
			// If the target is smaller than the window and the scroll position is too far up, then scroll till the target is at the bottom of the window
			} else if(targetSize < currentSize && currentPos < (targetPos + targetSize - currentSize)) {
				return targetPos + targetSize - currentSize;
			// If the target is big, then just scroll to the top
			} else if(currentPos < targetPos) {
				return targetPos;
			// Otherwise, stay where we are
			} else {
				return currentPos;
			}
		},
		endX = getEndPos(bounds.left,bounds.width,scrollPosition.x,this.outerDomNode.offsetWidth),
		endY = getEndPos(bounds.top,bounds.height,scrollPosition.y,this.outerDomNode.offsetHeight);
	// Only scroll if necessary
	if(endX !== scrollPosition.x || endY !== scrollPosition.y) {
		var self = this,
			drawFrame;
		drawFrame = function () {
			var t;
			if(duration <= 0) {
				t = 1;
			} else {
				t = ((Date.now()) - self.startTime) / duration;
			}
			if(t >= 1) {
				self.cancelScroll();
				t = 1;
			}
			t = $tw.utils.slowInSlowOut(t);
			self.outerDomNode.scrollLeft = scrollPosition.x + (endX - scrollPosition.x) * t;
			self.outerDomNode.scrollTop = scrollPosition.y + (endY - scrollPosition.y) * t;
			if(t < 1) {
				self.idRequestFrame = self.requestAnimationFrame.call(srcWindow,drawFrame);
			}
		};
		drawFrame();
	}
};

ScrollableWidget.prototype.scrollSelectorIntoView = function(baseElement,selector,callback,options) {
	baseElement = baseElement || document;
	var element = $tw.utils.querySelectorSafe(selector,baseElement);
	if(element) {
		this.scrollIntoView(element,callback,options);
	}
};

/*
Render this widget into the DOM
*/
ScrollableWidget.prototype.render = function(parent,nextSibling) {
	var self = this;
	this.scaleFactor = 1;
	this.addEventListeners([
		{type: "tm-scroll", handler: "handleScrollEvent"}
	]);
	if($tw.browser) {
		this.requestAnimationFrame = window.requestAnimationFrame ||
			window.webkitRequestAnimationFrame ||
			window.mozRequestAnimationFrame ||
			function(callback) {
				return window.setTimeout(callback, 1000/60);
			};
		this.cancelAnimationFrame = window.cancelAnimationFrame ||
			window.webkitCancelAnimationFrame ||
			window.webkitCancelRequestAnimationFrame ||
			window.mozCancelAnimationFrame ||
			window.mozCancelRequestAnimationFrame ||
			function(id) {
				window.clearTimeout(id);
			};
	}
	// Remember parent
	this.parentDomNode = parent;
	// Compute attributes and execute state
	this.computeAttributes();
	this.execute();
	// Create elements
	this.outerDomNode = this.document.createElement("div");
	$tw.utils.setStyle(this.outerDomNode,[
		{overflowY: "auto"},
		{overflowX: "auto"},
		{webkitOverflowScrolling: "touch"}
	]);
	this.innerDomNode = this.document.createElement("div");
	this.outerDomNode.appendChild(this.innerDomNode);
	// Assign classes
	this.outerDomNode.className = this["class"] || "";
	// Insert element
	parent.insertBefore(this.outerDomNode,nextSibling);
	this.renderChildren(this.innerDomNode,null);
	this.domNodes.push(this.outerDomNode);
	// If the scroll position is bound to a tiddler
	if(this.scrollableBind) {
		// After a delay for rendering, scroll to the bound position
		this.updateScrollPositionFromBoundTiddler();
		// Set up event listener
		this.currentListener = this.listenerFunction.bind(this);
		this.outerDomNode.addEventListener("scroll", this.currentListener);
	}
};

ScrollableWidget.prototype.listenerFunction = function(event) {
	var self = this;
	clearTimeout(this.timeout);
	this.timeout = setTimeout(function() {
		var existingTiddler = self.wiki.getTiddler(self.scrollableBind),
			newTiddlerFields = {
				title: self.scrollableBind,
				"scroll-left": self.outerDomNode.scrollLeft.toString(),
				"scroll-top": self.outerDomNode.scrollTop.toString()
			};
		if(!existingTiddler || (existingTiddler.fields["title"] !== newTiddlerFields["title"]) || (existingTiddler.fields["scroll-left"] !== newTiddlerFields["scroll-left"] || existingTiddler.fields["scroll-top"] !== newTiddlerFields["scroll-top"])) {
			self.wiki.addTiddler(new $tw.Tiddler(existingTiddler,newTiddlerFields));
		}
	}, DEBOUNCE_INTERVAL);
}

ScrollableWidget.prototype.updateScrollPositionFromBoundTiddler = function() {
	// Bail if we're running on the fakedom
	if(!this.outerDomNode.scrollTo) {
		return;
	}
	var tiddler = this.wiki.getTiddler(this.scrollableBind);
	if(tiddler) {
		var scrollLeftTo = this.outerDomNode.scrollLeft;
		if(parseFloat(tiddler.fields["scroll-left"]).toString() === tiddler.fields["scroll-left"]) {
			scrollLeftTo = parseFloat(tiddler.fields["scroll-left"]);
		}
		var scrollTopTo = this.outerDomNode.scrollTop;
		if(parseFloat(tiddler.fields["scroll-top"]).toString() === tiddler.fields["scroll-top"]) {
			scrollTopTo = parseFloat(tiddler.fields["scroll-top"]);
		}
		this.outerDomNode.scrollTo({
			top: scrollTopTo,
			left: scrollLeftTo,
			behavior: "instant"
		})
	}
};

/*
Compute the internal state of the widget
*/
ScrollableWidget.prototype.execute = function() {
	// Get attributes
	this.scrollableBind = this.getAttribute("bind");
	this.fallthrough = this.getAttribute("fallthrough","yes");
	this["class"] = this.getAttribute("class");
	// Make child widgets
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
ScrollableWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes["class"]) {
		this.refreshSelf();
		return true;
	}
	// If the bound tiddler has changed, update the eventListener and update scroll position
	if(changedAttributes["bind"]) {
		if(this.currentListener) {
			this.outerDomNode.removeEventListener("scroll", this.currentListener, false);
		}
		this.scrollableBind = this.getAttribute("bind");
		this.currentListener = this.listenerFunction.bind(this);
		this.outerDomNode.addEventListener("scroll", this.currentListener);
	}
	// Refresh children
	var result = this.refreshChildren(changedTiddlers);
	// If the bound tiddler has changed, update scroll position
	if(changedAttributes["bind"] || changedTiddlers[this.getAttribute("bind")]) {
		this.updateScrollPositionFromBoundTiddler();
	}
	return result;
};

exports.scrollable = ScrollableWidget;
