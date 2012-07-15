/*\
title: $:/core/modules/macros/reveal.js
type: application/javascript
module-type: macro

The reveal macro shows or hides content according to the value of the text in a specified tiddler.

The parameters are:

* ''state'' - text reference where the hide/reveal state is stored
* ''type'' - type of the hide/reveal state:
** //popup// - a popup - the state tiddler should contain the page coordinates of the button that triggered the popup
** //match// - reveals if the state tiddler matches the match text
* ''position'' - popup position: //left//, //above//, //right//, //below// or //belowleft//
* ''text'' - match text
* ''qualifyTiddlerTitles'' - if present, causes the title of the state tiddler to be qualified with the current tiddler stack
* ''default'' - default hide/reveal state: `open` if visible, otherwise hidden
* ''class'' - CSS class(es) to be assigned to the 

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "reveal",
	params: {
		state: {byPos: 0, type: "tiddler"},
		type: {byName: true, type: "text"},
		text: {byName: true, type: "text"},
		position: {byName: true, type: "text"},
		qualifyTiddlerTitles: {byName: true, type: "text"},
		"default": {byName: true, type: "text"},
		"class": {byName: true, type: "text"}
	}
};

exports.readState = function() {
	// Start with the default value for being open or closed
	if(this.hasParameter("default")) {
		this.isOpen = this.params["default"] === "open";
	}
	// Read the information from the state tiddler
	if(this.stateTextRef) {
		var state = this.wiki.getTextReference(this.stateTextRef,"",this.tiddlerTitle);
		switch(this.params.type) {
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
	this.isOpen = state === this.params.text;
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

exports.handleEvent = function(event) {
	if(event.type === "click" && this.params.type === "popup") {
		// Cancel the popup if we get a click on it
		if(this.stateTextRef) {
			this.wiki.deleteTextReference(this.stateTextRef);
		}
		event.preventDefault();
		return false;
	}
	return true;
};

exports.executeMacro = function() {
	this.stateTextRef = this.params.state;
	if(this.hasParameter("qualifyTiddlerTitles")) {
		this.stateTextRef = "(" + this.parents.join(",") + "," + this.tiddlerTitle + ")" + this.stateTextRef;
	}
	this.readState();
	var attributes = {
		"class": ["tw-reveal"],
		style: {}
	};
	if(this.hasParameter("class")) {
		attributes["class"].push(this.params["class"]);
	}
	if(this.classes) {
		$tw.utils.pushTop(attributes["class"],this.classes);
	}
	switch(this.params.type) {
		case "popup":
			attributes.style.position = "absolute";
			attributes["class"].push("tw-popup");
			break;
	}
	attributes.style = {display: this.isOpen ? "block" : "none"};
	var child = $tw.Tree.Element(this.isBlock ? "div" : "span",attributes,this.isOpen ? this.content : [],{
		events: ["click"],
		eventHandler: this
	});
	child.execute(this.parents,this.tiddlerTitle);
	return child;
};

exports.postRenderInDom = function() {
	switch(this.params.type) {
		case "popup":
			if(this.isOpen) {
				this.child.domNode.style.position = "absolute";
				this.child.domNode.style.zIndex = "1000";
				switch(this.params.position) {
					case "left":
						this.child.domNode.style.left = (this.popup.left - this.child.domNode.offsetWidth) + "px";
						this.child.domNode.style.top = this.popup.top + "px";
						break;
					case "above":
						this.child.domNode.style.left = this.popup.left + "px";
						this.child.domNode.style.top = (this.popup.top - this.child.domNode.offsetHeight) + "px";
						break;
					case "right":
						this.child.domNode.style.left = (this.popup.left + this.popup.width) + "px";
						this.child.domNode.style.top = this.popup.top + "px";
						break;
					case "belowleft":
						this.child.domNode.style.left = (this.popup.left + this.popup.width - this.child.domNode.offsetWidth) + "px";
						this.child.domNode.style.top = (this.popup.top + this.popup.height) + "px";
						break;
					default: // Below
						this.child.domNode.style.left = this.popup.left + "px";
						this.child.domNode.style.top = (this.popup.top + this.popup.height) + "px";
						break;
				}
			}
			break;
	}
};

exports.refreshInDom = function(changes) {
	var needChildrenRefresh = true, // Avoid refreshing the children nodes if we don't need to
		t;
	// Re-read the open state
	this.readState();
	// Render the children if we're open and we don't have any children yet
	if(this.isOpen && this.child.children.length === 0) {
		// Install the children and execute them
		this.child.children = this.content;
		for(t=0; t<this.child.children.length; t++) {
			this.child.children[t].execute(this.parents,this.tiddlerTitle);
			this.child.children[t].renderInDom(this.child.domNode);
		}
		needChildrenRefresh = false; // Don't refresh the children if we've just created them
	}
	// Refresh the children
	if(needChildrenRefresh) {
		for(t=0; t<this.child.children.length; t++) {
			this.child.children[t].refreshInDom(changes);
		}
	}
	// Set the visibility of the children
	this.child.domNode.style.display = this.isOpen ? "block" : "none";
	// Position the content if required
	this.postRenderInDom();
};

})();
