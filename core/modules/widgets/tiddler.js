/*\
title: $:/core/modules/widgets/tiddler.js
type: application/javascript
module-type: widget

Tiddler widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var TiddlerWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
TiddlerWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
TiddlerWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent,nextSibling);
};

/*
Compute the internal state of the widget
*/
TiddlerWidget.prototype.execute = function() {
	this.tiddlerState = this.computeTiddlerState();
	this.setVariable("currentTiddler",this.tiddlerState.currentTiddler);
	this.setVariable("missingTiddlerClass",this.tiddlerState.missingTiddlerClass);
	this.setVariable("shadowTiddlerClass",this.tiddlerState.shadowTiddlerClass);
	this.setVariable("systemTiddlerClass",this.tiddlerState.systemTiddlerClass);
	this.setVariable("tiddlerTagClasses",this.tiddlerState.tiddlerTagClasses);
	// Construct the child widgets
	this.makeChildWidgets();
};

/*
Compute the tiddler state flags
*/
TiddlerWidget.prototype.computeTiddlerState = function() {
	// Get our parameters
	this.tiddlerTitle = this.getAttribute("tiddler",this.getVariable("currentTiddler"));
	// Compute the state
	var state = {
		currentTiddler: this.tiddlerTitle || "",
		missingTiddlerClass: (this.wiki.tiddlerExists(this.tiddlerTitle) || this.wiki.isShadowTiddler(this.tiddlerTitle)) ? "tc-tiddler-exists" : "tc-tiddler-missing",
		shadowTiddlerClass: this.wiki.isShadowTiddler(this.tiddlerTitle) ? "tc-tiddler-shadow" : "",
		systemTiddlerClass: this.wiki.isSystemTiddler(this.tiddlerTitle) ? "tc-tiddler-system" : "",
		tiddlerTagClasses: this.getTagClasses()
	};
	// Compute a simple hash to make it easier to detect changes
	state.hash = state.currentTiddler + state.missingTiddlerClass + state.shadowTiddlerClass + state.systemTiddlerClass + state.tiddlerTagClasses;
	return state;
};

/*
Create a string of CSS classes derived from the tags of the current tiddler
*/
TiddlerWidget.prototype.getTagClasses = function() {
	var tiddler = this.wiki.getTiddler(this.tiddlerTitle);
	if(tiddler) {
		var tags = [];
		$tw.utils.each(tiddler.fields.tags,function(tag) {
			tags.push("tc-tagged-" + encodeURIComponent(tag));
		});
		return tags.join(" ");
	} else {
		return "";
	}
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
TiddlerWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes(),
		newTiddlerState = this.computeTiddlerState();
	if(changedAttributes.tiddler || newTiddlerState.hash !== this.tiddlerState.hash) {
		this.refreshSelf();
		return true;
	} else {
		return this.refreshChildren(changedTiddlers);
	}
};

exports.tiddler = TiddlerWidget;

})();
