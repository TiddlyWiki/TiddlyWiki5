/*\
title: $:/plugins/tiddlywiki/multiwikiclient/managetiddleraction.js
type: application/javascript
module-type: widget

A widget to manage tiddler actions.
\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var ManageTiddlerAction = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
ManageTiddlerAction.prototype = new Widget();

/*
Render this widget into the DOM
*/
ManageTiddlerAction.prototype.render = function(parent,nextSibling) {
	this.computeAttributes();
	this.execute();
};

/*
Compute the internal state of the widget
*/
ManageTiddlerAction.prototype.execute = function() {
	this.tiddler = this.getAttribute("tiddler");
};

/*
Invoke the action associated with this widget
*/
ManageTiddlerAction.prototype.invokeAction = function(triggeringWidget,event) {
	var pathname = window.location.pathname;
	var paths = pathname.split("/");
	var recipeName = paths[paths.length - 1];
	var bagName = document.querySelector("h1.tc-site-title").innerHTML;
	window.location.href = "/admin/acl/"+recipeName+"/"+bagName;
};

/*
Refresh the widget by ensuring our attributes are up to date
*/
ManageTiddlerAction.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.tiddler) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

exports["action-managetiddler"] = ManageTiddlerAction;

})();
