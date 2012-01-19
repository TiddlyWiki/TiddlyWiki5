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
			info = params.info ? params.info : "parsetree",
			parseTree = store.parseTiddler(tiddler.title);
		switch(info) {
			case "parsetree":
				return "Parse tree: " + parseTree.toString(type);
				break;
			case "dependencies":
				if(parseTree.dependencies === null) {
					return encoder("Dependencies: *");
				} else {
					return encoder("Dependencies: " + parseTree.dependencies.join(", "));
				}
				break;
		}
	}
};

})();
