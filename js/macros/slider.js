/*\
title: js/macros/slider.js

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
		targetTiddler: {byPos: 1, type: "tiddler"},
		label: {byPos: 2, type: "text"},
		tooltip: {byPos: 3, type: "text"}
	},
	events: {
		click: function(event,macroNode) {
			if(event.target === event.currentTarget.firstChild.firstChild) {
				var el = event.currentTarget.firstChild.firstChild.nextSibling,
					stateTiddler = macroNode.params.state ? macroNode.store.getTiddler(macroNode.params.state) : null;
				stateTiddler = stateTiddler || new Tiddler({title: macroNode.params.state, text: ""});
				var isOpen = stateTiddler.text.trim() === "open";
				macroNode.store.addTiddler(new Tiddler(stateTiddler,{text: isOpen ? "closed" : "open"}));
				event.preventDefault();
				return false;
			} else {
				return true;	
			}
		}
	},
	execute: function(macroNode,tiddler,store) {
			var isOpen = macroNode.params.state ? store.getTiddlerText(macroNode.params.state,"").trim() === "open" : true,
				target = macroNode.params.targetTiddler;
			var content = Renderer.SliderNode(macroNode.params.state,
										macroNode.params.label ? macroNode.params.label : target,
										macroNode.params.tooltip,
										isOpen,
										[
											Renderer.MacroNode(
												"tiddler",
												{target: target},
												null,
												store)
										]);
			content.execute(macroNode.parents,tiddler);
			return [content];
	},
	refresh: function(changes,macroNode,tiddler,store) {
		if(macroNode.params.target && changes.hasOwnProperty(macroNode.params.target) !== -1) {
			// If the target has changed, re-render the macro
		} else if (macroNode.params.state && changes.hasOwnProperty(macroNode.params.state) !== -1) {
			// If it was just the state tiddler that's changed, set the display appropriately
			var el = macroNode.domNode.firstChild.firstChild.nextSibling,
				isOpen = macroNode.store.getTiddlerText(macroNode.params.state,"").trim() === "open";
			el.style.display = isOpen ? "block" : "none";
		}
	}
};

})();

