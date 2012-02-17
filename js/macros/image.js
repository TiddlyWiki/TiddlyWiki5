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
	execute: function(macroNode,tiddler,store) {
		if(store.tiddlerExists(macroNode.params.src)) {
			var imageTree = store.parseTiddler(macroNode.params.src).tree,
				cloneImage = [];
			for(var t=0; t<imageTree.length; t++) {
				cloneImage.push(imageTree[t].clone());
			}
			if(macroNode.params.text) {
				return [Renderer.ElementNode("div",{
						alt: macroNode.params.text,
						title: macroNode.params.text
					},cloneImage)];
			} else {
				return cloneImage;	
			}
		} else {
			return [Renderer.ElementNode("img",{
				href: macroNode.params.src,
				alt: macroNode.params.text,
				title: macroNode.params.text
			})];
		}
	}
};

})();
