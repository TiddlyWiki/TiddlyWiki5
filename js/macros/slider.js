/*\
title: js/macros/slider.js

!Introduction
The slider macro is used to selectively reveal a chunk of text. By default, it renders as a button that may be clicked or touched to reveal the enclosed text.

The enclosed text can be a string of WikiText or be taken from a target tiddler.

The current state of the slider can be stored as the string "open" or "closed" in a specified tiddler. If the value of that tiddler changes then the slider is automatically updated. If no state tiddler is specified then the state of the slider isn't retained, but the slider still works as expected.
!!Parameters
|`state` //(defaults to 1st parameter)// |The title of the tiddler to contain the current state of the slider |
|`default` |The initial state of the slider, either `open` or `closed` |
|`content` |The WikiText to be enclosed in the slider. Overrides the `target` parameter, if present |
|`target` //(defaults to 2nd parameter)// |The title of the tiddler that contains the enclosed text. Ignored if the `content` parameter is specified |
|`label` //(defaults to 3rd parameter)// |The plain text to be displayed as the label for the slider button |
|`tooltip` //(defaults to 4th parameter)// |The plain text tooltip to be displayed when the mouse hovers over the slider button |
!!Examples
A minimal slider:
{{{
<<slider target:MyTiddler>>
}}}
!!Notes
The slider is a good study example of a simple interactive macro.
\*/
(function(){

/*jslint node: true */
"use strict";

var Renderer = require("../Renderer.js").Renderer,
    Dependencies = require("../Dependencies.js").Dependencies,
	Tiddler = require("../Tiddler.js").Tiddler,
	utils = require("../Utils.js");

function getOpenState(macroNode) {
	if(macroNode.params.hasOwnProperty("state")) {
		var stateTiddler = macroNode.store.getTiddler(macroNode.params.state);
		if(stateTiddler) {
			return stateTiddler.text.trim() === "open";
		}
	}
	if(macroNode.params.hasOwnProperty("default")) {
		return macroNode.params["default"] === "open";
	}
	return false;
}

function saveOpenState(macroNode) {
	if(macroNode.params.hasOwnProperty("state")) {
		var stateTiddler = macroNode.store.getTiddler(macroNode.params.state) ||
							new Tiddler({title: macroNode.params.state, text: ""});
		macroNode.store.addTiddler(new Tiddler(stateTiddler,{text: macroNode.isOpen ? "open" : "closed"}));
		return true;
	}
	return false;
}

function getSliderContent(macroNode) {
	if(macroNode.params.hasOwnProperty("content")) {
		return macroNode.store.parseText("text/x-tiddlywiki",macroNode.params.content).nodes;
	} else if(macroNode.params.hasOwnProperty("target")) {
		return [Renderer.MacroNode(
								"tiddler",
								{target: macroNode.params.target},
								null,
								macroNode.store)];
	} else {
		return [Renderer.ErrorNode("No content specified for slider")];
	}
}

exports.macro = {
	name: "slider",
	params: {
		state: {byPos: 0, type: "tiddler"},
		"default": {byName: true, type: "text"},
		target: {byPos: 1, type: "tiddler"},
		label: {byPos: 2, type: "text"},
		tooltip: {byPos: 3, type: "text"},
		content: {byName: true, type: "text"}
	},
	events: {
		click: function(event) {
			if(event.target === this.domNode.firstChild.firstChild) {
				this.isOpen = !this.isOpen;
				if(!saveOpenState.call(this)) {
					exports.macro.refreshInDom.call(this,{});
				}
				event.preventDefault();
				return false;
			} else {
				return true;	
			}
		}
	},
	execute: function() {
			this.isOpen = getOpenState.call(this);
			var sliderContent = [];
			if(this.isOpen) {
				sliderContent = getSliderContent.call(this);
			}
			var content = Renderer.SliderNode(this.params.state,
										this.params.label ? this.params.label : this.params.target,
										this.params.tooltip,
										this.isOpen,
										sliderContent);
			content.execute(this.parents,this.store.getTiddler(this.tiddlerTitle));
			return [content];
	},
	refreshInDom: function(changes) {
		var needContentRefresh = true; // Avoid refreshing the content nodes if we don't need to
		// If the state tiddler has changed then reset the open state
		if(this.params.hasOwnProperty("state") && changes.hasOwnProperty(this.params.state)) {
			this.isOpen = getOpenState.call(this);
		}
		// Render the content if the slider is open and we don't have any content yet
		if(this.isOpen && this.content[0].children[1].children.length === 0) {
			// Get the slider content and execute it
			this.content[0].children[1].children = getSliderContent.call(this);
			this.content[0].children[1].execute(this.parents,this.store.getTiddler(this.tiddlerTitle));
			// Replace the existing slider body DOM node
			this.domNode.firstChild.removeChild(this.domNode.firstChild.firstChild.nextSibling);
			this.content[0].children[1].renderInDom(this.domNode.firstChild,this.domNode.firstChild.firstChild.nextSibling);
			needContentRefresh = false; // Don't refresh the children if we've just created them
		}
		// Set the visibility of the slider content
		var el = this.domNode.firstChild.firstChild.nextSibling;
		el.style.display = this.isOpen ? "block" : "none";
		// Refresh any children
		if(needContentRefresh) {
			for(var t=0; t<this.content.length; t++) {
				this.content[t].refreshInDom(changes);
			}
		}
	}
};

})();

