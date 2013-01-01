/*\
title: $:/core/modules/widget/reveal.js
type: application/javascript
module-type: widget

Implements the reveal widget.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "reveal";

exports.init = function(renderer) {
	// Save state
	this.renderer = renderer;
	// Generate child nodes
	this.generateChildNodes();
};

exports.generateChildNodes = function() {
	// Get the parameters from the attributes
	this.state = this.renderer.getAttribute("state");
	this.type = this.renderer.getAttribute("type");
	this.text = this.renderer.getAttribute("text");
	this.position = this.renderer.getAttribute("position");
	this["default"] = this.renderer.getAttribute("default");
	this.qualifyTiddlerTitles = this.renderer.getAttribute("qualifyTiddlerTitles");
	this["class"] = this.renderer.getAttribute("class");
	// Compute the title of the state tiddler and read it
	this.stateTitle = this.state;
	if(this.qualifyTiddlerTitles) {
		this.stateTitle =  this.stateTitle + "-" + this.renderer.getContextScopeId();
	}
	this.readState();
	// Compose the node
	var node = {
		type: "element",
		tag: "div",
		children: this.isOpen ? this.renderer.parseTreeNode.children : [],
		events: [{name: "click", handlerObject: this, handlerMethod: "handleClickEvent"}]
	};
	$tw.utils.addClassToParseTreeNode(node,"tw-reveal");
	if(this["class"]) {
		$tw.utils.addClassToParseTreeNode(node,this["class"].join(" "));
	}
	switch(this.type) {
		case "popup":
			$tw.utils.addStyleToParseTreeNode(node,"position","absolute");
			$tw.utils.addClassToParseTreeNode(node,"tw-popup");
			break;
	}
	$tw.utils.addStyleToParseTreeNode(node,"display",this.isOpen ? (this.isBlock ? "block" : "inline") : "none");
	// Return the node
	this.children = this.renderer.renderTree.createRenderers(this.renderer.renderContext,[node]);
};

/*
Read the state tiddler
*/
exports.readState = function() {
	// Start with the default value for being open or closed
	if(this["default"]) {
		this.isOpen = this["default"] === "open";
	}
	// Read the information from the state tiddler
	if(this.stateTitle) {
		var state = this.renderer.renderTree.wiki.getTextReference(this.stateTitle);
		switch(this.type) {
			case "popup":
				this.readPopupState(state);
				break;
			case "match":
				this.readMatchState(state);
				break;
			case "nomatch":
				this.readMatchState(state);
				this.isOpen = !this.isOpen;
				break;
		}
	}
};

exports.readMatchState = function(state) {
	this.isOpen = state === this.text;
};

exports.readPopupState = function(state) {
	var popupLocationRegExp = /^\((-?[0-9\.E]+),(-?[0-9\.E]+),(-?[0-9\.E]+),(-?[0-9\.E]+)\)$/,
		match = popupLocationRegExp.exec(state);
	// Check if the state matches the location regexp
	if(match) {
		// If so, we're open
		this.isOpen = true;
		// Get the location
		this.popup = {
			left: parseFloat(match[1]),
			top: parseFloat(match[2]),
			width: parseFloat(match[3]),
			height: parseFloat(match[4])
		};
	} else {
		// If not, we're closed
		this.isOpen = false;
	}
};

exports.handleClickEvent = function(event) {
	if(event.type === "click" && this.type === "popup") {
		// Cancel the popup if we get a click on it
		if(this.stateTitle) {
			this.renderer.renderTree.wiki.deleteTextReference(this.stateTitle);
		}
		event.preventDefault();
		return false;
	}
	return true;
};

exports.refreshInDom = function(changedAttributes,changedTiddlers) {
	// Check if any of our attributes have changed, or if a tiddler we're interested in has changed
	if(changedAttributes.state || changedAttributes.type || changedAttributes.text || changedAttributes.position || changedAttributes["default"] || changedAttributes.qualifyTiddlerTitles || changedAttributes["class"]) {
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
		var needChildrenRefresh = true; // Avoid refreshing the children nodes if we don't need to
		// Get the open state
		this.readState();
		// Construct the child nodes if  required
		if(this.isOpen && this.children[0].children.length === 0) {
			this.children[0].children = this.renderer.renderTree.createRenderers(this.renderer.renderContext,this.renderer.parseTreeNode.children);
			var parentNode = this.children[0].domNode;
			$tw.utils.each(this.children[0].children,function(child) {
				parentNode.appendChild(child.renderInDom());
			});
			needChildrenRefresh = false;
		}
		// Refresh any child nodes
		if(needChildrenRefresh) {
			$tw.utils.each(this.children,function(node) {
				if(node.refreshInDom) {
					node.refreshInDom(changedTiddlers);
				}
			});
		}
		// Set the visibility of the children
		this.children[0].domNode.style.display = this.isOpen ? (this.isBlock ? "block" : "inline") : "none";
	}
	// Position the content if required
	this.postRenderInDom();
};

exports.postRenderInDom = function() {
	switch(this.type) {
		case "popup":
			if(this.isOpen) {
				this.children[0].domNode.style.position = "absolute";
				this.children[0].domNode.style.zIndex = "1000";
				switch(this.position) {
					case "left":
						this.children[0].domNode.style.left = (this.popup.left - this.children[0].domNode.offsetWidth) + "px";
						this.children[0].domNode.style.top = this.popup.top + "px";
						break;
					case "above":
						this.children[0].domNode.style.left = this.popup.left + "px";
						this.children[0].domNode.style.top = (this.popup.top - this.children[0].domNode.offsetHeight) + "px";
						break;
					case "aboveright":
						this.children[0].domNode.style.left = (this.popup.left + this.popup.width) + "px";
						this.children[0].domNode.style.top = (this.popup.top + this.popup.height - this.children[0].domNode.offsetHeight) + "px";
						break;
					case "right":
						this.children[0].domNode.style.left = (this.popup.left + this.popup.width) + "px";
						this.children[0].domNode.style.top = this.popup.top + "px";
						break;
					case "belowleft":
						this.children[0].domNode.style.left = (this.popup.left + this.popup.width - this.children[0].domNode.offsetWidth) + "px";
						this.children[0].domNode.style.top = (this.popup.top + this.popup.height) + "px";
						break;
					default: // Below
						this.children[0].domNode.style.left = this.popup.left + "px";
						this.children[0].domNode.style.top = (this.popup.top + this.popup.height) + "px";
						break;
				}
			}
			break;
	}
};

})();
