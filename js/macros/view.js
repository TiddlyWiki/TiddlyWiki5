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
	params: {
		field: {byPos: 0, type: "text"},
		format: {byPos: 1, type: "text"},
		template: {byPos: 2, type: "text"}
	},
	execute: function() {
		var tiddler = this.store.getTiddler(this.tiddlerTitle),
			field = this.hasParameter("field") ? this.params.field : "title",
			value,
			content,
			t,
			contentClone = [],
			parents = this.parents;
		if(tiddler) {
			value = tiddler[field];
		} else {
			switch(field) {
				case "text":
					value = "The tiddler '" + this.tiddlerTitle + "' does not exist";
					break;
				case "title":
					value = this.tiddlerTitle;
					break;
				case "modified":
				case "created":
					value = new Date();
					break;
				default:
					value = "Missing tiddler '" + this.tiddlerTitle + "'";
					break;
			}
		}
		switch(this.params.format) {
			case "link":
				if(value === undefined) {
					return [];
				} else {
					var link = Renderer.MacroNode("link",
												{target: value},
												[Renderer.TextNode(value)],
												this.store);
					link.execute(parents,this.tiddlerTitle);
					return [link];
				}
				break;
			case "wikified":
				if(tiddler && this.params.field === "text") {
					if(parents.indexOf(tiddler.title) !== -1) {
						content = [Renderer.ErrorNode("Tiddler recursion error in <<view>> macro")];
					} else {
						content = this.store.parseTiddler(tiddler.title).nodes;
					}
					parents = parents.slice(0);
					parents.push(tiddler.title);
				} else {
					content = this.store.parseText("text/x-tiddlywiki",value).nodes;
				}
				for(t=0; t<content.length; t++) {
					contentClone.push(content[t].clone());
				}
				for(t=0; t<contentClone.length; t++) {
					contentClone[t].execute(parents,this.tiddlerTitle);
				}
				return contentClone;
			case "date":
				var template = this.params.template || "DD MMM YYYY";
				if(value === undefined) {
					return [];
				} else {
					return [Renderer.TextNode(utils.formatDateString(value,template))];
				}
				break;
			default: // "text"
				return [Renderer.TextNode(value)];
		}
		return [];
	}
};

})();

