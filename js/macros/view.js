/*\
title: js/macros/view.js

\*/
(function(){

/*jslint node: true */
"use strict";

var Renderer = require("../Renderer.js").Renderer,
	Dependencies = require("../Dependencies.js").Dependencies,
	utils = require("../Utils.js");

exports.macro = {
	name: "view",
	types: ["text/html","text/plain"],
	params: {
		field: {byPos: 0, type: "text"},
		format: {byPos: 1, type: "text"},
		template: {byPos: 2, type: "text"}
	},
	execute: function(macroNode,tiddler,store) {
		if(!tiddler) {
			return Renderer.TextNode("{{** Missing tiddler **}}");
		} else {
			var v = tiddler[macroNode.params.field],
				content,
				t,
				contentClone = [],
				parents = macroNode.parents;
			if(v !== undefined) {
				switch(macroNode.params.format) {
					case "link":
						var link = Renderer.MacroNode("link",
													{target: v},
													[Renderer.TextNode(v)],
													store);
						link.execute(parents,tiddler);
						return [link];
					case "wikified":
						if(macroNode.params.field === "text") {
							if(parents.indexOf(tiddler.title) === -1) {
								content = store.parseTiddler(tiddler.title).tree;
							} else {
								content = [Renderer.TextNode("{{** Tiddler recursion error in <<view>> macro **}}")];
							}
							parents = parents.slice(0);
							parents.push(tiddler.title);
						} else {
							content = store.parseText("text/x-tiddlywiki",v).tree;
						}
						for(t=0; t<content.length; t++) {
							contentClone.push(content[t].clone());
						}
						for(t=0; t<contentClone.length; t++) {
							contentClone[t].execute(parents,tiddler);
						}
						return contentClone;
					case "date":
						var template = macroNode.params.template || "DD MMM YYYY";
						return [Renderer.TextNode(utils.formatDateString(v,template))];
					default: // "text"
						return [Renderer.TextNode(v)];
				}
			}
		}
		return [];
	}
};

})();

