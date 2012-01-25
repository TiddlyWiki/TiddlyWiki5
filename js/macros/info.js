/*\
title: js/macros/info.js

\*/
(function(){

/*jslint node: true */
"use strict";

var utils = require("../Utils.js");

exports.macro = {
	name: "info",
	types: ["text/html","text/plain"],
	params: {
		info: {byName: "default", type: "text", optional: false}
	},
	handler: function(type,tiddler,store,params) {
		var encoder = type === "text/html" ? utils.htmlEncode : function(x) {return x;},
			info = params.info || "parsetree";
		if(tiddler) {
			var parseTree = store.parseTiddler(tiddler.title);
			switch(info) {
				case "parsetree":
					return utils.stitchSlider(type,"Parse tree","The parse tree for this tiddler",parseTree.toString(type));
					//break;
				case "compiled":
					return utils.stitchSlider(type,"Render functions","The render functions for this tiddler",parseTree.compile(type).toString(type));
					//break;
				case "dependencies":
					if(parseTree.dependencies === null) {
						return encoder("Dependencies: *");
					} else {
						return encoder("Dependencies: " + parseTree.dependencies.join(", "));
					}
					break;
			}
		}
	}
};

})();
