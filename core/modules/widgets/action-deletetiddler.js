/*\
title: $:/core/modules/widgets/action-deletetiddler.js
type: application/javascript
module-type: widget

Action widget to delete a tiddler.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var DeleteTiddlerWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
DeleteTiddlerWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
DeleteTiddlerWidget.prototype.render = function(parent,nextSibling) {
	this.computeAttributes();
	this.execute();
};

/*
Compute the internal state of the widget
*/
DeleteTiddlerWidget.prototype.execute = function() {
	this.actionFilter = this.getAttribute("$filter");
	this.actionTiddler = this.getAttribute("$tiddler");
};

/*
Refresh the widget by ensuring our attributes are up to date
*/
DeleteTiddlerWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes["$filter"] || changedAttributes["$tiddler"]) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

/*
Invoke the action associated with this widget
*/
DeleteTiddlerWidget.prototype.invokeAction = function(triggeringWidget,event) {
	var tiddlers = [];
	if(this.actionFilter) {
		tiddlers = this.wiki.filterTiddlers(this.actionFilter,this);
	}
	if(this.actionTiddler) {
		tiddlers.push(this.actionTiddler);
	}
	for(var t=0; t<tiddlers.length; t++) {
		this.wiki.deleteTiddler(tiddlers[t]);
	}
	return true; // Action was invoked
};

exports["action-deletetiddler"] = DeleteTiddlerWidget;

})();
