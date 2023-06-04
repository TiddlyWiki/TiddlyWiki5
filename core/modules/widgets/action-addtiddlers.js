/*\
title: $:/core/modules/widgets/action-addtiddlers.js
type: application/javascript
module-type: widget

Action widget to send a message

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var AddTiddlersWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
AddTiddlersWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
AddTiddlersWidget.prototype.render = function(parent,nextSibling) {
	this.computeAttributes();
	this.execute();
};

/*
Compute the internal state of the widget
*/
AddTiddlersWidget.prototype.execute = function() {
	this.JSONData = this.getAttribute("$json");
};

/*
Refresh the widget by ensuring our attributes are up to date
*/
AddTiddlersWidget.prototype.refresh = function(changedTiddlers) {
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
AddTiddlersWidget.prototype.invokeAction = function(triggeringWidget,event) {
	var  self = this,
		importData = $tw.utils.parseJSONSafe(this.JSONData,function(err) {
			console.log("JSON error: " + err);
			return [];
		});
	if(!$tw.utils.isArray(importData)) {
		importData = [importData];
	}
	$tw.utils.each(importData,function(tiddlerFields) {
		var title = tiddlerFields.title;
		if(title) {
			var tiddler = new $tw.Tiddler(tiddlerFields);
			// Add the tiddlers to the store
			self.wiki.addTiddler(tiddler);
		}
	});
	return true; // Action was invoked
};

exports["action-addtiddlers"] = AddTiddlersWidget;

})();