/*\
title: $:/core/modules/widgets/reveal.js
type: application/javascript
module-type: widget

Reveal widget

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var Popup = require("$:/core/modules/utils/dom/popup.js");

var RevealWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
RevealWidget.prototype = new Widget();

var POPUP_POSITION_OPPOSITES = {
	left: "right",
	right: "left",
	above: "below",
	below: "above",
	aboveleft: "belowleft",
	aboveright: "belowright",
	belowleft: "aboveleft",
	belowright: "aboveright"
};

const POPUP_AUTO_POSITION_PADDING = 5;

function getViewportMetrics() {
	const win = typeof window !== "undefined" ? window
		: (typeof global !== "undefined" ? global.window : undefined);
	return {
		innerWidth: (win && typeof win.innerWidth === "number") ? win.innerWidth : 1024,
		innerHeight: (win && typeof win.innerHeight === "number") ? win.innerHeight : 768,
		pageXOffset: (win && typeof win.pageXOffset === "number") ? win.pageXOffset : 0,
		pageYOffset: (win && typeof win.pageYOffset === "number") ? win.pageYOffset : 0
	};
}

// Returns the bounding box that popup coordinates must stay inside.
// For relative (non-absolute) popups, coordinates are relative to offsetParent,
// so the bound is simply [0, offsetParent.offsetWidth] x [0, offsetParent.offsetHeight].
// For absolute popups, coordinates are page-absolute, so we use the viewport rect.
function getContainerBounds(domNode,popup) {
	const padding = POPUP_AUTO_POSITION_PADDING;
	if(popup.absolute) {
		const {pageXOffset,pageYOffset,innerWidth,innerHeight} = getViewportMetrics();
		return {
			minX: pageXOffset + padding,
			minY: pageYOffset + padding,
			maxX: pageXOffset + innerWidth - padding,
			maxY: pageYOffset + innerHeight - padding
		};
	}
	const offsetParent = domNode.offsetParent;
	if(!offsetParent) {
		return {minX: padding, minY: padding, maxX: 9999, maxY: 9999};
	}
	return {
		minX: padding,
		minY: padding,
		maxX: offsetParent.offsetWidth - padding,
		maxY: offsetParent.offsetHeight - padding
	};
}

function computePopupCoordinates(popup,position,popupWidth,popupHeight) {
	let left,top;
	switch(position) {
		case "left":
			left = popup.left - popupWidth;
			top = popup.top;
			break;
		case "above":
			left = popup.left;
			top = popup.top - popupHeight;
			break;
		case "aboveright":
			left = popup.left + popup.width;
			top = popup.top + popup.height - popupHeight;
			break;
		case "belowright":
			left = popup.left + popup.width;
			top = popup.top + popup.height;
			break;
		case "right":
			left = popup.left + popup.width;
			top = popup.top;
			break;
		case "belowleft":
			left = popup.left + popup.width - popupWidth;
			top = popup.top + popup.height;
			break;
		case "aboveleft":
			left = popup.left - popupWidth;
			top = popup.top - popupHeight;
			break;
		default:
			left = popup.left;
			top = popup.top + popup.height;
			position = "below";
			break;
	}
	return {position,left,top};
}

// Compute overflow of a popup rect (in container coordinates) against the container bounds.
// Returns {total, top, left, right, bottom} where each is pixels of overflow (0 = no overflow).
function getContainerOverflow(bounds,left,top,popupWidth,popupHeight) {
	const overflowLeft = Math.max(0,bounds.minX - left),
		overflowTop = Math.max(0,bounds.minY - top),
		overflowRight = Math.max(0,(left + popupWidth) - bounds.maxX),
		overflowBottom = Math.max(0,(top + popupHeight) - bounds.maxY);
	return {
		total: overflowLeft + overflowTop + overflowRight + overflowBottom,
		top: overflowTop,
		left: overflowLeft,
		right: overflowRight,
		bottom: overflowBottom
	};
}

function getAutoPositionCandidates(position) {
	const preferred = position || "below",
		opposite = POPUP_POSITION_OPPOSITES[preferred] || "above",
		candidates = [preferred];
	if(opposite !== preferred) {
		candidates.push(opposite);
	}
	return candidates;
}

// Choose the best direction (preferred vs opposite) by comparing overflow inside the container.
function chooseBestPopupCoordinates(domNode,popup,position,popupWidth,popupHeight) {
	const bounds = getContainerBounds(domNode,popup),
		candidates = getAutoPositionCandidates(position);
	let best = null;
	for(const candidatePosition of candidates) {
		const candidate = computePopupCoordinates(popup,candidatePosition,popupWidth,popupHeight),
			{total: score} = getContainerOverflow(bounds,candidate.left,candidate.top,popupWidth,popupHeight);
		if(!best || score < best.score) {
			best = {candidate,score};
		}
	}
	return best ? best.candidate : computePopupCoordinates(popup,position,popupWidth,popupHeight);
}

// After choosing the best direction, shift the popup to fit inside the container.
function shiftPopupIntoContainer(domNode,popup,left,top,popupWidth,popupHeight) {
	const bounds = getContainerBounds(domNode,popup);
	let deltaX = 0,deltaY = 0;
	if(left < bounds.minX) {
		deltaX = bounds.minX - left;
	} else if(left + popupWidth > bounds.maxX) {
		deltaX = bounds.maxX - (left + popupWidth);
	}
	if(top < bounds.minY) {
		deltaY = bounds.minY - top;
	} else if(top + popupHeight > bounds.maxY) {
		deltaY = bounds.maxY - (top + popupHeight);
	}
	return {left: left + deltaX,top: top + deltaY};
}

/*
Render this widget into the DOM
*/
RevealWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	var tag = this.parseTreeNode.isBlock ? "div" : "span";
	if(this.revealTag && $tw.config.htmlUnsafeElements.indexOf(this.revealTag) === -1) {
		tag = this.revealTag;
	}
	var domNode = this.document.createElement(tag);
	this.domNode = domNode;
	this.assignDomNodeClasses();
	if(this.style) {
		domNode.setAttribute("style",this.style);
	}
	parent.insertBefore(domNode,nextSibling);
	this.domNodes.push(domNode);
	this.renderChildren(domNode,null);
	if(!domNode.isTiddlyWikiFakeDom && this.type === "popup" && this.isOpen) {
		this.positionPopup(domNode);
		$tw.utils.addClass(domNode,"tc-popup"); // Make sure that clicks don't dismiss popups within the revealed content
	}
	if(!this.isOpen) {
		domNode.setAttribute("hidden","true");
	}
};

