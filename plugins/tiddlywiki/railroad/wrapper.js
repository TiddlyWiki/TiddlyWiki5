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

var Parser = require("$:/plugins/tiddlywiki/railroad/parser.js").parser,
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
	// Get the source text
	var source = this.getAttribute("text",this.parseTreeNode.text || "");
	// Create a div to contain the SVG or error message
	var div = this.document.createElement("div");
	try {
		// Parse the source
		var parser = new Parser(source);
		if(this.getAttribute("mode","svg") === "debug") {
			var output = ["<pre>"];
			parser.root.debug(output, "");
			output.push("</pre>");
			div.innerHTML = output.join("");
		} else {
			div.innerHTML = parser.root.toSvg();
		}
	} catch(ex) {
		div.className = "tc-error";
		div.textContent = ex;
	}
	// Insert it into the DOM
	parent.insertBefore(div,nextSibling);
	this.domNodes.push(div);
};

RailroadWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.text) {
		this.refreshSelf();
		return true;
	}
	return false;	
};

exports.railroad = RailroadWidget;

})();