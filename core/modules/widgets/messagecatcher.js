/*\
title: $:/core/modules/widgets/messagecatcher.js
type: application/javascript
module-type: widget

Message catcher widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var MessageCatcherWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
MessageCatcherWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
MessageCatcherWidget.prototype.render = function(parent,nextSibling) {
	var self = this;
	// Remember parent
	this.parentDomNode = parent;
	// Compute attributes and execute state
	this.computeAttributes();
	this.execute();
	// Helper to add an event handler
	var addEventHandler = function(type,actions) {
		if(type && actions) {
			var isActionStringExecuting = false;
			self.addEventListener(
				type,
				function(event) {
					// Don't trap the event if it came from one of our action handlers
					if(isActionStringExecuting) {
						return true;
					}
					// Collect all the event properties into variables
					var collectProps = function(obj,prefix) {
						prefix = prefix || "";
						var props = {},
							names = [];
						$tw.utils.each(obj,function(value,name) {
							if(["string","boolean","number"].indexOf(typeof value) !== -1) {
								names.push(name);
								props[prefix + "-" + name] = value.toString();
							}
						});
						props["list-" + prefix] = $tw.utils.stringifyList(names);
						return props;
					};
					var variables = $tw.utils.extend(
						{},
						collectProps(event.paramObject,"event-paramObject"),
						collectProps(event,"event"),
						{
							modifier: $tw.keyboardManager.getEventModifierKeyDescriptor(event)
						});
					isActionStringExecuting = true;
					self.invokeActionString(actions,self,event,variables);
					isActionStringExecuting = false;
					return false;
				}
			);
		}
	}
	// Add the main event handler
	addEventHandler(this.getAttribute("type"),this.getAttribute("actions"));
	// Add any other event handlers
	$tw.utils.each(this.attributes,function(value,key) {
		if(key.charAt(0) === "$") {
			addEventHandler(key.slice(1),value);
		}
	});
	// Render children
	this.renderChildren(parent,nextSibling);
};

/*
Compute the internal state of the widget
*/
MessageCatcherWidget.prototype.execute = function() {
	// Make child widgets
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
MessageCatcherWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if($tw.utils.count(changedAttributes) > 0) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

exports.messagecatcher = MessageCatcherWidget;

})();
