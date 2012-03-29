/*\
title: js/macros/edit.js

\*/
(function(){

/*jslint node: true */
"use strict";

var Renderer = require("../Renderer.js").Renderer,
	Dependencies = require("../Dependencies.js").Dependencies,
	utils = require("../Utils.js");

exports.macro = {
	name: "edit",
	params: {
		field: {byPos: 0, type: "text"}
	},
	execute: function() {
		var tiddler = this.store.getTiddler(this.tiddlerTitle),
			field = this.hasParameter("field") ? this.params.field : "title",
			value;
		if(tiddler) {
			value = tiddler[field];
		} else {
			switch(field) {
				case "text":
					value = "Type the text for the tiddler '" + this.tiddlerTitle + "'";
					break;
				case "title":
					value = this.tiddlerTitle;
					break;
				default:
					value = "";
					break;
			}
		}
		var attributes = {
			"contenteditable": true,
			"class": ["tw-edit-field"]
		};
		return [Renderer.ElementNode("div",attributes,[Renderer.TextNode(value)])];
	}
};

})();

