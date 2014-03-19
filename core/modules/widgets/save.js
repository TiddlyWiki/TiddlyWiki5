/*\
title: $:/core/modules/widgets/save.js
type: application/javascript
module-type: widget

Reveal widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var saveWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
		this.addEventListeners([
		{type: "tw-save-tiddler", handler: "handleSaveTiddlerEvent"}
	])
};

/*
Inherit from the base widget class
*/
saveWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
saveWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent,nextSibling);
};
/*
Compute the internal state of the widget
*/
saveWidget.prototype.execute = function() {
	// Construct the child widgets
	this.makeChildWidgets();
};


saveWidget.prototype.refresh = function(changedTiddlers) {

	return this.refreshChildren(changedTiddlers);

};
saveWidget.prototype.dispatchMessage = function(event) {
	this.dispatchEvent({type: this.message, param: this.param, tiddlerTitle: this.getVariable("currentTiddler")});
};
saveWidget.prototype.handleSaveTiddlerEvent = function(event) {
	if (!this.saving) { //debounce save events 
		this.saving = true;
		this.saveChildren(true);//alert("save");
		return true;//propogate the save event to the navigator
	} else {
		return false;
	}
	
}
exports.save = saveWidget;

})();
