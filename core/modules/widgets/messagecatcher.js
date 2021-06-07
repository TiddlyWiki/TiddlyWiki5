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
	// Add our message handler
	if(this.messageType) {
		this.addEventListeners([
			{type: this.messageType, handler: "handleEvent"}
		]);
	}
	// Render children
	this.renderChildren(parent,null);
};

/*
Compute the internal state of the widget
*/
MessageCatcherWidget.prototype.execute = function() {
	var self = this;
	// Get attributes that require a refresh on change
	this.messageType = this.getAttribute("type");
	this.messageActions = this.getAttribute("actions");
	// Make child widgets
	this.makeChildWidgets();
};

/*
Handle an event
*/
MessageCatcherWidget.prototype.handleEvent = function(event) {
	if(this.messageActions) {
		// Collect all the event properties into variables
		var collectProps = function(obj,prefix) {
				prefix = prefix || "";
				var props = {};
				$tw.utils.each(obj,function(value,name) {
					if(["string","boolean","number"].indexOf(typeof value) !== -1) {
						props[prefix + name] = value.toString();
					}
				});
				return props;
			};
		var variables = $tw.utils.extend(
			{},
			collectProps(event.paramObject,"event-paramObject-"),
			collectProps(event,"event-"),
			{
				modifier: $tw.keyboardManager.getEventModifierKeyDescriptor(event)
			});
		this.invokeActionString(this.messageActions,this,event,variables);
	}
	return false;
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
MessageCatcherWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes["type"]) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

exports.messagecatcher = MessageCatcherWidget;

})();