RevealWidget.prototype.positionPopup = function(domNode) {
	domNode.style.position = "absolute";
	domNode.style.zIndex = "1000";
	const popupWidth = domNode.offsetWidth,
		popupHeight = domNode.offsetHeight;
	let computedCoordinates = computePopupCoordinates(this.popup,this.position,popupWidth,popupHeight),
		left = computedCoordinates.left,
		top = computedCoordinates.top;
	if(this.clampToParent === "auto") {
		// Smart mode (default): flip to the opposite direction when needed, then shift to fit.
		computedCoordinates = chooseBestPopupCoordinates(domNode,this.popup,computedCoordinates.position,popupWidth,popupHeight);
		left = computedCoordinates.left;
		top = computedCoordinates.top;
		const shiftedCoordinates = shiftPopupIntoContainer(domNode,this.popup,left,top,popupWidth,popupHeight);
		left = shiftedCoordinates.left;
		top = shiftedCoordinates.top;
	} else if(this.clampToParent !== "none") {
		// Hard-clamp mode: shift coordinates without flipping direction.
		let parentWidth,parentHeight;
		if(this.popup.absolute) {
			const {innerWidth,innerHeight} = getViewportMetrics();
			parentWidth = innerWidth;
			parentHeight = innerHeight;
		} else {
			parentWidth = domNode.offsetParent.offsetWidth;
			parentHeight = domNode.offsetParent.offsetHeight;
		}
		const right = left + domNode.offsetWidth,
			bottom = top + domNode.offsetHeight;
		if((this.clampToParent === "both" || this.clampToParent === "right") && right > parentWidth) {
			left = parentWidth - domNode.offsetWidth;
		}
		if((this.clampToParent === "both" || this.clampToParent === "bottom") && bottom > parentHeight) {
			top = parentHeight - domNode.offsetHeight;
		}
		// clamping on left and top sides is taken care of by positionAllowNegative
	}
	if(!this.positionAllowNegative) {
		left = Math.max(0,left);
		top = Math.max(0,top);
	}
	if(this.popup.absolute) {
		// Traverse the offsetParent chain and correct the offset to make it relative to the parent node.
		for(let offsetParentDomNode = domNode.offsetParent; offsetParentDomNode; offsetParentDomNode = offsetParentDomNode.offsetParent) {
			left -= offsetParentDomNode.offsetLeft;
			top -= offsetParentDomNode.offsetTop;
		}
	}
	domNode.style.left = left + "px";
	domNode.style.top = top + "px";
};

/*
Compute the internal state of the widget
*/
RevealWidget.prototype.execute = function() {
	// Get our parameters
	this.state = this.getAttribute("state");
	this.revealTag = this.getAttribute("tag");
	this.type = this.getAttribute("type");
	this.text = this.getAttribute("text");
	this.position = this.getAttribute("position");
	this.positionAllowNegative = this.getAttribute("positionAllowNegative") === "yes";
	// class attribute handled in assignDomNodeClasses()
	this.style = this.getAttribute("style","");
	this["default"] = this.getAttribute("default","");
	this.animate = this.getAttribute("animate","no");
	this.retain = this.getAttribute("retain","no");
	this.openAnimation = this.animate === "no" ? undefined : "open";
	this.closeAnimation = this.animate === "no" ? undefined : "close";
	this.updatePopupPosition = this.getAttribute("updatePopupPosition","no") === "yes";
	// clamp="auto" (default) flips direction then shifts to fit the container.
	// clamp="none" disables all adjustment.
	// clamp="right"/"bottom"/"both" hard-clamp without flipping.
	this.clampToParent = this.getAttribute("clamp","auto");
	// Compute the title of the state tiddler and read it
	this.stateTiddlerTitle = this.state;
	this.stateTitle = this.getAttribute("stateTitle");
	this.stateField = this.getAttribute("stateField");
	this.stateIndex = this.getAttribute("stateIndex");
	this.readState();
	// Construct the child widgets
	var childNodes = this.isOpen ? this.parseTreeNode.children : [];
	this.hasChildNodes = this.isOpen;
	this.makeChildWidgets(childNodes);
};

