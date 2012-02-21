/*\
title: js/macros/image.js

\*/
(function(){

/*jslint node: true */
"use strict";

var Renderer = require("../Renderer.js").Renderer;

exports.macro = {
	name: "image",
	types: ["text/html","text/plain"],
	params: {
		src: {byName: "default", type: "tiddler"},
		text: {byName: true, type: "text"},
		alignment: {byName: true, type: "text"}
	},
	execute: function() {
		if(this.store.tiddlerExists(this.params.src)) {
			var imageTree = this.store.parseTiddler(this.params.src).tree,
				cloneImage = [];
			for(var t=0; t<imageTree.length; t++) {
				cloneImage.push(imageTree[t].clone());
			}
			if(this.params.text) {
				return [Renderer.ElementNode("div",{
						alt: this.params.text,
						title: this.params.text
					},cloneImage)];
			} else {
				return cloneImage;	
			}
		} else {
			return [Renderer.ElementNode("img",{
				href: this.params.src,
				alt: this.params.text,
				title: this.params.text
			})];
		}
	}
};

})();
