/*\
title: $:/core/modules/widgets/animatelayout.js
type: application/javascript
module-type: widget

Animates its children between layout positions. Where an element ends up is left to the
browser; the difference between where it was and where it now sits is played back as a
transform, which takes no part in layout

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

/*
An element can leave one of these widgets and arrive in another, and neither end sees more
than half of that journey. The two halves are gathered up here as each widget refreshes,
and are put together once every widget has had its turn
*/
var departures = Object.create(null),
	arrivals = [],
	handoffScheduled = false,
	// Every widget on the page, so that one losing an element can ask the others whether any of
	// them is about to gain it
	liveWidgets = [];

function scheduleHandoff() {
	if(handoffScheduled) {
		return;
	}
	handoffScheduled = true;
	// A microtask comes after the whole refresh, so that every widget has been heard from,
	// and before the browser paints, so that nothing is ever drawn in the wrong place first
	Promise.resolve().then(playHandoff);
}

function playHandoff() {
	var pending = arrivals,
		leaving = departures;
	handoffScheduled = false;
	arrivals = [];
	departures = Object.create(null);
	$tw.utils.each(pending,function(arrival) {
		var departure = arrival.widget.animateTravel && leaving[arrival.key];
		if(departure && !departure.claimed) {
			departure.claimed = true;
			arrival.widget.playTravel(arrival.key,arrival.node,departure.previous);
		} else {
			arrival.widget.playEnter(arrival.key,arrival.node);
		}
	});
	$tw.utils.each(leaving,function(departure,key) {
		if(!departure.claimed) {
			departure.widget.playExit(key,departure.previous);
		}
	});
}

var AnimateLayoutWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

AnimateLayoutWidget.prototype = new Widget();

AnimateLayoutWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	if(liveWidgets.indexOf(this) === -1) {
		liveWidgets.push(this);
	}
	this.computeAttributes();
	this.execute();
	this.makeChildWidgets();
	this.renderChildren(parent,nextSibling);
};

/*
The elements this widget is about to play the movement of, which are the ones that are not
really leaving the page: those staying in this list, wherever in it they end up, and those going
to another of these widgets. A storyview cannot tell any of them from a departure, and would
play them away, which both hides the movement and animates it twice over, so the storyviews are
asked to stand aside for these alone. Everything else, an element that has truly arrived or
truly gone, is left to the storyview. What is coming and going is read from the wiki rather than
from the page, so that the answer is the same whichever widget asks it and whichever of them has
already refreshed
*/
AnimateLayoutWidget.prototype.getMovingKeys = function(previousPositions,changedTiddlers) {
	var self = this,
		keys = [];
	if(!this.animateList) {
		return keys;
	}
	var staying = Object.create(null);
	$tw.utils.each($tw.wiki.getTiddlerList(this.animateList),function(title) {
		staying[title] = true;
	});
	$tw.utils.each(Object.keys(previousPositions),function(key) {
		// One that is still here has at most been reordered, which this widget plays itself.
		// The list widget makes such an element afresh rather than moving the one it has, so
		// the storyview sees it go and come back and would play both
		if(staying[key]) {
			keys.push(key);
			return;
		}
		if(!self.animateTravel) {
			return;
		}
		for(var t = 0; t < liveWidgets.length; t++) {
			var other = liveWidgets[t];
			// The other list has to be one that has just changed. The same tiddler can sit in
			// two lists at once, and one of them closing it says nothing about the other
			if(other !== self && other.animateTravel && other.animateList &&
				changedTiddlers[other.animateList] &&
				$tw.wiki.getTiddlerList(other.animateList).indexOf(key) !== -1) {
				keys.push(key);
				return;
			}
		}
	});
	return keys;
};

/*
Say, or stop saying, that this widget is playing the movement of these elements
*/
AnimateLayoutWidget.prototype.setMovingKeys = function(keys,moving) {
	if(keys.length === 0) {
		return;
	}
	$tw.animateLayoutMoving = $tw.animateLayoutMoving || Object.create(null);
	$tw.utils.each(keys,function(key) {
		var count = $tw.animateLayoutMoving[key] || 0;
		count += moving ? 1 : -1;
		if(count > 0) {
			$tw.animateLayoutMoving[key] = count;
		} else {
			delete $tw.animateLayoutMoving[key];
		}
	});
};