/*
Read the state tiddler
*/
RevealWidget.prototype.readState = function() {
	// Read the information from the state tiddler
	var state,
		defaultState = this["default"];
	if(this.stateTitle) {
		var stateTitleTiddler = this.wiki.getTiddler(this.stateTitle);
		if(this.stateField) {
			state = stateTitleTiddler ? stateTitleTiddler.getFieldString(this.stateField) || defaultState : defaultState;
		} else if(this.stateIndex) {
			state = stateTitleTiddler ? this.wiki.extractTiddlerDataItem(this.stateTitle,this.stateIndex) || defaultState : defaultState;
		} else if(stateTitleTiddler) {
			state = this.wiki.getTiddlerText(this.stateTitle) || defaultState;
		} else {
			state = defaultState;
		}
	} else {
		state = this.stateTiddlerTitle ? this.wiki.getTextReference(this.state,this["default"],this.getVariable("currentTiddler")) : this["default"];
	}
	if(state === null) {
		state = this["default"];
	}
	switch(this.type) {
		case "popup":
			this.readPopupState(state);
			break;
		case "match":
			this.isOpen = this.text === state;
			break;
		case "nomatch":
			this.isOpen = this.text !== state;
			break;
		case "lt":
			this.isOpen = !!(this.compareStateText(state) < 0);
			break;
		case "gt":
			this.isOpen = !!(this.compareStateText(state) > 0);
			break;
		case "lteq":
			this.isOpen = !(this.compareStateText(state) > 0);
			break;
		case "gteq":
			this.isOpen = !(this.compareStateText(state) < 0);
			break;
	}
};

RevealWidget.prototype.compareStateText = function(state) {
	return state.localeCompare(this.text,undefined,{numeric: true,sensitivity: "case"});
};

RevealWidget.prototype.readPopupState = function(state) {
	this.popup = Popup.parseCoordinates(state);
	// Check if the state matches the location regexp
	if(this.popup) {
		// If so, we're open
		this.isOpen = true;
	} else {
		// If not, we're closed
		this.isOpen = false;
	}
};

RevealWidget.prototype.assignDomNodeClasses = function() {
	var classes = this.getAttribute("class","").split(" ");
	classes.push("tc-reveal");
	this.domNode.className = classes.join(" ").trim();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
RevealWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.state || changedAttributes.type || changedAttributes.text || changedAttributes.position || changedAttributes.clamp || changedAttributes.positionAllowNegative || changedAttributes["default"] || changedAttributes.animate || changedAttributes.stateTitle || changedAttributes.stateField || changedAttributes.stateIndex) {
		this.refreshSelf();
		return true;
	} else {
		var currentlyOpen = this.isOpen;
		this.readState();
		if(this.isOpen !== currentlyOpen) {
			if(this.retain === "yes") {
				this.updateState();
			} else {
				this.refreshSelf();
				return true;
			}
		} else if(this.type === "popup" && this.isOpen && this.updatePopupPosition && (changedTiddlers[this.state] || changedTiddlers[this.stateTitle])) {
			this.positionPopup(this.domNode);
		}
		if(changedAttributes.style) {
			this.domNode.style = this.getAttribute("style","");
		}
		if(changedAttributes["class"]) {
			this.assignDomNodeClasses();
		}
		return this.refreshChildren(changedTiddlers);
	}
};

/*
Called by refresh() to dynamically show or hide the content
*/
RevealWidget.prototype.updateState = function() {
	var self = this;
	// Read the current state
	this.readState();
	// Construct the child nodes if needed
	var domNode = this.domNodes[0];
	if(this.isOpen && !this.hasChildNodes) {
		this.hasChildNodes = true;
		this.makeChildWidgets(this.parseTreeNode.children);
		this.renderChildren(domNode,null);
	}
	// Animate our DOM node
	if(this.isOpen) {
		domNode.removeAttribute("hidden");
		// Position popup after making it visible to ensure correct dimensions
		if(!domNode.isTiddlyWikiFakeDom && this.type === "popup") {
			this.positionPopup(domNode);
			$tw.utils.addClass(domNode,"tc-popup"); // Make sure that clicks don't dismiss popups within the revealed content
		}
		$tw.anim.perform(this.openAnimation,domNode);
	} else {
		$tw.anim.perform(this.closeAnimation,domNode,{callback: function() {
			//make sure that the state hasn't changed during the close animation
			self.readState();
			if(!self.isOpen) {
				domNode.setAttribute("hidden","true");
			}
		}});
	}
};

exports.reveal = RevealWidget;
