/*\
title: js/macros/image.js

\*/
(function(){

/*jslint node: true */
"use strict";

var HTML = require("../HTML.js").HTML,
	utils = require("../Utils.js");

exports.macro = {
	name: "image",
	types: ["text/html","text/plain"],
	params: {
		src: {byName: "default", type: "tiddler", optional: false},
		text: {byName: true, type: "text", optional: true},
		alignment: {byName: true, type: "text", optional: true}
	},
	render: function(type,tiddler,store,params) {
		if(type === "text/html") {
			if(store.tiddlerExists(params.src)) {
				if(params.text) {
					return HTML(HTML.elem("div",{
							alt: params.text,
							title: params.text
						},[
							HTML.raw(store.renderTiddler(type,params.src))
						]));
				} else {
					return store.renderTiddler(type,params.src);	
				}
			} else {
				return HTML(HTML.elem("img",{
					href: params.src,
					alt: params.text,
					title: params.text
				}));
			}
		} else if (type === "text/plain") {
			return params.text ? params.text : "";	
		}
	}
};

})();
