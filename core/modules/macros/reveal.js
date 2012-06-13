/*\
title: $:/core/modules/macros/reveal.js
type: application/javascript
module-type: macro

The reveal macro shows or hides content according to the value of the text in a specified tiddler.

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
		position: {byName: true, type: "text"},
		qualifyTiddlerTitles: {byName: true, type: "text"},
		"default": {byName: true, type: "text"},
		"class": {byName: true, type: "text"}
	},
	events: ["click"]
};

exports.readState = function() {
	// Start with the default value for being open or closed
	if(this.hasParameter("default")) {
		this.isOpen = this.params["default"] === "open";
	}
	// Read the information from the state tiddler
	if(this.stateTitle) {
		var stateTiddler = this.wiki.getTiddler(this.stateTitle);
		if(stateTiddler) {
			var state = stateTiddler ? stateTiddler.fields.text : "";
			switch(this.params.type) {
				case "popup":
					this.readPopupState(state);
					break;
			}
		}
	}
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
	if(event.type === "click") {
		// Cancel the popup if we get a click on it
		var tiddler = this.wiki.getTiddler(this.stateTitle);
		this.wiki.addTiddler(new $tw.Tiddler(tiddler,{title: this.stateTitle, text: ""}),true);
	}
};

exports.executeMacro = function() {
	this.stateTitle = this.params.state;
	if(this.hasParameter("qualifyTiddlerTitles")) {
		this.stateTitle = "(" + this.parents.join(",") + "," + this.tiddlerTitle + ")" + this.stateTitle;
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
	var child = $tw.Tree.Element("div",attributes,this.isOpen ? this.content : []);
	child.execute(this.parents,this.tiddlerTitle);
	return child;
};

exports.refreshInDom = function(changes) {
	var needChildrenRefresh = true, // Avoid refreshing the children nodes if we don't need to
		t;
	// If the state tiddler has changed then reset the open state
	if($tw.utils.hop(changes,this.stateTitle)) {
		 this.readState();
	}
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
					default: // Below
						this.child.domNode.style.left = this.popup.left + "px";
						this.child.domNode.style.top = (this.popup.top + this.popup.height) + "px";
						break;
				}
			}
			break;
	}
};

})();
