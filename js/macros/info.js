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
	},
	handler: function(type,tiddler,store,params) {
		var encoder = type === "text/html" ? utils.htmlEncode : function(x) {return x;},
			parseTree = store.parseTiddler(tiddler.fields.title);
		if(parseTree) {
			var r = [];
			var d = parseTree.dependencies;
			if(d === null) {
				r.push(encoder("Dependencies: *"));
			} else {
				r.push(encoder("Dependencies: " + d.join(", ")));
			}
			return r.join("/n");
		} else {
			return "";
		}
	}
};

})();
