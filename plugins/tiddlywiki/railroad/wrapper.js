/*\
title: $:/plugins/tiddlywiki/railroad/wrapper.js
type: application/javascript
module-type: widget

Wrapper for `railroad-diagrams.js` that provides a `<$railroad>` widget.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var railroad = require("$:/plugins/tiddlywiki/railroad/railroad-diagrams.js"),
	Widget = require("$:/core/modules/widgets/widget.js").widget;

var RailroadWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
RailroadWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
RailroadWidget.prototype.render = function(parent,nextSibling) {
	// Housekeeping
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	// Render the children into a div
	var div = this.document.createElement("div");
	this.renderChildren(div,null);
	// Treat the rendered content as a JavaScript diagram recipe
	var recipe = "exports.svg = " + div.innerHTML;
	this.removeChildDomNodes();
	try {
		var sandbox = $tw.utils.extend(Object.create(null),railroad);
		sandbox.exports = {};
		$tw.utils.evalSandboxed(recipe,sandbox,'railroad-recipe');
		div.innerHTML = sandbox.exports.svg;
	} catch(ex) {
		div.className = "tc-error";
		div.textContent = ex;
	}
	// Insert it into the DOM
	parent.insertBefore(div,nextSibling);
	this.domNodes.push(div);
};

RailroadWidget.prototype.refresh = function(changedTiddlers) {
	if(this.refreshChildren(changedTiddlers)) {
		this.refreshSelf();
		return true;
	}
	return false;
};

exports.railroad = RailroadWidget;

})();