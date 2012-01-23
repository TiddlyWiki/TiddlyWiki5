/*\
title: js/macros/view.js

\*/
(function(){

/*jslint node: true */
"use strict";

var utils = require("../Utils.js");

exports.macro = {
	name: "view",
	types: ["text/html","text/plain"],
	params: {
		field: {byPos: 0, type: "text", optional: false},
		format: {byPos: 1, type: "text", optional: true},
		template: {byPos: 2, type: "text", optional: true}
	},
	handler: function(type,tiddler,store,params) {
		var encoder = type === "text/html" ? utils.htmlEncode : function(x) {return x;};
		if(!tiddler) {
			return "{{** Missing tiddler **}}";
		} else {
			var v = tiddler[params.field];
			if(v !== undefined) {
				switch(params.format) {
					case "link":
						return store.renderMacro("link",type,tiddler,{target: v},encoder(v));
					case "wikified":
						return store.renderTiddler(type,tiddler.title);
					case "date":
						var template = params.template || "DD MMM YYYY";
						return encoder(utils.formatDateString(v,template));
					default: // "text"
						return encoder(v);
				}
			}
		}
		return "";
	}
};

})();

