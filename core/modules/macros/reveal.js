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
		qualifyTiddlerTitles: {byName: true, type: "text"},
		"default": {byName: true, type: "text"},
		on: {byName: true, type: "text"},
		"class": {byName: true, type: "text"}
	}
};

exports.getOpenState = function() {
	if(this.stateTitle) {
		var on = this.params.on || "open";
		var stateTiddler = this.wiki.getTiddler(this.stateTitle);
		if(stateTiddler) {
			return stateTiddler.fields.text.trim() === on;
		}
	}
	if(this.hasParameter("default")) {
		return this.params["default"] === "open";
	}
	return false;
};

exports.executeMacro = function() {
	this.stateTitle = this.params.state;
	if(this.hasParameter("qualifyTiddlerTitles")) {
		this.stateTitle = "(" + this.parents.join(",") + "," + this.tiddlerTitle + ")" + this.stateTitle;
	}
	this.isOpen = this.getOpenState();
	var attributes = {
		"class": ["tw-reveal"]
	};
	if(this.hasParameter("class")) {
		attributes["class"].push(this.params["class"]);
	}
	if(this.classes) {
		$tw.utils.pushTop(attributes["class"],this.classes);
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
		this.isOpen = this.getOpenState();
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
	// Set the visibility of the children
	this.child.domNode.style.display = this.isOpen ? "block" : "none";
	// Refresh the children
	if(needChildrenRefresh) {
		for(t=0; t<this.child.children.length; t++) {
			this.child.children[t].refreshInDom(changes);
		}
	}
};

})();
