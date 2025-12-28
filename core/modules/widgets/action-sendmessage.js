/*\
title: $:/core/modules/widgets/action-sendmessage.js
type: application/javascript
module-type: widget

Action widget to send a message

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var SendMessageWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
SendMessageWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
SendMessageWidget.prototype.render = function(parent,nextSibling) {
	this.computeAttributes();
	this.execute();
};

/*
Compute the internal state of the widget
*/
SendMessageWidget.prototype.execute = function() {
	this.actionMessage = this.getAttribute("$message");
	this.actionParam = this.getAttribute("$param");
	this.actionName = this.getAttribute("$name");
	this.actionValue = this.getAttribute("$value","");
	this.actionNames = this.getAttribute("$names");
	this.actionValues = this.getAttribute("$values");
	this.actionEventNames = this.getAttribute("$eventNames");
	this.actionEventValues = this.getAttribute("$eventValues");
	this.actionEventJson = this.getAttribute("$eventJson");
};

/*
Refresh the widget by ensuring our attributes are up to date
*/
SendMessageWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(Object.keys(changedAttributes).length) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

/*
Invoke the action associated with this widget
*/
SendMessageWidget.prototype.invokeAction = function(triggeringWidget,event) {
	// Get the string parameter
	var param = this.actionParam;
	// We assemble the parameters as a hashmap
	var paramObject = Object.create(null);
	// Add names/values pairs if present
	if(this.actionNames && this.actionValues) {
		var names = this.wiki.filterTiddlers(this.actionNames,this),
			values = this.wiki.filterTiddlers(this.actionValues,this);
		$tw.utils.each(names,function(name,index) {
			paramObject[name] = values[index] || "";
		});
	}
	// Add raw attributes
	$tw.utils.each(this.attributes,function(attribute,name) {
		if(name.charAt(0) !== "$") {
			paramObject[name] = attribute;
		}
	});
	// Add name/value pair if present
	if(this.actionName) {
		paramObject[this.actionName] = this.actionValue;
	}
	// We build the "event" object to dispatch
	var params = {
		param: param,
		paramObject: paramObject,
		event: event,
		tiddlerTitle: this.getVariable("currentTiddler"),
		navigateFromTitle: this.getVariable("storyTiddler")
	};
	// Parse and merge $eventJson if present
	if(this.actionEventJson) {
		try {
			var eventData = JSON.parse(this.actionEventJson);
			$tw.utils.each(eventData,function(value,name) {
				params[name] = value;
			});
		} catch(e) {
			// Silently ignore invalid JSON
		}
	}
	// Add event names/values pairs if present
	if(this.actionEventNames && this.actionEventValues) {
		var eventNames = this.wiki.filterTiddlers(this.actionEventNames,this),
			eventValues = this.wiki.filterTiddlers(this.actionEventValues,this);
		$tw.utils.each(eventNames,function(name,index) {
			params[name] = eventValues[index] || "";
		});
	}
	// Add raw $event-* attributes
	$tw.utils.each(this.attributes,function(attribute,name) {
		if(name.indexOf("$event-") === 0) {
			params[name.slice(7)] = attribute;
		}
	});
	// $message has priority and overwrites any $event-type that may have been set
	if(this.actionMessage) {
		params.type = this.actionMessage;
	}
	// Dispatch the message
	this.dispatchEvent(params);
	return true; // Action was invoked
};

exports["action-sendmessage"] = SendMessageWidget;
