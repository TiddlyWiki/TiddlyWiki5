/*\
title: $:/core/modules/widgets/reveal.js
type: application/javascript
module-type: widget

Reveal widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var RevealWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
RevealWidget.prototype = new Widget();

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
	this.renderChildren(domNode,null);
	if(!domNode.isTiddlyWikiFakeDom && this.type === "popup" && this.isOpen) {
		this.positionPopup(domNode);
		$tw.utils.addClass(domNode,"tc-popup"); // Make sure that clicks don't dismiss popups within the revealed content
	}
	if(!this.isOpen) {
		domNode.setAttribute("hidden","true");
	}
	this.domNodes.push(domNode);
};

RevealWidget.prototype.positionPopup = function(domNode) {
	domNode.style.position = "absolute";
	domNode.style.zIndex = "1000";
	var left,top;
	switch(this.position) {
		case "left":
			left = this.popup.left - domNode.offsetWidth;
			top = this.popup.top;
			break;
		case "above":
			left = this.popup.left;
			top = this.popup.top - domNode.offsetHeight;
			break;
		case "aboveright":
			left = this.popup.left + this.popup.width;
			top = this.popup.top + this.popup.height - domNode.offsetHeight;
			break;
		case "belowright":
			left = this.popup.left + this.popup.width;
			top = this.popup.top + this.popup.height;
			break;
		case "right":
			left = this.popup.left + this.popup.width;
			top = this.popup.top;
			break;
		case "belowleft":
			left = this.popup.left + this.popup.width - domNode.offsetWidth;
			top = this.popup.top + this.popup.height;
			break;
		case "aboveleft":
			left = this.popup.left - domNode.offsetWidth;
			top = this.popup.top - domNode.offsetHeight;
			break;
		default: // Below
			left = this.popup.left;
			top = this.popup.top + this.popup.height;
			break;
	}
	if(!this.positionAllowNegative) {
		left = Math.max(0,left);
		top = Math.max(0,top);
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
	var popupLocationRegExp = /^\((-?[0-9\.E]+),(-?[0-9\.E]+),(-?[0-9\.E]+),(-?[0-9\.E]+)\)$/,
		match = popupLocationRegExp.exec(state);
	// Check if the state matches the location regexp
	if(match) {
		// If so, we're open
		this.isOpen = true;
		// Get the location
		this.popup = {
			left: parseFloat(match[1]),
			top: parseFloat(match[2]),
			width: parseFloat(match[3]),
			height: parseFloat(match[4])
		};
	} else {
		// If not, we're closed
		this.isOpen = false;
	}
};

RevealWidget.prototype.assignDomNodeClasses = function() {
	var classes = this.getAttribute("class","").split(" ");
	classes.push("tc-reveal");
	this.domNode.className = classes.join(" ");
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
RevealWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.state || changedAttributes.type || changedAttributes.text || changedAttributes.position || changedAttributes.positionAllowNegative || changedAttributes["default"] || changedAttributes.animate || changedAttributes.stateTitle || changedAttributes.stateField || changedAttributes.stateIndex) {
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
		} else if(this.type === "popup" && this.updatePopupPosition && (changedTiddlers[this.state] || changedTiddlers[this.stateTitle])) {
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
	if(!domNode.isTiddlyWikiFakeDom && this.type === "popup" && this.isOpen) {
		this.positionPopup(domNode);
		$tw.utils.addClass(domNode,"tc-popup"); // Make sure that clicks don't dismiss popups within the revealed content

	}
	if(this.isOpen) {
		domNode.removeAttribute("hidden");
        $tw.anim.perform(this.openAnimation,domNode);
	} else {
		$tw.anim.perform(this.closeAnimation,domNode,{callback: function() {
			//make sure that the state hasn't changed during the close animation
			self.readState()
			if(!self.isOpen) {
				domNode.setAttribute("hidden","true");
			}
		}});
	}
};

exports.reveal = RevealWidget;

})();
