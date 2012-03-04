/*\
title: js/macros/slider.js

!Introduction
The slider macro is used to selectively reveal a chunk of text. By default, it renders as a button that may be clicked or touched to reveal the enclosed text.

The enclosed text can be a string of WikiText or be taken from a target tiddler.
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

exports.macro = {
	name: "slider",
	types: ["text/html","text/plain"],
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
			if(event.target === event.currentTarget.firstChild.firstChild) {
				var el = event.currentTarget.firstChild.firstChild.nextSibling,
					stateTiddler = this.params.state ? this.store.getTiddler(this.params.state) : null;
				stateTiddler = stateTiddler || new Tiddler({title: this.params.state, text: ""});
				var isOpen = stateTiddler.text.trim() === "open";
				this.store.addTiddler(new Tiddler(stateTiddler,{text: isOpen ? "closed" : "open"}));
				event.preventDefault();
				return false;
			} else {
				return true;	
			}
		}
	},
	execute: function() {
			var isOpen = this.params.state ? this.store.getTiddlerText(this.params.state,"").trim() === "open" : true,
				target = this.params.target,
				sliderContent;
			if(this.params.hasOwnProperty("content")) {
				sliderContent = this.store.parseText("text/x-tiddlywiki",this.params.content).nodes;
			} else {
				sliderContent = [Renderer.MacroNode(
										"tiddler",
										{target: target},
										null,
										this.store)];
			}
			var content = Renderer.SliderNode(this.params.state,
										this.params.label ? this.params.label : target,
										this.params.tooltip,
										isOpen,
										sliderContent);
			content.execute(this.parents,this.store.getTiddler(this.tiddlerText));
			return [content];
	},
	refreshInDom: function(changes) {
		if(this.params.target && changes.hasOwnProperty(this.params.target)) {
			// If the target has changed, re-render the macro
		} else {
			if (this.params.state && changes.hasOwnProperty(this.params.state)) {
				// If it was just the state tiddler that's changed, set the display appropriately
				var el = this.domNode.firstChild.firstChild.nextSibling,
					isOpen = this.store.getTiddlerText(this.params.state,"").trim() === "open";
				el.style.display = isOpen ? "block" : "none";
			}
			// Refresh any children
			for(var t=0; t<this.content.length; t++) {
				this.content[t].refreshInDom(changes);
			}
		}
	}
};

})();

