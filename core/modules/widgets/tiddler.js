/*\
title: $:/core/modules/widgets/tiddler.js
type: application/javascript
module-type: widget
\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var TiddlerWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

TiddlerWidget.prototype = new Widget();

TiddlerWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent,nextSibling);
};

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