AnimateLayoutWidget.prototype.execute = function() {
	this.animateKey = this.getAttribute("key","data-animate-key");
	this.animateList = this.getAttribute("list");
	this.animateDuration = parseInt(this.getAttribute("duration","400"),10) || 0;
	this.animateEasing = this.getAttribute("easing","ease-out");
	this.animateEnable = this.getAttribute("enable","yes") === "yes";
	this.animateReducedMotion = this.getAttribute("reducedmotion","respect");
	this.animateScale = this.getAttribute("scale","no") === "yes";
	this.animateEnter = this.getAttribute("enter","no") === "yes";
	this.animateExit = this.getAttribute("exit","no") === "yes";
	this.animateTravel = this.getAttribute("travel","no") === "yes";
	this.makeChildWidgets();
};

AnimateLayoutWidget.prototype.getAnimatedNodes = function() {
	if(!this.parentDomNode || !this.parentDomNode.querySelectorAll) {
		return [];
	}
	var self = this,
		nodes = [];
	$tw.utils.each(this.parentDomNode.querySelectorAll("[" + this.animateKey + "]"),function(node) {
		if(node.getAttribute("data-animate-detached") === "yes" ||
			node.getAttribute("data-animate-leaving") === "yes") {
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
		remember = this.animateExit || this.animateTravel,
		positions = Object.create(null);
	$tw.utils.each(this.getAnimatedNodes(),function(node) {
		var key = node.getAttribute(self.animateKey);
		if(key) {
			var rect = node.getBoundingClientRect();
			positions[key] = {left: rect.left, top: rect.top, width: rect.width, height: rect.height};
			if(remember) {
				// A node that goes leaves nothing behind to measure, so the place it stands in is
				// taken down here, while it still stands in one. The layout has just been worked
				// out for the rectangle above, so asking for the offsets as well costs nothing
				positions[key].node = node;
				positions[key].parent = node.parentNode;
				positions[key].nextSibling = node.nextSibling;
				positions[key].offsets = {left: node.offsetLeft, top: node.offsetTop,
					width: node.offsetWidth, height: node.offsetHeight};
			}
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

/*
Work out the journey a node has made, or nothing if it has stayed where it was
*/
AnimateLayoutWidget.prototype.getMove = function(node,previous) {
	var key = node.getAttribute(this.animateKey);
	// A node a storyview is bringing in is being played already, and is left to it
	if(!key || !previous || node.getAttribute("data-animate-entering") === "yes") {
		return null;
	}
	var rect = node.getBoundingClientRect(),
		deltaX = previous.left - rect.left,
		deltaY = previous.top - rect.top,
		scaleX = 1,
		scaleY = 1;
	if(this.animateScale && rect.width > 0 && rect.height > 0 && previous.width > 0 && previous.height > 0) {
		scaleX = previous.width / rect.width;
		scaleY = previous.height / rect.height;
	}
	if(Math.abs(deltaX) >= 0.5 || Math.abs(deltaY) >= 0.5 ||
		Math.abs(scaleX - 1) >= 0.005 || Math.abs(scaleY - 1) >= 0.005) {
		return {node: node, key: key, deltaX: deltaX, deltaY: deltaY, scaleX: scaleX, scaleY: scaleY,
			held: this.getHeldNodes(node)};
	}
	return null;
};

/*
Put a node back where it came from, without the browser being any the wiser
*/
AnimateLayoutWidget.prototype.startMove = function(move) {
	move.node.style.transition = "none";
	move.node.style.transformOrigin = "0 0";
	move.node.style.transform = "translate(" + move.deltaX + "px," + move.deltaY + "px) scale(" + move.scaleX + "," + move.scaleY + ")";
	$tw.utils.each(move.held,function(held) {
		held.style.transition = "none";
		held.style.transformOrigin = "0 0";
		held.style.transform = "scale(" + (1 / move.scaleX) + "," + (1 / move.scaleY) + ") translate(" + (-move.deltaX) + "px," + (-move.deltaY) + "px)";
	});
};

/*
Let it travel from there to where it now sits
*/
AnimateLayoutWidget.prototype.endMove = function(move) {
	var self = this;
	move.node.style.transition = "transform " + this.animateDuration + "ms " + this.animateEasing;
	move.node.style.transform = "";
	$tw.utils.each(move.held,function(held) {
		held.style.transition = "transform " + self.animateDuration + "ms " + self.animateEasing;
		held.style.transform = "";
	});
	this.markMoving(move.node,move.key);
};

AnimateLayoutWidget.prototype.play = function(previousPositions) {
	var self = this,
		nodes = this.getAnimatedNodes(),
		moves = [];
	if(nodes.length === 0) {
		return;
	}
	$tw.utils.each(nodes,function(node) {
		// Only what this widget has been animating is put back: a node that a storyview has just
		// set going is left to it, since clearing it here would stop it before it started
		if(node.classList && node.classList.contains("tc-animatelayout-moving")) {
			node.style.transition = "";
			node.style.transform = "";
		}
	});
	$tw.utils.each(this.getHeldNodes(this.parentDomNode),function(held) {
		held.style.transition = "";
		held.style.transform = "";
	});
	$tw.utils.each(nodes,function(node) {
		var move = self.getMove(node,previousPositions[node.getAttribute(self.animateKey)]);
		if(move) {
			moves.push(move);
		}
	});
	if(moves.length === 0) {
		return;
	}
	$tw.utils.each(moves,function(move) {
		self.startMove(move);
	});
	$tw.utils.forceLayout(moves[0].node);
	$tw.utils.each(moves,function(move) {
		self.endMove(move);
	});
};

/*
Note what has come and gone in this refresh. Where an element has gone somewhere else on the
page, the widget losing it and the widget gaining it each see only their own half, so both
halves are handed over to be put together once every widget has refreshed
*/
AnimateLayoutWidget.prototype.playComingsAndGoings = function(previousPositions) {
	var self = this,
		present = Object.create(null);
	$tw.utils.each(this.getAnimatedNodes(),function(node) {
		var key = node.getAttribute(self.animateKey);
		if(key) {
			present[key] = true;
			// Something that is back is no longer on its way out
			self.cancelExit(key);
			if((self.animateTravel || self.animateEnter) && !previousPositions[key]) {
				arrivals.push({widget: self, key: key, node: node});
				scheduleHandoff();
			}
		}
	});
	$tw.utils.each(previousPositions,function(previous,key) {
		if(present[key]) {
			return;
		}
		if(self.animateTravel) {
			// Hold the departure back until every widget has had its turn, in case one of them
			// is where this is going
			departures[key] = {widget: self, previous: previous};
			scheduleHandoff();
		} else {
			self.playExit(key,previous);
		}
	});
};

/*
Play an element that has gone for good. It is put back where it stood, out of the flow so that
what surrounds it has already closed over the space, and a stylesheet says how it goes
*/
AnimateLayoutWidget.prototype.playExit = function(key,previous) {
	var self = this,
		node = previous.node,
		parent = previous.parent,
		doc = node && node.ownerDocument;
	if(!this.animateExit || !doc || !previous.offsets || !node.setAttribute) {
		return;
	}
	// A node that is still on the page has moved somewhere else rather than gone
	if(doc.contains(node)) {
		return;
	}
	// The place it stood in has to still be there for it to be put back into
	if(!parent || !doc.contains(parent)) {
		return;
	}
	var nextSibling = previous.nextSibling && previous.nextSibling.parentNode === parent ? previous.nextSibling : null;
	parent.insertBefore(node,nextSibling);
	$tw.utils.detachFromFlow(node,previous.offsets);
	if(node.style.setProperty) {
		node.style.setProperty("--tc-animatelayout-exit-duration",this.animateDuration + "ms");
		node.style.setProperty("--tc-animatelayout-exit-easing",this.animateEasing);
	}
	// The node has only just been put back, so it needs a layout of its own to depart from
	$tw.utils.forceLayout(node);
	if(node.classList) {
		node.classList.add("tc-animatelayout-leaving");
	}
	this.leavingNodes = this.leavingNodes || Object.create(null);
	this.leavingNodes[key] = {
		node: node,
		timer: setTimeout(function() {
			self.cancelExit(key);
		},this.animateDuration)
	};
};

/*
Take away a node that was on its way out, either because it has now gone or because it is back
*/
AnimateLayoutWidget.prototype.cancelExit = function(key) {
	var leaving = this.leavingNodes && this.leavingNodes[key];
	if(!leaving) {
		return;
	}
	delete this.leavingNodes[key];
	clearTimeout(leaving.timer);
	if(leaving.node.parentNode) {
		leaving.node.parentNode.removeChild(leaving.node);
	}
};

/*
Play an element that has arrived here from another widget. The element that has arrived waits
its turn out of sight, while the one that set out flies across the page to meet it. The
traveller is carried by the document itself, so that neither place it belongs to can clip it
*/
AnimateLayoutWidget.prototype.playTravel = function(key,node,previous) {
	var self = this,
		ghost = previous.node,
		doc = node.ownerDocument;
	// Without the element that set out there is nothing to fly, so the arrival is played out
	// where it has landed, which is all that can be done anyway
	if(!ghost || !doc || !doc.body || doc.contains(ghost) || !ghost.style) {
		if(!this.playArrival(node,previous)) {
			this.playEnter(key,node);
		}
		return;
	}
	// The element that has arrived is already laid out where it is going, so the size it will
	// have there is there to be read rather than guessed at
	var rect = node.getBoundingClientRect(),
		deltaX = rect.left - previous.left,
		deltaY = rect.top - previous.top,
		resizes = Math.abs(rect.width - previous.width) >= 0.5 || Math.abs(rect.height - previous.height) >= 0.5,
		transition = "transform " + this.animateDuration + "ms " + this.animateEasing;
	if(resizes) {
		// A traveller is out of the flow, where its size is nobody else's business, so it is
		// given the width and height it is going to have rather than being scaled into them.
		// Its content is laid out at each size it passes through, as it will be on arrival
		transition += ", width " + this.animateDuration + "ms " + this.animateEasing +
			", height " + this.animateDuration + "ms " + this.animateEasing;
	}
	doc.body.appendChild(ghost);
	ghost.setAttribute("data-animate-detached","yes");
	$tw.utils.setStyle(ghost,[
		{width: previous.width + "px"},
		{height: previous.height + "px"},
		{left: previous.left + "px"},
		{top: previous.top + "px"},
		{margin: "0"},
		{position: "fixed"},
		{"z-index": "500"},
		{"pointer-events": "none"},
		{transition: "none"},
		{"transform-origin": "0 0"},
		{transform: "none"}
	]);
	if(ghost.classList) {
		ghost.classList.add("tc-animatelayout-travelling");
	}
	node.style.visibility = "hidden";
	$tw.utils.forceLayout(ghost);
	var arrival = [
		{transition: transition},
		{transform: "translate(" + deltaX + "px," + deltaY + "px)"}
	];
	if(resizes) {
		arrival.push({width: rect.width + "px"});
		arrival.push({height: rect.height + "px"});
	}
	$tw.utils.setStyle(ghost,arrival);
	this.travellingNodes = this.travellingNodes || Object.create(null);
	this.finishTravel(key);
	this.travellingNodes[key] = {
		ghost: ghost,
		node: node,
		timer: setTimeout(function() {
			self.finishTravel(key);
		},this.animateDuration)
	};
};

/*
Play an element that has arrived here without anything to fly in with, from where it was to
where it now sits. Returns whether there was a journey to play at all
*/
AnimateLayoutWidget.prototype.playArrival = function(node,previous) {
	var move = this.getMove(node,previous);
	if(!move) {
		return false;
	}
	this.startMove(move);
	$tw.utils.forceLayout(move.node);
	this.endMove(move);
	return true;
};

/*
Play an element that has appeared here, having been nowhere before. There is no journey to make,
so the element is only marked for as long as it is coming in, and a stylesheet says how it
arrives. What was already here is moved aside by the ordinary means, so an entrance never has to
concern itself with anything but the element making it
*/
AnimateLayoutWidget.prototype.playEnter = function(key,node) {
	var self = this;
	if(!this.animateEnter || !node.classList || !node.style) {
		return;
	}
	this.cancelEnter(key);
	if(node.style.setProperty) {
		node.style.setProperty("--tc-animatelayout-enter-duration",this.animateDuration + "ms");
	}
	node.classList.add("tc-animatelayout-entering");
	this.enteringNodes = this.enteringNodes || Object.create(null);
	this.enteringNodes[key] = {
		node: node,
		timer: setTimeout(function() {
			self.cancelEnter(key);
		},this.animateDuration)
	};
};

/*
Let go of an element that has finished coming in
*/
AnimateLayoutWidget.prototype.cancelEnter = function(key) {
	var entering = this.enteringNodes && this.enteringNodes[key];
	if(!entering) {
		return;
	}
	delete this.enteringNodes[key];
	clearTimeout(entering.timer);
	if(entering.node.classList) {
		entering.node.classList.remove("tc-animatelayout-entering");
	}
	if(entering.node.style && entering.node.style.removeProperty) {
		entering.node.style.removeProperty("--tc-animatelayout-enter-duration");
		entering.node.style.removeProperty("--tc-animatelayout-enter-easing");
	}
};

/*
Take away a traveller that has arrived, and let what it was carrying be seen again
*/
AnimateLayoutWidget.prototype.finishTravel = function(key) {
	var travelling = this.travellingNodes && this.travellingNodes[key];
	if(!travelling) {
		return;
	}
	delete this.travellingNodes[key];
	clearTimeout(travelling.timer);
	if(travelling.ghost.parentNode) {
		travelling.ghost.parentNode.removeChild(travelling.ghost);
	}
	travelling.node.style.visibility = "";
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

AnimateLayoutWidget.prototype.onDestroy = function() {
	var self = this;
	$tw.utils.each(this.movingTimers,function(timer) {
		clearTimeout(timer);
	});
	this.movingTimers = null;
	$tw.utils.each(Object.keys(this.enteringNodes || {}),function(key) {
		self.cancelEnter(key);
	});
	$tw.utils.each(Object.keys(this.leavingNodes || {}),function(key) {
		self.cancelExit(key);
	});
	$tw.utils.each(Object.keys(this.travellingNodes || {}),function(key) {
		self.finishTravel(key);
	});
	var index = liveWidgets.indexOf(this);
	if(index !== -1) {
		liveWidgets.splice(index,1);
	}
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
	this.animateEnter = this.getAttribute("enter","no") === "yes";
	this.animateExit = this.getAttribute("exit","no") === "yes";
	this.animateTravel = this.getAttribute("travel","no") === "yes";
	var suppressed = !this.animateEnable || !this.animateDuration ||
		(this.animateReducedMotion === "respect" && $tw.utils.prefersReducedMotion());
	if(suppressed || !this.parentDomNode || !this.parentDomNode.querySelectorAll ||
		(this.animateList && !changedTiddlers[this.animateList])) {
		return this.refreshChildren(changedTiddlers);
	}
	var previousPositions = this.measure(),
		moving = this.getMovingKeys(previousPositions,changedTiddlers),
		hasRefreshed;
	this.setMovingKeys(moving,true);
	try {
		hasRefreshed = this.refreshChildren(changedTiddlers);
	} finally {
		this.setMovingKeys(moving,false);
	}
	if(hasRefreshed) {
		this.play(previousPositions);
		if(this.animateEnter || this.animateExit || this.animateTravel) {
			this.playComingsAndGoings(previousPositions);
		}
	}
	return hasRefreshed;
};

exports.animatelayout = AnimateLayoutWidget;
