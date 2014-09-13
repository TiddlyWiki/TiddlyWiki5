/*\
title: $:/core/modules/widgets/linkcatcher.js
type: application/javascript
module-type: widget

Linkcatcher widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var LinkCatcherWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
	this.addEventListeners([
		{type: "tm-navigate", handler: "handleNavigateEvent"}
	]);
};

/*
Inherit from the base widget class
*/
LinkCatcherWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
LinkCatcherWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent,nextSibling);
};

/*
Compute the internal state of the widget
*/
LinkCatcherWidget.prototype.execute = function() {
	// Get our parameters
	this.catchTo = this.getAttribute("to");
	this.catchMessage = this.getAttribute("message");
	this.catchSet = this.getAttribute("set");
	this.catchSetTo = this.getAttribute("setTo");
	// Construct the child widgets
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
LinkCatcherWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.to || changedAttributes.message || changedAttributes.set || changedAttributes.setTo) {
		this.refreshSelf();
		return true;
	} else {
		return this.refreshChildren(changedTiddlers);		
	}
};

/*
Handle a tm-navigate event
*/
LinkCatcherWidget.prototype.handleNavigateEvent = function(event) {
	if(this.catchTo) {
		this.wiki.setTextReference(this.catchTo,event.navigateTo,this.getVariable("currentTiddler"));
	}
	if(this.catchMessage && this.parentWidget) {
		this.parentWidget.dispatchEvent({
			type: this.catchMessage,
			param: event.navigateTo,
			navigateTo: event.navigateTo
		});
	}
	if(this.catchSet) {
		var tiddler = this.wiki.getTiddler(this.catchSet);
		this.wiki.addTiddler(new $tw.Tiddler(tiddler,{title: this.catchSet, text: this.catchSetTo}));
	}
	return false;
};

exports.linkcatcher = LinkCatcherWidget;

})();
