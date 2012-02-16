/*\
title: js/macros/slider.js

\*/
(function(){

/*jslint node: true */
"use strict";

var Renderer = require("../Renderer.js").Renderer,
	utils = require("../Utils.js");

exports.macro = {
	name: "slider",
	types: ["text/html","text/plain"],
	params: {
		name: {byPos: 0, type: "text", optional: false},
		targetTiddler: {byPos: 1, type: "tiddler", optional: false},
		label: {byPos: 2, type: "text", optional: false},
		tooltip: {byPos: 3, type: "text", optional: true}
	},
	events: {
		click: function(event,macroNode) {
			var el = event.currentTarget.firstChild.firstChild.nextSibling;
			el.style.display = el.style.display === "block" ? "none" : "block";
			event.preventDefault();
			return false;
		}
	},
	execute: function(macroNode,tiddler,store) {
			var target = macroNode.params.targetTiddler,
				dependencies = {include: {}};
			dependencies.include[target] = 1;
			var content = Renderer.SliderNode(macroNode.params.name,
										macroNode.params.label,
										macroNode.params.tooltip,
										[
											Renderer.MacroNode("tiddler",{target: target},null,dependencies,store)
										]);
			content.execute(tiddler);
			return [content];
	}
};

})();

