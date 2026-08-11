/*\
title: $:/core/modules/widgets/eventcatcher.js
type: application/javascript
module-type: widget

Event handler widget

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var EventWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
EventWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
EventWidget.prototype.render = function(parent,nextSibling) {
	// Remember parent
	this.parentDomNode = parent;
	// Compute attributes and execute state
	this.computeAttributes();
	this.execute();
	// Create element
	var tag = this.parseTreeNode.isBlock ? "div" : "span";
	if(this.elementTag && $tw.config.htmlUnsafeElements.indexOf(this.elementTag) === -1) {
		tag = this.elementTag;
	}
	var domNode = this.document.createElement(tag);
	this.domNode = domNode;
	// Assign classes
	this.assignDomNodeClasses();
	// Add our event handlers
	this.toggleListeners();
	// Insert element
	parent.insertBefore(domNode,nextSibling);
	this.domNodes.push(domNode);
	this.renderChildren(domNode,null);
};

/*
Compute the internal state of the widget
*/
EventWidget.prototype.execute = function() {
	var self = this;
	// Get attributes that require a refresh on change
	this.types = [];
	$tw.utils.each(this.attributes,function(value,key) {
		if(key.charAt(0) === "$") {
			self.types.push(key.slice(1));
		}
	});
	this.pointerCaptureMode = this.getAttribute("pointerCapture","no");
	this.elementTag = this.getAttribute("tag");
	// Make child widgets
	this.makeChildWidgets();
};

/*
Cache and pre-create all event listeners, called when first needed
*/
EventWidget.prototype.cacheEventListeners = function() {
	if(this._eventListeners) {
		return;
	}
	this._eventListeners = Object.create(null);
	this._captureActiveListeners = Object.create(null);
	this._dynamicOnlyEvents = ["pointerup","pointercancel","pointermove"];

	const clearPointerCapture = (event) => {
		if(Number.isInteger(this._capturePointerId)) {
			this.stopPointerCapture(this._capturePointerId);
		}
	};

	const attachDynamicOnlyListeners = () => {
		this._dynamicOnlyEvents.forEach((dt) => {
			const listener = this._eventListeners[dt];
			if(listener) {
				this._captureActiveListeners[dt] = listener;
				this.domNode.addEventListener(dt, listener, false);
			}
		});
	};

	// Dynamic pointer capture listeners
	if(this.pointerCaptureMode === "dynamic") {
		["pointerup","pointercancel"].forEach((type) => {
			this._eventListeners[type] = (event) => {
				const selectedNode = this.checkEvent(event, type);
				if(selectedNode) {
					clearPointerCapture(event);
				}
				// Remove dynamic-only listeners
				this.cleanupDynamicListeners();
				return this.handleEvent(event, type, selectedNode);
			};
		});
		if(!this.types.includes("pointerdown")) {
			this.types.push("pointerdown");
		}
	}

	// Create any listeners not already defined above
	this.types.forEach((type) => {
		if(!this._eventListeners[type]) {
			this._eventListeners[type] = (event) => {
				const selectedNode = this.checkEvent(event, type);
				if(!selectedNode) {
					return false;
				}
				// Handle pointer capture for pointerdown
				if(type === "pointerdown") {
					if(this.pointerCaptureMode !== "no") {
						this.startPointerCapture(event.pointerId, event.target);
					}

					if(this.pointerCaptureMode === "dynamic") {
						attachDynamicOnlyListeners();
					}
				} else if(type === "pointerup" || type === "pointercancel") {
					clearPointerCapture(event);
				}
				return this.handleEvent(event, type, selectedNode);
			};
		}
	});
};

/*
Check if an event qualifies and return the matching selected node
*/
EventWidget.prototype.checkEvent = function(event, type) {
	const domNode = this.domNode;
	let node = event.target;

	// Use capture target if valid
	if(this._captureTarget && event.pointerId !== undefined) {
		if(document.contains(this._captureTarget)) {
			node = this._captureTarget;
		} else {
			// Clear stale reference
			this.stopPointerCapture(this._capturePointerId);
			node = event.target;
		}
	}

	if(node && node.nodeType === 3) {
		node = node.parentNode;
	}
	if(!node || node.nodeType !== 1) {
		return null;
	}

	const selector = this.getAttribute("selector"),
		matchSelector = this.getAttribute("matchSelector");

	if(matchSelector && !node.matches(matchSelector)) {
		return null;
	}
	if(selector) {
		const match = node.closest(selector);
		if(!match || match === domNode || !domNode.contains(match)) {
			return null;
		}
		return match;
	}
	return node;
};

