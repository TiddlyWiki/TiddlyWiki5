/*\
title: $:/core/modules/widgets/animatelayout.js
type: application/javascript
module-type: widget

Animates its children between layout positions. Where an element ends up is left entirely
to the browser; this only makes the journey visible.

The position of each keyed element is recorded before a refresh, compared with where the
browser put it afterwards, and the difference is played back as a transform. Since
transforms take no part in layout, the browser remains the sole authority on where things
go: any layout works, including wrapping grids of variable sized items, and the containing
element is the correct size at every frame rather than being animated towards it.

Only plays while a drag is in progress. Outside a drag the storyviews are already animating
insertions and removals, and two animations moving the same elements fight each other.

The list attribute names the tiddler whose reordering is being animated. Only a change to
that tiddler plays the animation: measuring is a forced layout of every keyed element, and
during a drag plenty of unrelated refreshes arrive that move nothing. Left blank, any
refresh plays, which is only useful when the ordering has no single tiddler behind it.

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

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
			positions[key] = {left: rect.left, top: rect.top};
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
			deltaY = previous.top - rect.top;
		if(Math.abs(deltaX) >= 0.5 || Math.abs(deltaY) >= 0.5) {
			moves.push({node: node, deltaX: deltaX, deltaY: deltaY});
		}
	});
	if(moves.length === 0) {
		return;
	}
	// Put everything back where it was
	$tw.utils.each(moves,function(move) {
		move.node.style.transition = "none";
		move.node.style.transform = "translate(" + move.deltaX + "px," + move.deltaY + "px)";
	});
	// Flush the inverted position so that it becomes the start of the transition
	$tw.utils.forceLayout(moves[0].node);
	// Release, and let the transition carry each element to where the browser put it
	$tw.utils.each(moves,function(move) {
		move.node.style.transition = "transform " + self.animateDuration + "ms " + self.animateEasing;
		move.node.style.transform = "";
	});
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
AnimateLayoutWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.key || changedAttributes.enable) {
		this.refreshSelf();
		return true;
	}
	this.animateList = this.getAttribute("list");
	this.animateDuration = parseInt(this.getAttribute("duration","400"),10) || 0;
	this.animateEasing = this.getAttribute("easing","ease-out");
	// Only animate while dragging, so that this does not compete with the storyview
	// animations that run when tiddlers are opened and closed normally, and only when the
	// list being reordered has actually changed, so that the other refreshes arriving
	// during a drag do not each pay for a measurement of every element
	if(!this.animateEnable || !this.animateDuration || !$tw.dragInProgress || !this.parentDomNode || !this.parentDomNode.querySelectorAll ||
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
