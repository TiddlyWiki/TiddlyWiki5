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
	var self = this;
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
	// Add our event handler
	this.toggleListeners(this.getAttribute("disabled","no") !== "yes");
	// Insert element
	parent.insertBefore(domNode,nextSibling);
	this.renderChildren(domNode,null);
	this.domNodes.push(domNode);
};


EventWidget.prototype.toggleListeners = function(enabled) {
	var domNode = this.domNode,
		self = this;
	this._eventListeners = this._eventListeners || {};
	$tw.utils.each(this.types,function(type) {
		// Store the listener function so we can remove it later
		if(!self._eventListeners[type]) {
			self._eventListeners[type] = function(event) {
				var selector = self.getAttribute("selector"),
					matchSelector = self.getAttribute("matchSelector"),
					actions = self.getAttribute("$"+type) || self.getAttribute("actions-"+type),
					stopPropagation = self.getAttribute("stopPropagation","onaction"),
					selectedNode = event.target,
					selectedNodeRect,
					catcherNodeRect,
					variables = {};
				// Firefox can fire dragover and dragenter events on text nodes instead of their parents
				if(selectedNode.nodeType === 3) {
					selectedNode = selectedNode.parentNode;
				}
				// Check that the selected node matches any matchSelector
				if(matchSelector && !$tw.utils.domMatchesSelector(selectedNode,matchSelector)) {
					return false;
				}
				if(selector) {
					// Search ancestors for a node that matches the selector
					while(!$tw.utils.domMatchesSelector(selectedNode,selector) && selectedNode !== domNode) {
						selectedNode = selectedNode.parentNode;
					}
					// Exit if we didn't find one
					if(selectedNode === domNode) {
						return false;
					}
					// Only set up variables if we have actions to invoke
					if(actions) {
						variables = $tw.utils.collectDOMVariables(selectedNode,self.domNode,event);
					}
				}
				// Execute our actions with the variables
				if(actions) {
					// Add a variable for the modifier key
					variables.modifier = $tw.keyboardManager.getEventModifierKeyDescriptor(event);
					// Add a variable for the mouse button
					if("button" in event) {
						if(event.button === 0) {
							variables["event-mousebutton"] = "left";
						} else if(event.button === 1) {
							variables["event-mousebutton"] = "middle";
						} else if(event.button === 2) {
							variables["event-mousebutton"] = "right";
						}
					}
					variables["event-type"] = event.type.toString();
					if(typeof event.detail === "object" && !!event.detail) {
						$tw.utils.each(event.detail,function(detailValue,detail) {
							variables["event-detail-" + detail] = detailValue.toString();
						});
					} else if(!!event.detail) {
						variables["event-detail"] = event.detail.toString();
					}
					self.invokeActionString(actions,self,event,variables);
				}
				if((actions && stopPropagation === "onaction") || stopPropagation === "always") {
					event.preventDefault();
					event.stopPropagation();
					return true;
				}
				return false;
			};
		}
		var listenerFn = self._eventListeners[type];
		if(enabled) {
			domNode.addEventListener(type,listenerFn,false);
		} else {
			domNode.removeEventListener(type,listenerFn,false);
		}
	});
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
	if(!this.types.length) {
		this.types = this.getAttribute("events","").split(" ");
	}
	this.elementTag = this.getAttribute("tag");
	// Make child widgets
	this.makeChildWidgets();
};

EventWidget.prototype.assignDomNodeClasses = function() {
	var classes = this.getAttribute("class","").split(" ");
	classes.push("tc-eventcatcher");
	this.domNode.className = classes.join(" ");
};

EventWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes(),
		changedKeys = Object.keys(changedAttributes);

	if(changedKeys.length === 0) {
		return this.refreshChildren(changedTiddlers);
	}
	// If only class or disabled attributes have changed, we can update the DOM node without a full refresh
	var canUpateAttributes = changedKeys.every(function(key) {
		return key === "class" || key === "disabled";
	});
	if(canUpateAttributes) {
		if(changedAttributes["class"]) {
			this.assignDomNodeClasses();
		}
		if(changedAttributes["disabled"]) {
			this.toggleListeners(this.getAttribute("disabled","no") !== "yes");
		}
		return false;
	}

	this.refreshSelf();
	return true;
};

exports.eventcatcher = EventWidget;