/*
Handle the event and execute actions
*/
EventWidget.prototype.handleEvent = function(event, type, selectedNode) {
	if(!selectedNode) {
		return false;
	}
	let actions = this.getAttribute("$"+type),
		stopPropagation = this.getAttribute("stopPropagation","onaction");

	if(actions) {
		let variables = $tw.utils.extend(
			{},
			$tw.utils.collectDOMVariables(selectedNode, this.domNode, event),
			{
				"eventJSON": JSON.stringify($tw.utils.copyObjectPropertiesSafe(event)),
				"modifier": $tw.keyboardManager.getEventModifierKeyDescriptor(event),
				"event-type": event.type.toString()
			}
		);

		if("button" in event) {
			const mouseButtonMap = {0:"left",1:"middle",2:"right"};
			variables["event-mousebutton"] = mouseButtonMap[event.button];
		}
		this.invokeActionString(actions, this, event, variables);
	}

	if((actions && stopPropagation === "onaction") || stopPropagation === "always") {
		event.preventDefault();
		event.stopPropagation();
		return true;
	}
	return false;
};

EventWidget.prototype.startPointerCapture = function(pointerId, captureTarget) {
	// Start capture only if none active; pointerId can be 0 
	if(!Number.isInteger(this._capturePointerId) && this.domNode && this.domNode.setPointerCapture) {
		this.domNode.setPointerCapture(pointerId);
		this._capturePointerId = pointerId;
		this._captureTarget = captureTarget;
	}
};

EventWidget.prototype.stopPointerCapture = function(pointerId) {
	if(this.domNode && this.domNode.hasPointerCapture && this.domNode.hasPointerCapture(pointerId)) {
		this.domNode.releasePointerCapture(pointerId);
	}
	this._capturePointerId = undefined;
	this._captureTarget = undefined;
};

/*
Attach all relevant listeners
*/
EventWidget.prototype.attachListeners = function() {
	this.cacheEventListeners();
	const domNode = this.domNode;
	Object.keys(this._eventListeners).forEach((type) => {
		if(this.pointerCaptureMode === "dynamic" && this._dynamicOnlyEvents.includes(type)) {
			return; //skip dynamic-only events
		}
		domNode.addEventListener(type, this._eventListeners[type], false);
	});
};

/*
Remove dynamic active listeners
*/
EventWidget.prototype.cleanupDynamicListeners = function() {
	const domNode = this.domNode;
	Object.keys(this._captureActiveListeners || {}).forEach((type) => {
		domNode.removeEventListener(type, this._captureActiveListeners[type], false);
	});
	this._captureActiveListeners = Object.create(null);
};

/*
Remove all listeners
*/
EventWidget.prototype.removeAllListeners = function() {
	if(Number.isInteger(this._capturePointerId)) {
		this.stopPointerCapture(this._capturePointerId);
	}
	const domNode = this.domNode;
	Object.keys(this._eventListeners || {}).forEach((type) => {
		domNode.removeEventListener(type, this._eventListeners[type], false);
	});
	this.cleanupDynamicListeners();
	this._captureTarget = null;
};

/*
Enable or disable listeners
*/
EventWidget.prototype.toggleListeners = function() {
	let disabled = this.getAttribute("disabled","no") === "yes";
	if(disabled) {
		this.removeAllListeners();
	} else {
		this.attachListeners();
	}
};

/*
Assign DOM node classes
*/
EventWidget.prototype.assignDomNodeClasses = function() {
	var classes = this.getAttribute("class","").split(" ");
	classes.push("tc-eventcatcher");
	this.domNode.className = classes.join(" ").trim();
};

/*
Refresh widget
*/
EventWidget.prototype.refresh = function(changedTiddlers) {
	const changedAttributes = this.computeAttributes(),
		changedKeys = Object.keys(changedAttributes),
		canUpdateAttributes = changedKeys.every((key) => key === "class" || key === "disabled");
	if(canUpdateAttributes) {
		if(changedAttributes["class"]) {
			this.assignDomNodeClasses();
		}
		if(changedAttributes["disabled"]) {
			this.toggleListeners();
		}
		return this.refreshChildren(changedTiddlers);
	}
	this.refreshSelf();
	return true;
};

exports.eventcatcher = EventWidget;
