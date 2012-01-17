/*\
title: js/macros/image.js

\*/
(function(){

/*jslint node: true */
"use strict";

var utils = require("../Utils.js");

exports.macro = {
	name: "image",
	types: ["text/html","text/plain"],
	params: {
		src: {byName: "default", type: "tiddler", optional: false},
		text: {byName: true, type: "text", optional: true},
		alignment: {byName: true, type: "text", optional: true}
	},
	handler: function(type,tiddler,store,params) {
		if(type === "text/html") {
			if(store.tiddlerExists(params.src)) {
				if(params.text) {
					return utils.stitchElement("div",{
						alt: params.text,
						title: params.text
					},{
						content: store.renderTiddler(type,params.src)
					});
				} else {
					return store.renderTiddler(type,params.src);	
				}
			} else {
				return utils.stitchElement("img",{
					href: params.src,
					alt: params.text,
					title: params.text
				},{
					selfClosing: true
				});
			}
		} else if (type === "text/plain") {
			return params.text ? params.text : "";	
		}
	}
};

})();
