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
		state: {byPos: 0, type: "text"},
		targetTiddler: {byPos: 1, type: "tiddler"},
		label: {byPos: 2, type: "text"},
		tooltip: {byPos: 3, type: "text"}
	},
	events: {
		click: function(event,macroNode) {
			var el = event.currentTarget.firstChild.firstChild.nextSibling,
				stateTiddler = macroNode.params.state ? macroNode.store.getTiddler(macroNode.params.state) : {text: ""},
				isOpen = stateTiddler.text.trim() === "open";
			macroNode.store.addTiddler(new Tiddler(stateTiddler,{text: isOpen ? "closed" : "open"}));
			el.style.display = isOpen ? "none" : "block";
			event.preventDefault();
			return false;
		}
	},
	execute: function(macroNode,tiddler,store) {
			var stateTiddler = macroNode.params.state ? store.getTiddler(macroNode.params.state) : {text: ""},
				isOpen = stateTiddler.text.trim() === "open",
				target = macroNode.params.targetTiddler,
				dependencies = new Dependencies();
			dependencies.addDependency(target,true);
			var content = Renderer.SliderNode(macroNode.params.state,
										macroNode.params.label,
										macroNode.params.tooltip,
										isOpen,
										[
											Renderer.MacroNode("tiddler",{target: target},null,dependencies,store)
										]);
			content.execute(tiddler);
			return [content];
	}
};

})();

