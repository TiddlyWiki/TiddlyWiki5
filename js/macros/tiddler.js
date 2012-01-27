/*\
title: js/macros/tiddler.js

\*/
(function(){

/*jslint node: true */
"use strict";

var utils = require("../Utils.js");

exports.macro = {
	name: "tiddler",
	types: ["text/html","text/plain"],
	cascadeParams: true, // Cascade names of named parameters to following anonymous parameters
	params: {
		target: {byName: "default", type: "tiddler", optional: false},
		"with": {byName: true, type: "text", optional: true, dependentAll: true}
	},
	handler: function(type,tiddler,store,params) {
		if(params["with"]) {
			// Parameterised transclusion
			var targetTiddler = store.getTiddler(params.target),
				text = targetTiddler.text;
			var withTokens = [params["with"]];
			for(var t=0; t<withTokens.length; t++) {
				var placeholderRegExp = new RegExp("\\$"+(t+1),"mg");
				text = text.replace(placeholderRegExp,withTokens[t]);
			}
			return store.renderText(targetTiddler.type,text,type,params.target);
		} else {
			// There's no parameterisation, so we can just render the target tiddler directly
			return store.renderTiddler(type,params.target);
		}
	}
};

})();
