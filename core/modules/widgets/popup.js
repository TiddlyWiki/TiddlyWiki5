/*\
title: $:/core/modules/widget/popup.js
type: application/javascript
module-type: widget

Implements the popup widget.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "popup";

exports.init = function(renderer) {
	// Save state
	this.renderer = renderer;
	// Generate child nodes
	this.generateChildNodes();
};

exports.generateChildNodes = function() {
	// Get the parameters from the attributes
	this.hover = this.renderer.getAttribute("hover");
	this["class"] = this.renderer.getAttribute("class");
	// Find the handle and body in the parse tree children
	var handle = $tw.utils.findParseTreeNode(this.renderer.parseTreeNode.children,{type: "widget", tag: "handle"}),
		body = $tw.utils.findParseTreeNode(this.renderer.parseTreeNode.children,{type: "widget", tag: "body"});
	// Compose the elements
	var classes = ["tw-popup-wrapper"];
	if(this["class"]) {
		$tw.utils.pushTop(classes,this["class"]);
	}
	var events = [{name: "click", handlerObject: this, handlerMethod: "handleClickEvent"}];
	if(this.hover === "yes") {
		events.push({name: "mouseover", handlerObject: this, handlerMethod: "handleMouseOverOrOutEvent"});
		events.push({name: "mouseout", handlerObject: this, handlerMethod: "handleMouseOverOrOutEvent"});
	}
	this.children = this.renderer.renderTree.createRenderers(this.renderer.renderContext,[
	{
		type: "element",
		tag: "button",
		attributes: {
			"class": {type: "string", value: classes.join(" ")}
		},
		children: handle.children,
		events: events
	},
	{
		type: "element",
		tag: "div",
		children: body.children,
		attributes: {
			style: {
				type: "string",
				value: "display:none;"
			}
		}
	}
	]);
};

exports.triggerPopup = function(event) {
};

exports.handleClickEvent = function(event) {
	this.triggerPopup(event);
	event.preventDefault();
	return false;
};

exports.refreshInDom = function(changedAttributes,changedTiddlers) {
	// Check if any of our attributes have changed, or if a tiddler we're interested in has changed
 	if(changedAttributes.hover || changedAttributes["class"] ) {
		// Remove old child nodes
		$tw.utils.removeChildren(this.parentElement);
		// Regenerate and render children
		this.generateChildNodes();
		var self = this;
		$tw.utils.each(this.children,function(node) {
			if(node.renderInDom) {
				self.parentElement.appendChild(node.renderInDom());
			}
		});
	} else {
		// We don't need to refresh ourselves, so just refresh any child nodes
		$tw.utils.each(this.children,function(node) {
			if(node.refreshInDom) {
				node.refreshInDom(changedTiddlers);
			}
		});
	}
};

})();
