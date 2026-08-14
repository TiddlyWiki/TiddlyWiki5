/*\
title: $:/core/modules/widgets/animatelayout.js
type: application/javascript
module-type: widget

Animates its children between layout positions. Where an element ends up is left entirely
to the browser; this only makes the journey visible.

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var reducedMotionQuery;

function prefersReducedMotion() {
	if(!$tw.browser || !window.matchMedia) {
		return false;
	}
	reducedMotionQuery = reducedMotionQuery || window.matchMedia("(prefers-reduced-motion: reduce)");
	return reducedMotionQuery.matches;
}

var AnimateLayoutWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
AnimateLayoutWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
AnimateLayoutWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.makeChildWidgets();
	this.renderChildren(parent,nextSibling);
};

/*
Compute the internal state of the widget
*/
AnimateLayoutWidget.prototype.execute = function() {
	this.animateKey = this.getAttribute("key","data-animate-key");
	this.animateList = this.getAttribute("list");
	this.animateDuration = parseInt(this.getAttribute("duration","400"),10) || 0;
	this.animateEasing = this.getAttribute("easing","ease-out");
	this.animateEnable = this.getAttribute("enable","yes") === "yes";
	this.animateReducedMotion = this.getAttribute("reducedmotion","respect");
	this.animateScale = this.getAttribute("scale","no") === "yes";
	this.makeChildWidgets();
};

/*
Collect the elements taking part, identified by their key attribute
*/
AnimateLayoutWidget.prototype.getAnimatedNodes = function() {
	if(!this.parentDomNode || !this.parentDomNode.querySelectorAll) {
		return [];
	}
	var nodes = [];
	$tw.utils.each(this.parentDomNode.querySelectorAll("[" + this.animateKey + "]"),function(node) {
		nodes.push(node);
	});
	return nodes;
};

/*
Record where every keyed element currently appears on screen. getBoundingClientRect
reports the visual box, so an element part way through an earlier animation is recorded
where it actually is, which is what makes interrupted animations continue smoothly
*/
AnimateLayoutWidget.prototype.measure = function() {
	var self = this,
		positions = Object.create(null);
	$tw.utils.each(this.getAnimatedNodes(),function(node) {
		var key = node.getAttribute(self.animateKey);
		if(key) {
			var rect = node.getBoundingClientRect();
			positions[key] = {left: rect.left, top: rect.top, width: rect.width, height: rect.height};
		}
	});
	return positions;
};

/*
Play the difference between the recorded positions and the current ones
*/
AnimateLayoutWidget.prototype.play = function(previousPositions) {
	var self = this,
		nodes = this.getAnimatedNodes(),
		moves = [];
	if(nodes.length === 0) {
		return;
	}
	// Drop any transform left over from an earlier animation, so that the measurement
	// below is of the position the browser has chosen rather than of a transformed one
	$tw.utils.each(nodes,function(node) {
		node.style.transition = "";
		node.style.transform = "";
	});
	// Measure every element before moving any of them
	$tw.utils.each(nodes,function(node) {
		var key = node.getAttribute(self.animateKey);
		if(!key) {
			return;
		}
		var previous = previousPositions[key];
		if(!previous) {
			// Newly present, so there is no previous position to travel from
			return;
		}
		var rect = node.getBoundingClientRect(),
			deltaX = previous.left - rect.left,
			deltaY = previous.top - rect.top,
			scaleX = 1,
			scaleY = 1;
		if(self.animateScale && rect.width > 0 && rect.height > 0) {
			scaleX = previous.width / rect.width;
			scaleY = previous.height / rect.height;
		}
		if(Math.abs(deltaX) >= 0.5 || Math.abs(deltaY) >= 0.5 ||
			Math.abs(scaleX - 1) >= 0.005 || Math.abs(scaleY - 1) >= 0.005) {
			moves.push({node: node, key: key, deltaX: deltaX, deltaY: deltaY, scaleX: scaleX, scaleY: scaleY});
		}
	});
	if(moves.length === 0) {
		return;
	}
	// Put everything back where it was. The corner the deltas were measured from is the
	// corner the transform has to grow from, or a scaled element would travel to the wrong
	// place
	$tw.utils.each(moves,function(move) {
		move.node.style.transition = "none";
		move.node.style.transformOrigin = "0 0";
		move.node.style.transform = "translate(" + move.deltaX + "px," + move.deltaY + "px) scale(" + move.scaleX + "," + move.scaleY + ")";
	});
	// Flush the inverted position so that it becomes the start of the transition
	$tw.utils.forceLayout(moves[0].node);
	// Release, and let the transition carry each element to where the browser put it
	$tw.utils.each(moves,function(move) {
		move.node.style.transition = "transform " + self.animateDuration + "ms " + self.animateEasing;
		move.node.style.transform = "";
		self.markMoving(move.node,move.key);
	});
};

/*
Carry a class for as long as an element is travelling, so that a stylesheet can say how a
moving element should look. An element caught by a second change part way through its
journey keeps the class until that later journey ends rather than the earlier one
*/
AnimateLayoutWidget.prototype.markMoving = function(node,key) {
	var self = this;
	if(!node.classList) {
		return;
	}
	this.movingTimers = this.movingTimers || Object.create(null);
	node.classList.add("tc-animatelayout-moving");
	if(this.movingTimers[key]) {
		clearTimeout(this.movingTimers[key]);
	}
	this.movingTimers[key] = setTimeout(function() {
		delete self.movingTimers[key];
		node.classList.remove("tc-animatelayout-moving");
	},this.animateDuration);
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
AnimateLayoutWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.key) {
		this.refreshSelf();
		return true;
	}
	this.animateList = this.getAttribute("list");
	this.animateDuration = parseInt(this.getAttribute("duration","400"),10) || 0;
	this.animateEasing = this.getAttribute("easing","ease-out");
	// Read enable here rather than rebuilding the children when it changes, so that it can
	// be a condition that is asked on each refresh: whoever uses this widget decides which
	// changes are worth animating. Play only when the list being reordered has actually
	// changed, so that the other refreshes arriving during a drag do not each pay for a
	// measurement of every element
	this.animateEnable = this.getAttribute("enable","yes") === "yes";
	this.animateReducedMotion = this.getAttribute("reducedmotion","respect");
	this.animateScale = this.getAttribute("scale","no") === "yes";
	var suppressed = !this.animateEnable || !this.animateDuration ||
		(this.animateReducedMotion === "respect" && prefersReducedMotion());
	if(suppressed || !this.parentDomNode || !this.parentDomNode.querySelectorAll ||
		(this.animateList && !changedTiddlers[this.animateList])) {
		return this.refreshChildren(changedTiddlers);
	}
	var previousPositions = this.measure(),
		hasRefreshed = this.refreshChildren(changedTiddlers);
	if(hasRefreshed) {
		this.play(previousPositions);
	}
	return hasRefreshed;
};

exports.animatelayout = AnimateLayoutWidget;
