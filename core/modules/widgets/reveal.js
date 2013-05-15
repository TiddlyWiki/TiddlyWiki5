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

var RevealWidget = function(renderer) {
	// Save state
	this.renderer = renderer;
	// Generate child nodes
	this.generate();
};

RevealWidget.prototype.generate = function() {
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
		this.stateTitle =  this.stateTitle + "-" + this.renderer.renderTree.getContextScopeId(this.renderer.parentRenderer);
	}
	this.readState();
	// Set up the element attributes
	var classes = ["tw-reveal"],
		styles = [];
	if(this["class"]) {
		$tw.utils.pushTop(classes,this["class"]);
	}
	switch(this.type) {
		case "popup":
			styles.push("position:absolute;");
			classes.push("tw-popup");
			break;
	}
	styles.push("display:" + (this.isOpen ? (this.renderer.parseTreeNode.isBlock ? "block" : "inline") : "none") + ";");
	// Set the element
	this.tag =  "div";
	this.attributes = {
		"class": classes.join(" "),
		style: styles.join("")
	};
	this.children = this.renderer.renderTree.createRenderers(this.renderer,this.isOpen ? this.renderer.parseTreeNode.children : []);
	this.events = [{name: "click", handlerObject: this, handlerMethod: "handleClickEvent"}];
};

/*
Read the state tiddler
*/
RevealWidget.prototype.readState = function() {
	// Read the information from the state tiddler
	if(this.stateTitle) {
		var state = this.renderer.renderTree.wiki.getTextReference(this.stateTitle,this["default"],this.renderer.tiddlerTitle);
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

RevealWidget.prototype.readMatchState = function(state) {
	this.isOpen = state === this.text;
};

RevealWidget.prototype.readPopupState = function(state) {
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

RevealWidget.prototype.handleClickEvent = function(event) {
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

RevealWidget.prototype.refreshInDom = function(changedAttributes,changedTiddlers) {
	// Check if any of our attributes have changed, or if a tiddler we're interested in has changed
	if(changedAttributes.state || changedAttributes.type || changedAttributes.text || changedAttributes.position || changedAttributes["default"] || changedAttributes.qualifyTiddlerTitles || changedAttributes["class"]) {
		// Regenerate and rerender the widget and replace the existing DOM node
		this.generate();
		var oldDomNode = this.renderer.domNode,
			newDomNode = this.renderer.renderInDom();
		oldDomNode.parentNode.replaceChild(newDomNode,oldDomNode);
	} else {
		var needChildrenRefresh = true; // Avoid refreshing the children nodes if we don't need to
		// Get the open state
		this.readState();
		// Construct the child nodes if  required
		if(this.isOpen && this.children.length === 0) {
			this.children = this.renderer.renderTree.createRenderers(this.renderer,this.renderer.parseTreeNode.children);
			var parentNode = this.renderer.domNode;
			$tw.utils.each(this.children,function(child) {
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
		this.renderer.domNode.style.display = this.isOpen ? (this.renderer.parseTreeNode.isBlock ? "block" : "inline") : "none";
	}
	// Position the content if required
	if(this.isOpen) {
		this.postRenderInDom();
	}
};

RevealWidget.prototype.postRenderInDom = function() {
	switch(this.type) {
		case "popup":
			if(this.isOpen) {
				this.renderer.domNode.style.position = "absolute";
				this.renderer.domNode.style.zIndex = "1000";
				switch(this.position) {
					case "left":
						this.renderer.domNode.style.left = (this.popup.left - this.renderer.domNode.offsetWidth) + "px";
						this.renderer.domNode.style.top = this.popup.top + "px";
						break;
					case "above":
						this.renderer.domNode.style.left = this.popup.left + "px";
						this.renderer.domNode.style.top = (this.popup.top - this.renderer.domNode.offsetHeight) + "px";
						break;
					case "aboveright":
						this.renderer.domNode.style.left = (this.popup.left + this.popup.width) + "px";
						this.renderer.domNode.style.top = (this.popup.top + this.popup.height - this.renderer.domNode.offsetHeight) + "px";
						break;
					case "right":
						this.renderer.domNode.style.left = (this.popup.left + this.popup.width) + "px";
						this.renderer.domNode.style.top = this.popup.top + "px";
						break;
					case "belowleft":
						this.renderer.domNode.style.left = (this.popup.left + this.popup.width - this.renderer.domNode.offsetWidth) + "px";
						this.renderer.domNode.style.top = (this.popup.top + this.popup.height) + "px";
						break;
					default: // Below
						this.renderer.domNode.style.left = this.popup.left + "px";
						this.renderer.domNode.style.top = (this.popup.top + this.popup.height) + "px";
						break;
				}
			}
			break;
	}
};

exports.reveal = RevealWidget;

})();
