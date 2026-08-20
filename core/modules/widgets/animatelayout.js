/*\
title: $:/core/modules/widgets/animatelayout.js
type: application/javascript
module-type: widget

Animates its children between layout positions. Where an element ends up is left to the
browser; the difference between where it was and where it now is is played back as a
transform, which takes no part in layout

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

AnimateLayoutWidget.prototype = new Widget();

AnimateLayoutWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.makeChildWidgets();
	this.renderChildren(parent,nextSibling);
};

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

AnimateLayoutWidget.prototype.getAnimatedNodes = function() {
	if(!this.parentDomNode || !this.parentDomNode.querySelectorAll) {
		return [];
	}
	var self = this,
		nodes = [];
	$tw.utils.each(this.parentDomNode.querySelectorAll("[" + this.animateKey + "]"),function(node) {
		if(node.getAttribute("data-animate-detached") === "yes") {
			return;
		}
		for(var parent = node.parentNode; parent && parent !== self.parentDomNode; parent = parent.parentNode) {
			if(parent.hasAttribute && parent.hasAttribute(self.animateKey)) {
				return;
			}
		}
		nodes.push(node);
	});
	return nodes;
};

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

AnimateLayoutWidget.prototype.getHeldNodes = function(node) {
	var nodes = [];
	if(node.querySelectorAll) {
		$tw.utils.each(node.querySelectorAll("[data-animate-hold]"),function(held) {
			nodes.push(held);
		});
	}
	return nodes;
};

AnimateLayoutWidget.prototype.play = function(previousPositions) {
	var self = this,
		nodes = this.getAnimatedNodes(),
		moves = [];
	if(nodes.length === 0) {
		return;
	}
	$tw.utils.each(nodes,function(node) {
		node.style.transition = "";
		node.style.transform = "";
	});
	$tw.utils.each(this.getHeldNodes(this.parentDomNode),function(held) {
		held.style.transition = "";
		held.style.transform = "";
	});
	$tw.utils.each(nodes,function(node) {
		var key = node.getAttribute(self.animateKey);
		if(!key) {
			return;
		}
		var previous = previousPositions[key];
		if(!previous) {
			return;
		}
		var rect = node.getBoundingClientRect(),
			deltaX = previous.left - rect.left,
			deltaY = previous.top - rect.top,
			scaleX = 1,
			scaleY = 1;
		if(self.animateScale && rect.width > 0 && rect.height > 0 && previous.width > 0 && previous.height > 0) {
			scaleX = previous.width / rect.width;
			scaleY = previous.height / rect.height;
		}
		if(Math.abs(deltaX) >= 0.5 || Math.abs(deltaY) >= 0.5 ||
			Math.abs(scaleX - 1) >= 0.005 || Math.abs(scaleY - 1) >= 0.005) {
			moves.push({node: node, key: key, deltaX: deltaX, deltaY: deltaY, scaleX: scaleX, scaleY: scaleY,
				held: self.getHeldNodes(node)});
		}
	});
	if(moves.length === 0) {
		return;
	}
	$tw.utils.each(moves,function(move) {
		move.node.style.transition = "none";
		move.node.style.transformOrigin = "0 0";
		move.node.style.transform = "translate(" + move.deltaX + "px," + move.deltaY + "px) scale(" + move.scaleX + "," + move.scaleY + ")";
		$tw.utils.each(move.held,function(held) {
			held.style.transition = "none";
			held.style.transformOrigin = "0 0";
			held.style.transform = "scale(" + (1 / move.scaleX) + "," + (1 / move.scaleY) + ") translate(" + (-move.deltaX) + "px," + (-move.deltaY) + "px)";
		});
	});
	$tw.utils.forceLayout(moves[0].node);
	$tw.utils.each(moves,function(move) {
		move.node.style.transition = "transform " + self.animateDuration + "ms " + self.animateEasing;
		move.node.style.transform = "";
		$tw.utils.each(move.held,function(held) {
			held.style.transition = "transform " + self.animateDuration + "ms " + self.animateEasing;
			held.style.transform = "";
		});
		self.markMoving(move.node,move.key);
	});
};

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

AnimateLayoutWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.key) {
		this.refreshSelf();
		return true;
	}
	this.animateList = this.getAttribute("list");
	this.animateDuration = parseInt(this.getAttribute("duration","400"),10) || 0;
	this.animateEasing = this.getAttribute("easing","ease-out");
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
